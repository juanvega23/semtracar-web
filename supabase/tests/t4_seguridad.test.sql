-- Ejecutar solo en Supabase LOCAL: supabase test db. Se revierte al terminar.
-- RNF-01: seguridad probada fuera de la interfaz, con cada rol. También cubre avisos, dashboard y las RPC del T4.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into public.packages (id, user_id, tracking_code, shipping_method_id, package_type_id, weight, price) values
  ('e4000000-0000-4000-a000-000000000001', 'c1000000-0000-4000-a000-000000000001', 'T4-1', 1, 1, 2, 13),
  ('e4000000-0000-4000-a000-000000000002', 'c1000000-0000-4000-a000-000000000001', 'T4-2', 1, 1, 1, 6.5);
insert into public.package_status_history (package_id, status_id, notes, created_at) values
  ('e4000000-0000-4000-a000-000000000001', 4, 'Sucursal', now() - interval '1 day'),
  ('e4000000-0000-4000-a000-000000000002', 2, 'Tránsito', now() - interval '1 day');
insert into public.invoices (id, user_id, subtotal, tax_amount, total, status) values
  ('f4000000-0000-4000-a000-000000000001', 'c1000000-0000-4000-a000-000000000001', 13, 0, 13, 'pendiente');
insert into public.invoice_items (invoice_id, package_id, description, amount) values
  ('f4000000-0000-4000-a000-000000000001', 'e4000000-0000-4000-a000-000000000001', 'x', 13);
insert into public.deliveries (id, invoice_id, package_id, client_id, delivery_address) values
  ('b4000000-0000-4000-a000-000000000001', 'f4000000-0000-4000-a000-000000000001', 'e4000000-0000-4000-a000-000000000001', 'c1000000-0000-4000-a000-000000000001', 'Casa del cliente');
insert into public.delivery_packages (delivery_id, package_id, invoice_id) values
  ('b4000000-0000-4000-a000-000000000001', 'e4000000-0000-4000-a000-000000000001', 'f4000000-0000-4000-a000-000000000001');

select is((select count(*)::int from public.notifications where user_id = 'c1000000-0000-4000-a000-000000000001' and type = 'paquete_listo'), 1, 'Estado 4 crea el aviso de paquete listo');
select is((select count(*)::int from public.notifications where user_id = 'c1000000-0000-4000-a000-000000000001' and type = 'recibo_generado'), 1, 'El recibo crea su aviso');
select is((select count(*)::int from public.notifications where user_id = 'a2000000-0000-4000-a000-000000000002' and type = 'pedido_nuevo'), 1, 'El admin recibe el aviso de pedido nuevo');

-- Sin sesión
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*)::int from public.deliveries), 0, 'Sin sesión no se leen pedidos');
select is((select count(*)::int from public.users), 0, 'Sin sesión no se leen usuarios');
select is((select count(*)::int from public.packages), 0, 'Sin sesión no se leen paquetes');
select is((select count(*)::int from public.invoices), 0, 'Sin sesión no se leen recibos');
select throws_ok($$ select count(*) from public.notifications $$, '42501', null, 'Sin sesión no se leen avisos');
select throws_ok($$ select count(*) from public.packages_with_status $$, '42501', null, 'Sin sesión no se usa la vista de paquetes');
select throws_ok($$ select public.accept_delivery('b4000000-0000-4000-a000-000000000001', 'd4000000-0000-4000-a000-000000000004') $$, '42501', null, 'Sin sesión no se acepta un pedido');
select throws_ok($$ select public.complete_delivery('b4000000-0000-4000-a000-000000000001', 'efectivo') $$, '42501', null, 'Sin sesión no se cierra un pedido');
select throws_ok($$ select public.delivery_balance('b4000000-0000-4000-a000-000000000001') $$, '42501', null, 'Sin sesión no se consulta un saldo');
select throws_ok($$ select public.admin_dashboard() $$, '42501', null, 'Sin sesión no se abre el dashboard');
reset role;

