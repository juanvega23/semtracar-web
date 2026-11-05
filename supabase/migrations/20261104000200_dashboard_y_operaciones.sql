-- T4: dashboard y reporte (RF-58, RF-59) y limitaciones anotadas en los turnos anteriores.

-- RF-58 y RF-59. Los paquetes activos siguen la misma regla que el dashboard de la app móvil: no pagados.
create function public.admin_dashboard(p_month date default null)
returns jsonb
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  v_month date := date_trunc('month', coalesce(p_month, (now() at time zone 'America/Managua')::date))::date;
  v_from timestamptz := v_month::timestamp at time zone 'America/Managua';
  v_to timestamptz := (v_month + interval '1 month')::timestamp at time zone 'America/Managua';
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'month', v_month,
    'packages_by_status', (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'count', coalesce(c.total, 0)) order by s.id), '[]'::jsonb)
      from public.status_types s
      left join (
        select coalesce(h.status_id, 1) as status_id, count(*) as total
        from public.packages p
        left join lateral (
          select status_id from public.package_status_history
          where package_id = p.id order by created_at desc, id desc limit 1
        ) h on true
        where not p.is_paid
        group by 1
      ) c on c.status_id = s.id
    ),
    'income', (
      select coalesce(sum(pay.amount), 0)
      from public.payments pay join public.invoices i on i.id = pay.invoice_id
      where i.status <> 'anulada' and pay.paid_at >= v_from and pay.paid_at < v_to
    ),
    'pending_balance', (
      select coalesce(sum(i.total - coalesce(pay.paid, 0)), 0)
      from public.invoices i
      left join lateral (select sum(amount) as paid from public.payments where invoice_id = i.id) pay on true
      where i.status in ('pendiente', 'parcial')
    ),
    'deliveries', (
      select count(*) from public.deliveries
      where status = 'entregado' and delivered_at >= v_from and delivered_at < v_to
    ),
    'clients', (select count(*) from public.users where role = 'cliente' and not is_admin),
    'deliverers', (
      select coalesce(jsonb_agg(r order by r.month_delivered desc, r.name), '[]'::jsonb)
      from (
        select u.id, trim(u.name || ' ' || coalesce(u.last_name, '')) as name,
          count(d.id) filter (where d.status = 'entregado' and d.delivered_at >= v_from and d.delivered_at < v_to) as month_delivered,
          count(d.id) filter (where d.status = 'entregado') as total_delivered,
          count(d.id) filter (where d.status in ('aceptado', 'en_camino')) as in_progress
        from public.users u
        left join public.deliveries d on d.deliverer_id = u.id
        where u.role = 'repartidor' or d.id is not null
        group by u.id, u.name, u.last_name
      ) r
    )
  );
end;
$$;
revoke all on function public.admin_dashboard(date) from public, anon;
grant execute on function public.admin_dashboard(date) to authenticated;

-- RNF-23 y RNF-31: registrar el paquete y su estado inicial en una transacción, con el precio calculado aquí.
-- "Otros" no tiene multiplicador configurado y se cobra ×1.00, igual que en la app móvil.
create function public.register_package(
  p_user_id uuid,
  p_tracking_code text,
  p_shipping_method_id integer,
  p_package_type_id integer,
  p_weight numeric
)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_rate numeric;
  v_multiplier numeric;
  v_id uuid;
