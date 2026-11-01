-- PROPUESTA T3 PARA REVISIÓN DE JUAN. Habilita los eventos sin cambiar las políticas RLS.
do $$
declare v_table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array array['packages', 'package_status_history', 'deliveries', 'invoice_items', 'payments'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
        and schemaname = 'public' and tablename = v_table) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end;
$$;
