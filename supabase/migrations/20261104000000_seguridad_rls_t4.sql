-- T4 (RNF-01, RNF-30, RF-67): cierra accesos encontrados en la auditoría de seguridad.
-- No cambia nombres ni parámetros de las RPC móviles. El flujo del repartidor en la app sigue igual:
-- accept_delivery con su propio id → en_camino → delivery_balance → complete_delivery.

create or replace function public.is_repartidor()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'repartidor');
$$;
revoke all on function public.is_repartidor() from public, anon;
grant execute on function public.is_repartidor() to authenticated;

-- Antes cualquiera, incluso sin sesión, leía nombre, teléfono y dirección de los pedidos disponibles.
drop policy if exists "repartidores select deliveries" on public.deliveries;
create policy "repartidores select deliveries" on public.deliveries
  for select to authenticated
  using ((status = 'disponible' and public.is_repartidor()) or deliverer_id = auth.uid());

-- Hereda lo anterior: solo se ven los vínculos de los pedidos que el usuario ya puede leer.
drop policy if exists "auth read delivery_packages" on public.delivery_packages;
create policy "auth read delivery_packages" on public.delivery_packages
  for select to authenticated
  using (exists (select 1 from public.deliveries d where d.id = delivery_id));

-- RNF-30: historial inmutable. Ni la web ni la app móvil lo editan o borran.
drop policy if exists "Admins can update package status history" on public.package_status_history;
drop policy if exists "Admins can delete package status history" on public.package_status_history;

-- Almacén no administra pagos ni precios (matriz de permisos). Ni la web ni la app actualizan paquetes con ese rol.
drop policy if exists "almacen_update_packages" on public.packages;
drop policy if exists "almacen_insert_packages" on public.packages;
create policy "almacen_insert_packages" on public.packages
  for insert to authenticated
  with check (public.is_almacen() and is_paid = false);

-- Antes cualquiera podía asignar un pedido a cualquier repartidor.
create or replace function public.accept_delivery(p_delivery_id uuid, p_deliverer_id uuid)
returns boolean
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_updated int;
begin
  if auth.uid() is null or p_deliverer_id is distinct from auth.uid() or not public.is_repartidor() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  update public.deliveries
     set deliverer_id   = p_deliverer_id,
         deliverer_name = (select name || ' ' || coalesce(last_name, '')
                           from public.users where id = p_deliverer_id),
         status         = 'aceptado',
         accepted_at    = now()
   where id = p_delivery_id
     and status = 'disponible';
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- Antes cualquiera podía cerrar un pedido y dejar su recibo como pagado, aunque estuviera cancelado.
create or replace function public.complete_delivery(p_delivery_id uuid, p_method text default 'efectivo')
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_total numeric;
  v_paid numeric;
  v_balance numeric;
begin
  select * into v_delivery from public.deliveries where id = p_delivery_id for update;
  if not found then
    raise exception 'Pedido no encontrado';
  end if;
  -- deliverer_id puede ser NULL: con "=" la comparación daría NULL y dejaría pasar la llamada.
  if auth.uid() is null or not (v_delivery.deliverer_id is not distinct from auth.uid() or public.is_admin_user()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if v_delivery.status not in ('aceptado', 'en_camino') then
    raise exception 'El pedido ya cambió de estado';
  end if;

  update public.deliveries set status = 'entregado', delivered_at = now() where id = p_delivery_id;

  select total into v_total from public.invoices where id = v_delivery.invoice_id for update;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = v_delivery.invoice_id;
  v_balance := coalesce(v_total, 0) - v_paid;

  if v_balance > 0.009 then
    insert into public.payments (invoice_id, amount, method, registered_by)
    values (v_delivery.invoice_id, v_balance, p_method, auth.uid());
  end if;

  update public.invoices set status = 'pagada' where id = v_delivery.invoice_id;
  update public.packages set is_paid = true
   where id in (select package_id from public.invoice_items where invoice_id = v_delivery.invoice_id);
end;
$$;

create or replace function public.delivery_balance(p_delivery_id uuid)
returns numeric
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_total numeric;
  v_paid numeric;
begin
  select * into v_delivery from public.deliveries where id = p_delivery_id;
  if not found then
    return 0;
  end if;
  if auth.uid() is null or not (v_delivery.deliverer_id is not distinct from auth.uid()
      or v_delivery.client_id = auth.uid() or public.is_admin_user()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  select total into v_total from public.invoices where id = v_delivery.invoice_id;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = v_delivery.invoice_id;
  return coalesce(v_total, 0) - v_paid;
end;
$$;

-- Sin sesión no se ejecuta ninguna operación de negocio.
do $$
declare
  v_fn text;
begin
  foreach v_fn in array array[
    'accept_delivery(uuid, uuid)', 'complete_delivery(uuid, text)', 'delivery_balance(uuid)',
    'update_deliverer_location(uuid, double precision, double precision)', 'create_invoice(uuid, uuid[])',
    'register_payment(uuid, numeric, text, text, text)', 'promote_to_repartidor(uuid, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', v_fn);
    execute format('grant execute on function public.%s to authenticated', v_fn);
  end loop;
end;
$$;