begin
  if auth.uid() is null or not public.is_almacen() then
    raise exception 'Solo almacén registra paquetes' using errcode = '42501';
  end if;
  if not exists (select 1 from public.users where id = p_user_id and role = 'cliente' and not is_admin) then
    raise exception 'El paquete debe asignarse a un cliente';
  end if;
  if p_weight is null or p_weight <= 0 or p_weight > 1000 then
    raise exception 'El peso debe ser mayor que 0 y como máximo 1000 lb';
  end if;
  if coalesce(btrim(p_tracking_code), '') = '' then
    raise exception 'Escribe el código de rastreo';
  end if;
  select value into v_rate from public.app_config where key like 'tarifa\_%' and shipping_method_id = p_shipping_method_id;
  if v_rate is null then
    raise exception 'El método de envío no tiene tarifa configurada';
  end if;
  select value into v_multiplier from public.app_config where key like 'multiplicador\_%' and package_type_id = p_package_type_id;

  insert into public.packages (user_id, tracking_code, shipping_method_id, package_type_id, weight, price)
  values (p_user_id, btrim(p_tracking_code), p_shipping_method_id, p_package_type_id, p_weight,
    round(p_weight * v_rate * coalesce(v_multiplier, 1), 2))
  returning id into v_id;
  insert into public.package_status_history (package_id, status_id, notes)
  values (v_id, 1, 'Recibido en Estados Unidos');
  return v_id;
end;
$$;
revoke all on function public.register_package(uuid, text, integer, integer, numeric) from public, anon;
grant execute on function public.register_package(uuid, text, integer, integer, numeric) to authenticated;

-- RF-37: un paquete cuyo recibo se anuló por error quedaba sin forma de cobrarse.
-- El ítem anterior se quita para mantener una sola fila por paquete, que es lo que espera la app móvil.
create function public.reissue_invoice(p_package_id uuid)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_status integer;
  v_old uuid[];
  v_new uuid;
  v_number bigint;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Solo administradores pueden generar recibos' using errcode = '42501';
  end if;
  select user_id into v_owner from public.packages where id = p_package_id for update;
  if not found then
    raise exception 'No existe el paquete';
  end if;
  select status_id into v_status from public.package_status_history
  where package_id = p_package_id order by created_at desc, id desc limit 1;
  if v_status is distinct from 4 then
    raise exception 'El paquete debe estar Listo para recoger';
  end if;
  if exists (
    select 1 from public.invoice_items ii join public.invoices i on i.id = ii.invoice_id
    where ii.package_id = p_package_id and i.status <> 'anulada'
  ) then
    raise exception 'El paquete ya tiene un recibo activo';
  end if;

  select array_agg(invoice_id) into v_old from public.invoice_items where package_id = p_package_id;
  delete from public.invoice_items where package_id = p_package_id;
  v_new := public.create_invoice(v_owner, array[p_package_id]);
  select invoice_number into v_number from public.invoices where id = v_new;
  update public.invoices set notes = concat_ws(E'\n', nullif(notes, ''), 'Reemitido en ' || public.format_rec(v_number))
  where id = any(v_old);
  return v_new;
end;
$$;
revoke all on function public.reissue_invoice(uuid) from public, anon;
grant execute on function public.reissue_invoice(uuid) to authenticated;

-- RF-19 y RF-67: filtrar por estado en la base para que la paginación y el contador sean correctos. Respeta RLS.
create view public.packages_with_status with (security_invoker = true) as
select p.*, h.status_id as current_status_id
from public.packages p
left join lateral (
  select status_id from public.package_status_history
  where package_id = p.id order by created_at desc, id desc limit 1
) h on true;
revoke all on table public.packages_with_status from anon, authenticated;
grant select on table public.packages_with_status to authenticated;

-- RNF-39: índices de las búsquedas frecuentes que faltaban.
create index if not exists idx_invoices_user_recent on public.invoices (user_id, created_at desc);
create index if not exists idx_invoice_items_invoice on public.invoice_items (invoice_id);
create index if not exists idx_invoice_items_package on public.invoice_items (package_id);
create index if not exists idx_payments_invoice on public.payments (invoice_id);
create index if not exists idx_deliveries_client on public.deliveries (client_id, created_at desc);
create index if not exists idx_deliveries_deliverer on public.deliveries (deliverer_id);
create index if not exists idx_deliveries_package on public.deliveries (package_id);
create index if not exists idx_delivery_packages_delivery on public.delivery_packages (delivery_id);
create index if not exists idx_delivery_packages_package on public.delivery_packages (package_id);
create index if not exists idx_packages_recent on public.packages (created_at desc);
