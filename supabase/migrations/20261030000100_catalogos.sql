-- Catálogos tal como están en producción. En producción no cambia nada (on conflict do nothing);
-- sirve para que una base local (supabase start / db reset) tenga los mismos ids.

insert into public.status_types (id, name) values
  (1, 'Recibido'),
  (2, 'En tránsito'),
  (3, 'En aduana'),
  (4, 'Listo para recoger')
on conflict (id) do nothing;

insert into public.shipping_methods (id, name) values
  (1, 'Aéreo'),
  (2, 'Marítimo')
on conflict (id) do nothing;

insert into public.package_types (id, name) values
  (1, 'Ropa'),
  (2, 'Joyeria'),
  (3, 'Electronica/Tecnologia'),
  (4, 'Otros')
on conflict (id) do nothing;