-- Cliente
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-a000-000000000001', true);
select throws_ok($$ select public.complete_delivery('b4000000-0000-4000-a000-000000000001', 'efectivo') $$, '42501', null, 'El cliente no cierra su propio pedido');
select throws_ok($$ select public.accept_delivery('b4000000-0000-4000-a000-000000000001', 'c1000000-0000-4000-a000-000000000001') $$, '42501', null, 'El cliente no se asigna un pedido');
select throws_ok($$ select public.admin_dashboard() $$, '42501', null, 'El cliente no abre el dashboard');
select throws_ok($$ select public.register_package('c1000000-0000-4000-a000-000000000001', 'X', 1, 1, 1) $$, '42501', null, 'El cliente no registra paquetes');
select throws_ok($$ select public.reissue_invoice('e4000000-0000-4000-a000-000000000001') $$, '42501', null, 'El cliente no genera recibos');
select throws_ok($$ update public.users set is_admin = true where id = auth.uid() $$, '42501', null, 'El cliente no se hace administrador');
select is((select count(*)::int from public.deliveries where id = 'b4000000-0000-4000-a000-000000000001'), 1, 'El cliente ve su pedido');
select is(public.delivery_balance('b4000000-0000-4000-a000-000000000001'), 13::numeric, 'El cliente consulta el saldo de su pedido');
select is((select count(*)::int from public.packages_with_status where tracking_code like 'T4-%'), 2, 'La vista respeta los paquetes del cliente');
select is((select count(*)::int from public.notifications where user_id <> auth.uid()), 0, 'El cliente solo ve sus avisos');
select throws_ok($$ insert into public.notifications (user_id, type, title, body) values (auth.uid(), 'pago_registrado', 'x', 'x') $$, '42501', null, 'El cliente no crea avisos');
select throws_ok($$ update public.notifications set title = 'x' $$, '42501', null, 'El cliente no edita el texto de un aviso');
select throws_ok($$ select public.notify_user(auth.uid(), 'pago_registrado', 'x', 'x', null) $$, '42501', null, 'El cliente no llama al helper de avisos');
select lives_ok($$ update public.notifications set read_at = now() where user_id = auth.uid() $$, 'El cliente marca sus avisos como leídos');
select is((select count(*)::int from public.notifications where read_at is null), 0, 'Sus avisos quedan leídos');
reset role;

-- Otro cliente, usando al repartidor sin pedido como usuario ajeno
insert into public.deliveries (id, invoice_id, package_id, client_id, delivery_address, status, deliverer_id) values
  ('b4000000-0000-4000-a000-000000000009', 'f4000000-0000-4000-a000-000000000001', 'e4000000-0000-4000-a000-000000000002', 'a2000000-0000-4000-a000-000000000002', 'Otra casa', 'cancelado', null);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-a000-000000000001', true);
select is((select count(*)::int from public.deliveries where id = 'b4000000-0000-4000-a000-000000000009'), 0, 'Un cliente no ve pedidos ajenos');
reset role;
delete from public.deliveries where id = 'b4000000-0000-4000-a000-000000000009';

-- Almacén
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b3000000-0000-4000-a000-000000000003', true);
select is((select count(*)::int from public.deliveries), 0, 'Almacén no lee pedidos');
select is((select count(*)::int from public.invoices), 0, 'Almacén no lee recibos');
select is((select count(*)::int from public.delivery_packages), 0, 'Almacén no lee vínculos de pedidos');
select throws_ok($$ select public.delivery_balance('b4000000-0000-4000-a000-000000000001') $$, '42501', null, 'Almacén no consulta el saldo de un pedido sin repartidor');
select throws_ok($$ select public.complete_delivery('b4000000-0000-4000-a000-000000000001', 'efectivo') $$, '42501', null, 'Almacén no cierra un pedido sin repartidor');
update public.packages set is_paid = true where id = 'e4000000-0000-4000-a000-000000000002';
select is((select is_paid from public.packages where id = 'e4000000-0000-4000-a000-000000000002'), false, 'Almacén no marca un paquete como pagado');
select throws_ok($$ insert into public.packages (user_id, tracking_code, shipping_method_id, package_type_id, weight, price, is_paid) values ('c1000000-0000-4000-a000-000000000001', 'T4-P', 1, 1, 1, 1, true) $$, '42501', null, 'Almacén no crea paquetes ya pagados');
select throws_ok($$ insert into public.package_status_history (package_id, status_id, notes) values ('e4000000-0000-4000-a000-000000000002', 3, 'x') $$, '42501', null, 'Almacén no pasa a En aduana');
select throws_ok($$ select public.transition_package_ready('e4000000-0000-4000-a000-000000000002', 'x') $$, 'P0001', 'Solo administradores pueden marcar Listo para recoger', 'Almacén no marca Listo');
select throws_ok($$ select public.register_package('a2000000-0000-4000-a000-000000000002', 'T4-A', 1, 1, 1) $$, 'P0001', 'El paquete debe asignarse a un cliente', 'Solo se asignan paquetes a clientes');
select throws_ok($$ select public.register_package('c1000000-0000-4000-a000-000000000001', 'T4-P0', 1, 1, 0) $$, 'P0001', 'El peso debe ser mayor que 0 y como máximo 1000 lb', 'Se valida el peso en la base');
select lives_ok($$ select public.register_package('c1000000-0000-4000-a000-000000000001', '  T4-R  ', 1, 2, 2) $$, 'Almacén registra con la RPC');
select is((select price from public.packages where tracking_code = 'T4-R'), 14.30::numeric, 'El precio se calcula en la base: 2 × 6.50 × 1.10');
select is((select count(*)::int from public.package_status_history h join public.packages p on p.id = h.package_id where p.tracking_code = 'T4-R' and h.status_id = 1), 1, 'Se crea junto con su estado inicial');
select lives_ok($$ select public.register_package('c1000000-0000-4000-a000-000000000001', 'T4-O', 1, 4, 1) $$, 'La categoría Otros se puede registrar');
select is((select price from public.packages where tracking_code = 'T4-O'), 6.50::numeric, 'Otros se cobra ×1.00');
reset role;

