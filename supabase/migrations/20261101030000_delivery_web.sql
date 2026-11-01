-- PROPUESTA T3 PARA REVISIÓN DE JUAN. No aplicar en producción antes de su aprobación.
-- Mantiene firmas usadas por Flutter. No borra recibos, ítems ni pagos.
-- Alberto confirmó: consolidar solo recibos sin pagos y conservar los secundarios anulados.
-- Cancelar quita el cargo solo sin pagos; con pagos requiere revisión administrativa.

create or replace function public.validate_delivery_request(p_package_ids uuid[], p_address text)
returns uuid[]
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invoices uuid[];
  v_count integer;
begin
  if auth.uid() is null then raise exception 'No autorizado'; end if;
  if p_address is null or length(btrim(p_address)) < 5 or length(btrim(p_address)) > 250 then
    raise exception 'Dirección de entrega inválida';
  end if;
  if coalesce(cardinality(p_package_ids), 0) = 0 or cardinality(p_package_ids) > 1000
     or array_position(p_package_ids, null) is not null then
    raise exception 'Selecciona paquetes válidos';
  end if;
  select count(distinct id) into v_count from unnest(p_package_ids) as x(id);
  if v_count <> cardinality(p_package_ids) then raise exception 'Hay paquetes repetidos'; end if;

  select array_agg(distinct i.id order by i.id) into v_invoices
  from public.invoice_items ii join public.invoices i on i.id = ii.invoice_id
  where ii.package_id = any(p_package_ids) and i.status <> 'anulada';
  if v_invoices is null then raise exception 'Los paquetes no tienen recibos activos'; end if;

  -- Mismo orden que register_payment: recibos antes de paquetes. Evita cobros simultáneos.
  perform id from public.invoices where id = any(v_invoices) order by id for update;
  perform id from public.packages where id = any(p_package_ids) order by id for update;
  if (select count(*) from public.packages where id = any(p_package_ids) and user_id = auth.uid()) <> cardinality(p_package_ids)
     or exists (select 1 from public.invoices where id = any(v_invoices)
       and (user_id <> auth.uid() or status = 'anulada' or has_delivery or delivery_choice = 'solicitado')) then
    raise exception 'Uno de los recibos ya no está disponible o no te pertenece';
  end if;
  if exists (select 1 from unnest(p_package_ids) x(id) where
    (select count(*) from public.invoice_items ii join public.invoices i on i.id = ii.invoice_id
       where ii.package_id = x.id and i.status <> 'anulada') <> 1) then
    raise exception 'Cada paquete debe tener exactamente un recibo activo';
  end if;
  if exists (select 1 from public.invoice_items where invoice_id = any(v_invoices)
     and not (package_id = any(p_package_ids))) then
    raise exception 'Selecciona todos los paquetes de cada recibo';
  end if;
  if exists (select 1 from unnest(p_package_ids) x(id) where coalesce(
      (select status_id from public.package_status_history where package_id = x.id
       order by created_at desc, id desc limit 1), 0) <> 4) then
    raise exception 'Todos los paquetes deben estar listos para recoger';
  end if;
  -- Flutter consulta con maybeSingle: incluso un pedido cancelado impide otro para ese paquete.
  if exists (select 1 from public.deliveries d where
      d.package_id = any(p_package_ids) or exists
       (select 1 from public.delivery_packages dp where dp.delivery_id = d.id and dp.package_id = any(p_package_ids))) then
    raise exception 'Ya existe un delivery para uno de estos paquetes';
  end if;
  return v_invoices;
end;
$$;
revoke all on function public.validate_delivery_request(uuid[], text) from public, anon, authenticated;

create or replace function public.request_delivery(p_invoice_id uuid, p_package_id uuid, p_delivery_address text)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invoices uuid[];
  v_cost numeric;
  v_total numeric;
  v_paid numeric;
  v_delivery uuid;
begin
  v_invoices := public.validate_delivery_request(array[p_package_id], p_delivery_address);
  if cardinality(v_invoices) <> 1 or v_invoices[1] <> p_invoice_id then
    raise exception 'El paquete no pertenece al recibo indicado';
  end if;
  select value into v_cost from public.app_config where key = 'costo_delivery';
  if v_cost is null or v_cost <= 0 then raise exception 'Delivery sin tarifa configurada'; end if;
  select subtotal + tax_amount + v_cost into v_total from public.invoices where id = p_invoice_id;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = p_invoice_id;
  update public.invoices set has_delivery = true, delivery_address = btrim(p_delivery_address),
    delivery_cost = v_cost, total = v_total, delivery_choice = 'solicitado',
    status = case when v_paid >= v_total then 'pagada' when v_paid > 0 then 'parcial' else 'pendiente' end
  where id = p_invoice_id;
  update public.packages set is_paid = (v_paid >= v_total) where id = p_package_id;
  insert into public.deliveries (invoice_id, package_id, client_id, delivery_address, client_name, client_phone, package_count, package_tracking)
  select p_invoice_id, p_package_id, auth.uid(), btrim(p_delivery_address),
    u.name || ' ' || u.last_name, u.phone, 1, p.tracking_code
  from public.users u cross join public.packages p where u.id = auth.uid() and p.id = p_package_id
  returning id into v_delivery;
  insert into public.delivery_packages (delivery_id, package_id, invoice_id) values (v_delivery, p_package_id, p_invoice_id);
