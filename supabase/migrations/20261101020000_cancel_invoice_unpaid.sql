-- PROPUESTA PARA REVISION DE JUAN: aplicar solo después de aprobación.
-- RF-37: permite anular recibos sin pagos. No elimina recibos ni movimientos.
create or replace function public.cancel_unpaid_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Solo administradores pueden anular recibos';
  end if;

  -- Misma fila bloqueada por register_payment; serializa cobros y anulaciones.
  select status into v_status
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Recibo no encontrado';
  end if;
  if v_status = 'anulada' then
    raise exception 'Este recibo ya está anulado';
  end if;
  if exists (
    select 1 from public.payments where invoice_id = p_invoice_id
  ) then
    raise exception 'No se puede anular un recibo con pagos registrados';
  end if;

  update public.invoices
  set status = 'anulada'
  where id = p_invoice_id;

  -- Mantener is_paid si otro recibo activo del paquete está pagado.
  update public.packages p
  set is_paid = false
  where exists (
    select 1 from public.invoice_items ii
    where ii.invoice_id = p_invoice_id and ii.package_id = p.id
  )
  and not exists (
    select 1
    from public.invoice_items ii2
    join public.invoices i2 on i2.id = ii2.invoice_id
    where ii2.package_id = p.id
      and i2.id <> p_invoice_id
      and i2.status <> 'anulada'
      and i2.status = 'pagada'
  );
end;
$$;

revoke all on function public.cancel_unpaid_invoice(uuid) from public, anon;
grant execute on function public.cancel_unpaid_invoice(uuid) to authenticated;
