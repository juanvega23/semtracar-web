-- Ejecutar solo en Supabase LOCAL: npx supabase test db.
-- Los fixtures y operaciones se revierten al terminar.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into public.packages (id, user_id, tracking_code, shipping_method_id, package_type_id, weight, price, is_paid)
select ('e1000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid,
  case when n = 7 then 'a2000000-0000-4000-a000-000000000002'::uuid else 'c1000000-0000-4000-a000-000000000001'::uuid end,
  'T3-TEST-' || n, 1, 1, 1, 10, n = 1
from generate_series(1, 9) n;
insert into public.package_status_history (package_id, status_id, notes)
select id, case when tracking_code = 'T3-TEST-6' then 3 else 4 end, 'Managua · prueba local'
from public.packages where tracking_code like 'T3-TEST-%';
insert into public.invoices (id, user_id, subtotal, tax_amount, total, status, issued_by)
select ('f1000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid,
  case when n = 7 then 'a2000000-0000-4000-a000-000000000002'::uuid else 'c1000000-0000-4000-a000-000000000001'::uuid end,
  10, 0, 10, case when n = 1 then 'pagada' when n = 4 then 'parcial' else 'pendiente' end,
  'a2000000-0000-4000-a000-000000000002'::uuid from generate_series(1, 9) n;
insert into public.invoice_items (id, invoice_id, package_id, description, amount)
select ('d1000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid,
  ('f1000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid,
  ('e1000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid, 'Paquete prueba ' || n, 10
from generate_series(1, 9) n;
insert into public.payments (invoice_id, amount, method, registered_by) values
  ('f1000000-0000-4000-a000-000000000001', 10, 'efectivo', 'a2000000-0000-4000-a000-000000000002'),
  ('f1000000-0000-4000-a000-000000000004', 2, 'efectivo', 'a2000000-0000-4000-a000-000000000002');
update public.app_config set value = 5 where key = 'costo_delivery';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-a000-000000000001', true);
select is((select count(*)::integer from public.packages where tracking_code like 'T3-TEST-%'), 8, 'Cliente solo lee sus paquetes');
select is((select count(*)::integer from public.invoices where id::text like 'f1000000-%'), 8, 'Cliente solo lee sus recibos');
select throws_ok($$ select public.validate_delivery_request(array['e1000000-0000-4000-a000-000000000001'::uuid], 'Managua centro') $$, '42501', null, 'Helper no se expone a clientes');
select throws_ok($$ select public.request_delivery('f1000000-0000-4000-a000-000000000007', 'e1000000-0000-4000-a000-000000000007', 'Managua centro') $$, 'P0001', null, 'No se puede pedir un paquete ajeno');
select throws_ok($$ select public.request_delivery('f1000000-0000-4000-a000-000000000006', 'e1000000-0000-4000-a000-000000000006', 'Managua centro') $$, 'P0001', 'Todos los paquetes deben estar listos para recoger', 'Se exige estado listo');
select throws_ok($$ select public.request_delivery('f1000000-0000-4000-a000-000000000001', 'e1000000-0000-4000-a000-000000000001', '') $$, 'P0001', 'Dirección de entrega inválida', 'Se valida la dirección en servidor');
select lives_ok($$ select public.request_delivery('f1000000-0000-4000-a000-000000000001', 'e1000000-0000-4000-a000-000000000001', 'Managua centro') $$, 'Delivery simple atómico sobre un recibo pagado');
select is((select delivery_cost from public.invoices where id = 'f1000000-0000-4000-a000-000000000001'), 5::numeric, 'Costo proviene de app_config');
select is((select total from public.invoices where id = 'f1000000-0000-4000-a000-000000000001'), 15::numeric, 'Cargo se suma al total');
select is((select status from public.invoices where id = 'f1000000-0000-4000-a000-000000000001'), 'parcial', 'El nuevo cargo deja saldo pendiente');
select is((select is_paid from public.packages where id = 'e1000000-0000-4000-a000-000000000001'), false, 'Pago del paquete refleja saldo de delivery');
select throws_ok($$ select public.request_delivery('f1000000-0000-4000-a000-000000000001', 'e1000000-0000-4000-a000-000000000001', 'Managua centro') $$, 'P0001', null, 'No duplica delivery');
select throws_ok($$ select public.decline_delivery('f1000000-0000-4000-a000-000000000001') $$, 'P0001', null, 'No se puede rechazar un delivery ya solicitado');
select throws_ok($$ select public.request_delivery_multi(array['e1000000-0000-4000-a000-000000000002'::uuid, 'e1000000-0000-4000-a000-000000000004'::uuid], 'Managua centro') $$, 'P0001', 'Para agrupar paquetes, los recibos deben estar sin pagos', 'No consolida recibos con pagos');
select throws_ok($$ select public.request_delivery_multi(array['e1000000-0000-4000-a000-000000000002'::uuid, 'e1000000-0000-4000-a000-000000000002'::uuid], 'Managua centro') $$, 'P0001', 'Hay paquetes repetidos', 'No acepta paquetes duplicados');
select lives_ok($$ select public.request_delivery_multi(array['e1000000-0000-4000-a000-000000000002'::uuid, 'e1000000-0000-4000-a000-000000000003'::uuid], 'Managua centro') $$, 'Delivery múltiple agrupa sin borrar');
select is((select count(*)::integer from public.invoices where id::text like 'f1000000-%'), 8, 'Se conservan todos los recibos del cliente');
select is((select status from public.invoices where id = 'f1000000-0000-4000-a000-000000000003'), 'anulada', 'Recibo secundario queda anulado');
select is((select count(*)::integer from public.invoice_items where invoice_id = 'f1000000-0000-4000-a000-000000000003'), 0, 'El recibo secundario no conserva enlaces duplicados');
select is((select count(*)::integer from public.invoice_items where package_id = 'e1000000-0000-4000-a000-000000000003'), 1, 'maybeSingle móvil sigue encontrando un solo ítem por paquete');
select is((select invoice_id from public.invoice_items where id = 'd1000000-0000-4000-a000-000000000003'), 'f1000000-0000-4000-a000-000000000002'::uuid, 'Se mueve el ítem original sin copiarlo ni eliminarlo');
select alike((select notes from public.invoices where id = 'f1000000-0000-4000-a000-000000000003'), 'Consolidado por delivery en REC-%', 'El recibo secundario conserva la referencia al principal');
select is((select total from public.invoices where id = 'f1000000-0000-4000-a000-000000000002'), 25::numeric, 'Un solo cargo para dos paquetes');
select is((select count(*)::integer from public.invoice_items where invoice_id = 'f1000000-0000-4000-a000-000000000002'), 2, 'Recibo principal contiene ambos paquetes');
select throws_ok($$ select public.cancel_delivery((select id from public.deliveries where invoice_id = 'f1000000-0000-4000-a000-000000000002')) $$, 'P0001', 'Solo administración puede cancelar pedidos', 'Cliente no cancela pedidos');
select lives_ok($$ select public.decline_delivery('f1000000-0000-4000-a000-000000000005') $$, 'Cliente elige retiro en sucursal');
select is((select delivery_choice from public.invoices where id = 'f1000000-0000-4000-a000-000000000005'), 'rechazado', 'Retiro se conserva sin cargos');

select set_config('request.jwt.claim.sub', 'b3000000-0000-4000-a000-000000000003', true);
select throws_ok($$ select public.cancel_delivery('00000000-0000-0000-0000-000000000000') $$, 'P0001', 'Solo administración puede cancelar pedidos', 'Almacén no cancela pedidos');
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-a000-000000000002', true);
select throws_ok($$ select public.cancel_delivery((select id from public.deliveries where invoice_id = 'f1000000-0000-4000-a000-000000000001')) $$, 'P0001', 'Este recibo tiene pagos: la cancelación requiere revisión administrativa', 'Con pagos, cancelar requiere revisión');
select lives_ok($$ select public.cancel_delivery((select id from public.deliveries where invoice_id = 'f1000000-0000-4000-a000-000000000002')) $$, 'Admin cancela pedido sin pagos');
select is((select status from public.deliveries where invoice_id = 'f1000000-0000-4000-a000-000000000002'), 'cancelado', 'Pedido queda cancelado');
select is((select total from public.invoices where id = 'f1000000-0000-4000-a000-000000000002'), 20::numeric, 'Se quita cargo de delivery');
select is((select has_delivery from public.invoices where id = 'f1000000-0000-4000-a000-000000000002'), false, 'Recibo vuelve a retiro en sucursal');
select is((select count(*)::integer from public.payments where invoice_id::text like 'f1000000-%'), 2, 'Ningún pago es borrado');
select ok((select count(*) = 5 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('packages', 'package_status_history', 'deliveries', 'invoice_items', 'payments')), 'Realtime publica tablas del T3');
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-a000-000000000001', true);
select throws_ok($$ select public.request_delivery_multi(array['e1000000-0000-4000-a000-000000000002'::uuid, 'e1000000-0000-4000-a000-000000000003'::uuid], 'Managua centro') $$, 'P0001', 'Ya existe un delivery para uno de estos paquetes', 'No se puede volver a pedir el delivery múltiple cancelado');
select is((select count(*)::integer from public.deliveries where package_id = 'e1000000-0000-4000-a000-000000000002'), 1, 'La consulta móvil de delivery sigue siendo única tras cancelar');

-- Teléfono opcional en móvil: la exigencia de contacto pertenece únicamente al formulario web.
reset role;
update public.users set phone = null where id = 'c1000000-0000-4000-a000-000000000001';
set local role authenticated;
select lives_ok($$ select public.request_delivery('f1000000-0000-4000-a000-000000000005', 'e1000000-0000-4000-a000-000000000005', 'Managua centro') $$, 'Móvil puede solicitar delivery simple sin teléfono');
select is((select client_phone from public.deliveries where package_id = 'e1000000-0000-4000-a000-000000000005'), null::text, 'El contacto opcional se conserva como null');
reset role;
update public.users set phone = '(505) 8888 0001 ext. 2' where id = 'c1000000-0000-4000-a000-000000000001';
set local role authenticated;
select lives_ok($$ select public.request_delivery_multi(array['e1000000-0000-4000-a000-000000000008'::uuid, 'e1000000-0000-4000-a000-000000000009'::uuid], 'Managua centro') $$, 'Móvil puede agrupar sin imponer el formato de teléfono web');
select is((select client_phone from public.deliveries where package_id = 'e1000000-0000-4000-a000-000000000008'), '(505) 8888 0001 ext. 2', 'Se conserva el teléfono móvil sin normalizarlo en SQL');
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-a000-000000000002', true);
select lives_ok($$ select public.cancel_delivery((select id from public.deliveries where package_id = 'e1000000-0000-4000-a000-000000000005')) $$, 'Admin cancela también el pedido simple sin pagos');
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-a000-000000000001', true);
select throws_ok($$ select public.request_delivery('f1000000-0000-4000-a000-000000000005', 'e1000000-0000-4000-a000-000000000005', 'Managua centro') $$, 'P0001', 'Ya existe un delivery para uno de estos paquetes', 'No se puede volver a pedir el delivery simple cancelado');
select is((select count(*)::integer from public.deliveries where package_id = 'e1000000-0000-4000-a000-000000000005'), 1, 'No se crea una segunda fila para el pedido simple cancelado');
select * from finish();
rollback;