end;
$$;

create or replace function public.request_delivery_multi(p_package_ids uuid[], p_delivery_address text)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invoices uuid[];
  v_primary uuid;
  v_number integer;
  v_delivery uuid;
  v_cost numeric;
  v_subtotal numeric;
  v_tax numeric;
begin
  v_invoices := public.validate_delivery_request(p_package_ids, p_delivery_address);
  if exists (select 1 from public.payments where invoice_id = any(v_invoices)) then
    raise exception 'Para agrupar paquetes, los recibos deben estar sin pagos';
  end if;
  select ii.invoice_id into v_primary from public.invoice_items ii join public.invoices i on i.id = ii.invoice_id
  where ii.package_id = p_package_ids[1] and i.status <> 'anulada';
  select invoice_number into v_number from public.invoices where id = v_primary;
  select value into v_cost from public.app_config where key = 'costo_delivery';
  if v_cost is null or v_cost <= 0 then raise exception 'Delivery sin tarifa configurada'; end if;
  select coalesce(sum(tax_amount), 0) into v_tax from public.invoices where id = any(v_invoices);

  -- Mantener los recibos secundarios con su número, importes y nota de consolidación.
  update public.invoices set status = 'anulada', notes = concat_ws(E'\n', nullif(notes, ''),
    'Consolidado por delivery en REC-' || lpad(v_number::text, greatest(5, length(v_number::text)), '0'))
  where id = any(v_invoices) and id <> v_primary;
  -- Mover los ítems originales: Flutter espera una sola fila por paquete con maybeSingle.
  update public.invoice_items set invoice_id = v_primary
  where invoice_id = any(v_invoices) and invoice_id <> v_primary;
  select coalesce(sum(amount), 0) into v_subtotal from public.invoice_items where invoice_id = v_primary;
  update public.invoices set subtotal = v_subtotal, tax_amount = v_tax, has_delivery = true,
    delivery_address = btrim(p_delivery_address), delivery_choice = 'solicitado', delivery_cost = v_cost,
    total = v_subtotal + v_tax + v_cost, status = 'pendiente'
  where id = v_primary;
  update public.packages set is_paid = false where id = any(p_package_ids);
  insert into public.deliveries (invoice_id, package_id, client_id, delivery_address, client_name, client_phone, package_count, package_tracking)
  select v_primary, p_package_ids[1], auth.uid(), btrim(p_delivery_address), u.name || ' ' || u.last_name, u.phone,
    cardinality(p_package_ids), (select string_agg(tracking_code, ', ' order by tracking_code) from public.packages where id = any(p_package_ids))
  from public.users u where u.id = auth.uid() returning id into v_delivery;
  insert into public.delivery_packages (delivery_id, package_id, invoice_id)
  select v_delivery, id, v_primary from unnest(p_package_ids) x(id);
  return v_delivery;
end;
$$;

create or replace function public.decline_delivery(p_invoice_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_invoice public.invoices%rowtype;
begin
  if auth.uid() is null then raise exception 'No autorizado'; end if;
  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if not found or v_invoice.user_id <> auth.uid() then raise exception 'No autorizado'; end if;
  if v_invoice.status = 'anulada' or v_invoice.has_delivery or v_invoice.delivery_choice = 'solicitado' then
    raise exception 'Este recibo ya no permite cambiar la opción de entrega';
  end if;
  update public.invoices set delivery_choice = 'rechazado' where id = p_invoice_id;
end;
$$;

revoke all on function public.request_delivery(uuid, uuid, text) from public, anon;
revoke all on function public.request_delivery_multi(uuid[], text) from public, anon;
revoke all on function public.decline_delivery(uuid) from public, anon;
grant execute on function public.request_delivery(uuid, uuid, text) to authenticated;
grant execute on function public.request_delivery_multi(uuid[], text) to authenticated;
grant execute on function public.decline_delivery(uuid) to authenticated;

create or replace function public.cancel_delivery(p_delivery_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_invoice public.invoices%rowtype;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Solo administración puede cancelar pedidos';
  end if;
  -- Orden de bloqueo igual que complete_delivery en la app móvil.
  select * into v_delivery from public.deliveries where id = p_delivery_id for update;
  if not found or v_delivery.status not in ('disponible', 'aceptado', 'en_camino') then
    raise exception 'El pedido ya cambió de estado';
  end if;
  select * into v_invoice from public.invoices where id = v_delivery.invoice_id for update;
  if not found or v_invoice.status = 'anulada' then raise exception 'El recibo no está disponible'; end if;
  if exists (select 1 from public.payments where invoice_id = v_invoice.id) then
    raise exception 'Este recibo tiene pagos: la cancelación requiere revisión administrativa';
  end if;
  update public.deliveries set status = 'cancelado' where id = p_delivery_id;
  update public.invoices set has_delivery = false, delivery_cost = 0, delivery_address = null,
    delivery_choice = 'rechazado', total = subtotal + tax_amount, status = 'pendiente'
  where id = v_invoice.id;
  update public.packages set is_paid = false where id in
    (select package_id from public.invoice_items where invoice_id = v_invoice.id);
end;
$$;
revoke all on function public.cancel_delivery(uuid) from public, anon;
grant execute on function public.cancel_delivery(uuid) to authenticated;

