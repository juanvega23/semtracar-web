import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { resolveRole, type Role } from '../roles';

export type CurrentUser = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  casillero: string;
  role: Role;
};

const COLUMNS = 'id, name, last_name, email, phone, address, casillero, role, is_admin';

type UserRow = {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  casillero: string;
  role: string | null;
  is_admin: boolean | null;
};

export function toCurrentUser(row: UserRow): CurrentUser {
  return {
    id: row.id,
    name: row.name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    casillero: row.casillero,
    role: resolveRole(row),
  };
}

/** Fila de public.users del usuario con sesión. null si todavía no existe. */
export async function fetchCurrentUser(userId: string): Promise<CurrentUser | null> {
  const { data, error } = await supabase.from('users').select(COLUMNS).eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? toCurrentUser(data) : null;
}

/** Escucha cambios de la propia fila (cambio de rol en tiempo real, RF-10). */
export function subscribeToCurrentUser(userId: string, onChange: (user: CurrentUser) => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`current-user-${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
      (payload) => onChange(toCurrentUser(payload.new as UserRow)),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
