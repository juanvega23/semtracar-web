-- Cuentas de prueba SOLO para Supabase local (D6). Se cargan con `supabase start` (primera vez) y `supabase db reset`.
-- Nunca se aplican en producción: `supabase db push` no ejecuta este archivo.
-- Contraseña de todas: Prueba1234

with cuentas (id, email, nombre, apellido) as (
  values
    ('c1000000-0000-4000-a000-000000000001'::uuid, 'cliente@prueba.local',    'Carla',  'Cliente'),
    ('a2000000-0000-4000-a000-000000000002'::uuid, 'admin@prueba.local',      'Andrés', 'Admin'),
    ('b3000000-0000-4000-a000-000000000003'::uuid, 'almacen@prueba.local',    'Alma',   'Almacén'),
    ('d4000000-0000-4000-a000-000000000004'::uuid, 'repartidor@prueba.local', 'Rafael', 'Repartidor')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('Prueba1234', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('name', nombre, 'last_name', apellido), now(), now(),
  '', '', '', '', '', '', '', ''
from cuentas;

-- Identidad de correo (sin ella GoTrue no deja iniciar sesión).
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now()
from auth.users
where email like '%@prueba.local';

-- El trigger handle_new_user ya creó cada fila en public.users con su casillero. Faltan datos y roles.
update public.users set address = 'Managua, Nicaragua', phone = '+505 8888 0001'
where email = 'cliente@prueba.local';
update public.users set is_admin = true where email = 'admin@prueba.local';
update public.users set role = 'almacen' where email = 'almacen@prueba.local';
update public.users set role = 'repartidor', phone = '+505 8888 0004' where email = 'repartidor@prueba.local';

-- El webhook de push apunta a la Edge Function de producción y necesita pg_net, que no existe en local.
-- Sin esto, cualquier insert en package_status_history falla en local. En producción el trigger sigue intacto.
drop trigger if exists on_package_status_insert on public.package_status_history;
