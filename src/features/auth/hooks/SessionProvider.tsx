import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getSession, onAuthChange, syncPendingProfile } from '../services/authService';
import { SessionContext, type SessionState } from './sessionContext';

/** Mantiene la sesión de Supabase (persistente entre recargas, RF-05). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ session: null, loading: true, recovering: false });
  const syncedUsers = useRef(new Set<string>());

  useEffect(() => {
    let active = true;

    void getSession().then((session) => {
      if (active) setState((s) => ({ ...s, session, loading: false }));
    });

    const unsubscribe = onAuthChange((event, session) => {
      setState((s) => ({
        session,
        loading: false,
        recovering: event === 'PASSWORD_RECOVERY' ? true : event === 'SIGNED_OUT' ? false : s.recovering,
      }));

      // Al cerrar sesión no deben quedar datos de otro usuario en caché.
      if (event === 'SIGNED_OUT') queryClient.clear();

      // Datos del registro pendientes de copiar al perfil (una vez por usuario y carga de la app).
      // Fuera del callback: supabase-js no permite llamarse a sí mismo dentro de onAuthStateChange.
      const user = session?.user;
      if (
        user &&
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
        !syncedUsers.current.has(user.id)
      ) {
        syncedUsers.current.add(user.id);
        window.setTimeout(() => {
          void syncPendingProfile(user).then((changed) => {
            if (changed) void queryClient.invalidateQueries({ queryKey: ['current-user', user.id] });
          });
        }, 0);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient]);

  return <SessionContext value={state}>{children}</SessionContext>;
}