-- Repartidor
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd4000000-0000-4000-a000-000000000004', true);
select is((select count(*)::int from public.deliveries where id = 'b4000000-0000-4000-a000-000000000001'), 1, 'El repartidor ve los pedidos disponibles');
select is((select count(*)::int from public.delivery_packages), 1, 'El repartidor ve los vínculos de los pedidos disponibles');
select throws_ok($$ select public.complete_delivery('b4000000-0000-4000-a000-000000000001', 'efectivo') $$, '42501', null, 'No cierra un pedido que no aceptó');
select throws_ok($$ select public.accept_delivery('b4000000-0000-4000-a000-000000000001', 'c1000000-0000-4000-a000-000000000001') $$, '42501', null, 'No acepta a nombre de otro');
select ok(public.accept_delivery('b4000000-0000-4000-a000-000000000001', 'd4000000-0000-4000-a000-000000000004'), 'Acepta con su propio id, igual que la app móvil');
select is(public.delivery_balance('b4000000-0000-4000-a000-000000000001'), 13::numeric, 'Consulta el saldo antes de cobrar');
select lives_ok($$ update public.deliveries set status = 'en_camino', on_the_way_at = now() where id = 'b4000000-0000-4000-a000-000000000001' $$, 'Actualiza a en camino como la app móvil');
select lives_ok($$ select public.complete_delivery('b4000000-0000-4000-a000-000000000001', 'efectivo') $$, 'Cierra su pedido y cobra');
select throws_ok($$ select public.complete_delivery('b4000000-0000-4000-a000-000000000001', 'efectivo') $$, 'P0001', 'El pedido ya cambió de estado', 'No se cobra dos veces');
reset role;
select is((select status from public.invoices where id = 'f4000000-0000-4000-a000-000000000001'), 'pagada', 'El recibo queda pagado');
select is((select count(*)::int from public.payments where invoice_id = 'f4000000-0000-4000-a000-000000000001'), 1, 'Un solo pago');
select is((select count(*)::int from public.notifications where user_id = 'c1000000-0000-4000-a000-000000000001' and type = 'entrega_confirmada'), 1, 'El cliente recibe el aviso de entrega');
select is((select count(*)::int from public.notifications where user_id = 'c1000000-0000-4000-a000-000000000001' and type = 'pago_registrado'), 1, 'El cliente recibe el aviso del pago');

-- Administrador
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-a000-000000000002', true);
update public.package_status_history set notes = 'editado' where package_id = 'e4000000-0000-4000-a000-000000000001';
delete from public.package_status_history where package_id = 'e4000000-0000-4000-a000-000000000001';
select is((select count(*)::int from public.package_status_history where package_id = 'e4000000-0000-4000-a000-000000000001' and notes = 'Sucursal'), 1, 'RNF-30: ni el admin edita o borra el historial');
select is((public.admin_dashboard() ->> 'deliveries')::int, 1, 'El dashboard cuenta la entrega del mes');
select is((public.admin_dashboard() ->> 'income')::numeric, 13::numeric, 'El dashboard suma los ingresos del mes');
select is((public.admin_dashboard('2000-01-15') ->> 'deliveries')::int, 0, 'El dashboard respeta el mes pedido');
select is((public.admin_dashboard() -> 'deliverers' -> 0 ->> 'month_delivered')::int, 1, 'El reporte cuenta por repartidor');
select is((select count(*)::int from jsonb_array_elements(public.admin_dashboard() -> 'packages_by_status')), 4, 'El dashboard trae los 4 estados');
select throws_ok($$ select public.reissue_invoice('e4000000-0000-4000-a000-000000000002') $$, 'P0001', 'El paquete debe estar Listo para recoger', 'Solo se reemite si está Listo');
select throws_ok($$ select public.reissue_invoice('e4000000-0000-4000-a000-000000000001') $$, 'P0001', 'El paquete ya tiene un recibo activo', 'No se reemite con un recibo activo');
reset role;

-- Reemisión tras anular: una sola fila por paquete, compatible con la app móvil.
insert into public.packages (id, user_id, tracking_code, shipping_method_id, package_type_id, weight, price) values
  ('e4000000-0000-4000-a000-000000000005', 'c1000000-0000-4000-a000-000000000001', 'T4-5', 1, 1, 1, 6.5);
insert into public.package_status_history (package_id, status_id, notes) values ('e4000000-0000-4000-a000-000000000005', 4, 'Sucursal');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-a000-000000000002', true);
create temp table t4_rec on commit drop as select public.create_invoice('c1000000-0000-4000-a000-000000000001', array['e4000000-0000-4000-a000-000000000005'::uuid]) as id;
select lives_ok($$ select public.cancel_unpaid_invoice((select id from t4_rec)) $$, 'Se anula el recibo');
select lives_ok($$ select public.reissue_invoice('e4000000-0000-4000-a000-000000000005') $$, 'Se genera de nuevo');
select is((select count(*)::int from public.invoice_items where package_id = 'e4000000-0000-4000-a000-000000000005'), 1, 'Una sola fila por paquete');
select matches((select notes from public.invoices where id = (select id from t4_rec)), 'Reemitido en REC-', 'El recibo anulado indica cuál lo reemplaza');
reset role;

select * from finish();
rollback;
