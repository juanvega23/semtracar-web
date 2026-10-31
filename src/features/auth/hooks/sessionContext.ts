import type { Session } from '@supabase/supabase-js';
import { createContext } from 'react';

export type SessionState = {
  session: Session | null;
  /** true hasta saber si hay sesión guardada (evita parpadeos al recargar). */
  loading: boolean;
  /** true si se abrió el enlace de recuperar contraseña. */
  recovering: boolean;
};

export const SessionContext = createContext<SessionState | null>(null);
