import { resolveRole, type Role } from '@/features/acceso';
import { supabase } from '@/lib/supabase';

export const PAGE_SIZE = 20;

export type RoleFilter = 'todos' | Role;

export type UserListItem = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  casillero: string;
  role: Role;
  createdAt: string;
};

export type UsersPage = { items: UserListItem[]; total: number };

const COLUMNS = 'id, name, last_name, email, phone, address, casillero, role, is_admin, created_at';

/** Quita caracteres que rompen el filtro `or` de PostgREST. */
export function sanitizeSearch(term: string): string {
  return term
    .replace(/[,()*%\\]/g, ' ')
    .trim()
    .slice(0, 60);
}

/** RF-60: listar y buscar usuarios (por nombre, apellido, correo o casillero), paginado (RNF-25). */
export async function listUsers({
  search,
  role,
  page,
}: {
  search: string;
  role: RoleFilter;
  page: number;
}): Promise<UsersPage> {
  let query = supabase
    .from('users')
    .select(COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  const term = sanitizeSearch(search);
  if (term) {
    const like = `%${term}%`;
    query = query.or(
      `name.ilike.${like},last_name.ilike.${like},email.ilike.${like},casillero.ilike.${like}`,
    );
  }

  // Admin = is_admin, igual que las políticas RLS (is_admin_user()).
  if (role === 'admin') query = query.eq('is_admin', true);
  else if (role === 'cliente') query = query.eq('role', 'cliente').eq('is_admin', false);
  else if (role !== 'todos') query = query.eq('role', role);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    total: count ?? 0,
    items: data.map((row) => ({
      id: row.id,
      name: row.name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      casillero: row.casillero,
      role: resolveRole(row),
      createdAt: row.created_at,
    })),
  };
}

/** RF-61: RPC existente de la app móvil. */
export async function promoteToRepartidor(userId: string, phone: string): Promise<void> {
  const { error } = await supabase.rpc('promote_to_repartidor', {
    target_user_id: userId,
    user_phone: phone || undefined,
  });
  if (error) throw error;
}

/** RF-62: asignar almacén o devolver a cliente (RPC set_user_role, solo admin). */
export async function setUserRole(userId: string, role: 'cliente' | 'almacen'): Promise<void> {
  const { error } = await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role });
  if (error) throw error;
}
