-- La función public.handle_new_user() crea la fila en public.users y el casillero NCX-XXXXXX (RF-04)
-- cuando alguien se registra. Su trigger vive en auth.users y no sale en el volcado del esquema public.
-- Se crea solo si no existe ya un trigger que la llame: en producción no cambia nada.

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass
      and p.proname = 'handle_new_user'
      and not t.tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_user();
  end if;
end;
$$;
