-- T4 (RF-54 a RF-57, decisión D5): centro de avisos alimentado por triggers, para que también
-- salgan los avisos de lo que se hace desde la app móvil. Un fallo aquí nunca bloquea la operación original.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in (
    'paquete_estado', 'paquete_listo', 'recibo_generado', 'recibo_anulado',
    'pago_registrado', 'pedido_nuevo', 'pedido_estado', 'entrega_confirmada'
  )),
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_recent on public.notifications (user_id, created_at desc);
create index notifications_user_unread on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;
create policy "users read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "users mark own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Solo se puede leer y marcar como leído. Los avisos los crean únicamente los triggers.
revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

create function public.notify_user(p_user_id uuid, p_type text, p_title text, p_body text, p_link text)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
exception when others then
  raise warning 'No se pudo crear el aviso %: %', p_type, sqlerrm;
end;
$$;
revoke all on function public.notify_user(uuid, text, text, text, text) from public, anon, authenticated;

create function public.format_rec(p_number bigint)
returns text
language sql immutable
as $$ select 'REC-' || lpad(p_number::text, 5, '0') $$;

create function public.format_usd(p_amount numeric)
returns text
language sql immutable
as $$ select '$' || to_char(p_amount, 'FM999,999,990.00') $$;

create function public.on_status_notify()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_tracking text;
  v_status text;
begin
  select user_id, tracking_code into v_owner, v_tracking from public.packages where id = new.package_id;
  select name into v_status from public.status_types where id = new.status_id;
  if new.status_id = 4 then
    perform public.notify_user(v_owner, 'paquete_listo', 'Tu paquete está listo para recoger',
      v_tracking || concat(' · ', nullif(btrim(new.notes), '')), '/rastreo');
  else
    perform public.notify_user(v_owner, 'paquete_estado', 'Tu paquete cambió de estado',
      v_tracking || ' · ' || coalesce(v_status, 'Actualizado') || concat(' · ', nullif(btrim(new.notes), '')), '/rastreo');
  end if;
  return null;
exception when others then
  raise warning 'on_status_notify: %', sqlerrm;
  return null;
end;
$$;
create trigger trg_notify_status after insert on public.package_status_history
  for each row execute function public.on_status_notify();

create function public.on_invoice_notify()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.document_type <> 'recibo' then
    return null;
  end if;
  if tg_op = 'INSERT' then
    perform public.notify_user(new.user_id, 'recibo_generado', 'Se generó tu recibo',
      public.format_rec(new.invoice_number) || ' por ' || public.format_usd(new.total), '/historial');
  elsif new.status = 'anulada' and old.status <> 'anulada'
      -- Al agrupar paquetes en un delivery el recibo no se anula para el cliente: pasa al principal.
      and coalesce(new.notes, '') not like '%Consolidado por delivery%' then
    perform public.notify_user(new.user_id, 'recibo_anulado', 'Se anuló tu recibo',
      public.format_rec(new.invoice_number), '/historial');
  end if;
  return null;
exception when others then
  raise warning 'on_invoice_notify: %', sqlerrm;
  return null;
end;
$$;
create trigger trg_notify_invoice_insert after insert on public.invoices
  for each row execute function public.on_invoice_notify();
create trigger trg_notify_invoice_status after update of status on public.invoices
  for each row execute function public.on_invoice_notify();

create function public.on_payment_notify()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invoice public.invoices%rowtype;
begin
  select * into v_invoice from public.invoices where id = new.invoice_id;
  perform public.notify_user(v_invoice.user_id, 'pago_registrado', 'Registramos tu pago',
    public.format_usd(new.amount) || ' en ' || public.format_rec(v_invoice.invoice_number), '/historial');
  return null;
exception when others then
  raise warning 'on_payment_notify: %', sqlerrm;
  return null;
end;
$$;
create trigger trg_notify_payment after insert on public.payments
  for each row execute function public.on_payment_notify();

create function public.on_delivery_notify()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_admin uuid;
begin
  if tg_op = 'INSERT' then
    for v_admin in select id from public.users where is_admin or role = 'admin' loop
      perform public.notify_user(v_admin, 'pedido_nuevo', 'Nuevo pedido de delivery',
        coalesce(new.client_name, 'Un cliente') || ' · ' || new.delivery_address, '/admin/pedidos');
    end loop;
  elsif new.status is distinct from old.status then
    case new.status
      when 'aceptado' then
        perform public.notify_user(new.client_id, 'pedido_estado', 'Un repartidor aceptó tu pedido',
          coalesce(new.deliverer_name, 'Repartidor asignado'), '/delivery');
      when 'en_camino' then
        perform public.notify_user(new.client_id, 'pedido_estado', 'Tu pedido va en camino',
          coalesce(new.deliverer_name, 'Tu repartidor') || ' salió hacia ' || new.delivery_address, '/delivery');
      when 'entregado' then
        perform public.notify_user(new.client_id, 'entrega_confirmada', 'Tu pedido fue entregado',
          coalesce(new.package_tracking, 'Tu pedido') || ' · ' || new.delivery_address, '/delivery');
      when 'cancelado' then
        perform public.notify_user(new.client_id, 'pedido_estado', 'Tu pedido fue cancelado',
          'Puedes retirar tu paquete en la sucursal.', '/delivery');
      else
        null;
    end case;
  end if;
  return null;
exception when others then
  raise warning 'on_delivery_notify: %', sqlerrm;
  return null;
end;
$$;
create trigger trg_notify_delivery_insert after insert on public.deliveries
  for each row execute function public.on_delivery_notify();
create trigger trg_notify_delivery_status after update of status on public.deliveries
  for each row execute function public.on_delivery_notify();

do $$
declare
  v_fn text;
begin
  foreach v_fn in array array['on_status_notify()', 'on_invoice_notify()', 'on_payment_notify()', 'on_delivery_notify()'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', v_fn);
  end loop;
end;
$$;
