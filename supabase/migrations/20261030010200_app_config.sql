-- RNF-34: tarifas, multiplicadores y costo de delivery en una tabla, no escritos en los componentes.
-- La web los lee para el cotizador (RF-11 a RF-15). Los RPC existentes (request_delivery, etc.)
-- no se modifican: siguen con sus valores y el cálculo oficial vive en la base (RNF-31).

create table if not exists public.app_config (
  key text primary key,
  value numeric(10, 2) not null check (value >= 0),
  description text not null,
  shipping_method_id integer references public.shipping_methods (id),
  package_type_id integer references public.package_types (id),
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

drop policy if exists "Authenticated can read app config" on public.app_config;
create policy "Authenticated can read app config"
  on public.app_config for select to authenticated
  using (true);

drop policy if exists "Admins manage app config" on public.app_config;
create policy "Admins manage app config"
  on public.app_config for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

revoke all on table public.app_config from anon;
grant select, insert, update, delete on table public.app_config to authenticated;
grant all on table public.app_config to service_role;

create or replace function public.touch_app_config()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_app_config on public.app_config;
create trigger trg_touch_app_config
  before update on public.app_config
  for each row
  execute function public.touch_app_config();

-- Valores actuales de la app móvil (utils/shipping_calculator.dart y deliveryCost).
-- La categoría "Otros" (id 4) no se cotiza, igual que en la app móvil.
insert into public.app_config (key, value, description, shipping_method_id, package_type_id) values
  ('tarifa_aereo', 6.50, 'Tarifa por libra, envío aéreo (USD)', 1, null),
  ('tarifa_maritimo', 3.50, 'Tarifa por libra, envío marítimo (USD)', 2, null),
  ('multiplicador_ropa', 1.00, 'Multiplicador de la categoría Ropa', null, 1),
  ('multiplicador_joyeria', 1.10, 'Multiplicador de la categoría Joyería', null, 2),
  ('multiplicador_electronica', 1.10, 'Multiplicador de la categoría Electrónica/Tecnología', null, 3),
  ('costo_delivery', 3.58, 'Costo de delivery que se suma al recibo (USD)', null, null)
on conflict (key) do nothing;
