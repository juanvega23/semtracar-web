-- Funciones para el registro (RF-02, RF-03) y la gestión de roles (RF-62). Aditivo.

-- RF-02 / RF-03: antes de registrarse el usuario es anónimo y RLS no le deja leer public.users,
-- así que la verificación de duplicados necesita una función SECURITY DEFINER que solo devuelve sí/no.
create or replace function public.is_email_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users where lower(trim(email)) = lower(trim(p_email))
  );
$$;

create or replace function public.is_name_registered(p_name text, p_last_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where lower(trim(name)) = lower(trim(p_name))
      and lower(trim(last_name)) = lower(trim(p_last_name))
  );
$$;

revoke all on function public.is_email_registered(text) from public;
revoke all on function public.is_name_registered(text, text) from public;
grant execute on function public.is_email_registered(text) to anon, authenticated, service_role;
grant execute on function public.is_name_registered(text, text) to anon, authenticated, service_role;

-- RF-62: el admin asigna el rol almacén (o devuelve a cliente). El rol repartidor se asigna con
-- promote_to_repartidor (RF-61). No toca administradores ni el propio usuario.
create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if p_role not in ('cliente', 'almacen') then
    raise exception 'Rol no permitido: %', p_role using errcode = '22023';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol' using errcode = '42501';
  end if;

  update public.users
  set role = p_role
  where id = p_user_id
    and is_admin = false;

  if not found then
    raise exception 'Usuario no encontrado o es administrador' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated, service_role;
