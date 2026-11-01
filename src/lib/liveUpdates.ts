import { useEffect, useId } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { Database } from '@/types/database';

type Watch = { table: keyof Database['public']['Tables']; filter?: string };

/** Invalida consultas sin guardar datos del evento. RLS controla las lecturas. */
export function subscribeToChanges(name: string, watches: readonly Watch[], onChange: () => void) {
  const channel = supabase.channel(name);
  for (const watch of watches)
    channel.on('postgres_changes', { event: '*', schema: 'public', ...watch }, onChange);
  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Las consultas añaden refetchInterval como respaldo mientras Juan habilita la publicación. */
export function useLiveUpdates(scope: string, userId: string, watches: readonly Watch[]) {
  const client = useQueryClient();
  const instance = useId();
  useEffect(
    () =>
      subscribeToChanges(`${scope}-${userId}-${instance}`, watches, () => {
        void client.invalidateQueries({ queryKey: [scope, userId] });
      }),
    [client, scope, userId, watches, instance],
  );
}
