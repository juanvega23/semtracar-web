-- Cierra una escalada de privilegios: la política "Users can update own profile" permite que cualquier
-- usuario autenticado actualice TODAS las columnas de su fila, incluidas is_admin y role.
-- Este trigger solo deja cambiar rol, permisos, casillero e id a un admin, o al backend (service_role,
-- panel de Supabase, funciones SECURITY DEFINER sin sesión). Aditivo: la app móvil sigue pudiendo editar
-- nombre, apellido, correo, dirección, teléfono e is_available.

create or replace function public.protect_user_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin_user() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.casillero is distinct from old.casillero
    or new.is_admin is distinct from old.is_admin
    or new.role is distinct from old.role then
    raise exception 'No autorizado para cambiar el rol, los permisos o el casillero'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_user_privileged_columns on public.users;

create trigger trg_protect_user_privileged_columns
  before update on public.users
  for each row
  execute function public.protect_user_privileged_columns();
