import type { Role } from '@/features/acceso';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type PackageInput = Pick<
  Database['public']['Tables']['packages']['Insert'],
  'user_id' | 'tracking_code' | 'shipping_method_id' | 'package_type_id' | 'weight'
>;

export const PAGE_SIZE = 15;

export type PackageRow = Database['public']['Tables']['packages']['Row'];

export type PackagePage = {
  items: PackageRow[];
  total: number;
};

export type Catalog = {
  id: number;
  name: string;
};

export type Client = {
  id: string;
  name: string;
  last_name: string;
  casillero: string;
  email: string;
};

/**
 * Obtiene los métodos de envío y tipos de paquetes.
 */
export async function getPackageCatalogs() {
  const [methods, types] = await Promise.all([
    supabase.from('shipping_methods').select('id, name').order('id'),

    supabase.from('package_types').select('id, name').order('id'),
  ]);

  if (methods.error) throw methods.error;
  if (types.error) throw types.error;

  return {
    methods: methods.data,
    types: types.data,
  };
}

/**
 * Busca clientes por nombre, apellido, correo o casillero.
 *
 * Admite búsquedas como "paola miranda".
 * Excluye almacén, repartidores y administradores.
 */
export async function findClients(search: string): Promise<Client[]> {
  const term = search
    .replace(/[,()*%\\]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 60);

  if (term.length < 2) {
    return [];
  }

  const words = term.split(' ');

  const baseQuery = () =>
    supabase
      .from('users')
      .select('id, name, last_name, casillero, email')
      .eq('role', 'cliente')
      .eq('is_admin', false);

  /**
   * Búsqueda por nombre y apellido.
   *
   * Ejemplo:
   * "paola miranda"
   *
   * name contiene "paola"
   * last_name contiene "miranda"
   */
  if (words.length >= 2) {
    const firstName = words[0];
    const lastName = words.slice(1).join(' ');

    const { data, error } = await baseQuery()
      .ilike('name', `%${firstName}%`)
      .ilike('last_name', `%${lastName}%`)
      .order('name')
      .limit(15);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Búsqueda por una sola palabra.
   *
   * Permite buscar por:
   * - Nombre
   * - Apellido
   * - Correo
   * - Casillero
   */
  const like = `%${term}%`;

  const { data, error } = await baseQuery()
    .or(`name.ilike.${like},last_name.ilike.${like},casillero.ilike.${like},email.ilike.${like}`)
    .order('name')
    .limit(15);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Filtros disponibles para el listado de paquetes.
 * statusIds limita los estados visibles para un rol (RF-67).
 */
export type PackageFilters = {
  search: string;
  clientId: string;
  statusId: number | null;
  statusIds?: number[];
};

const PACKAGE_COLUMNS =
  'id,tracking_code,shipping_method_id,package_type_id,user_id,weight,price,is_paid,created_at';

/**
 * RF-19 y RF-67: listado de paquetes con filtros.
 * La vista packages_with_status filtra por estado actual en la base,
 * así la paginación y el contador coinciden con lo que se muestra.
 */
export async function listPackages({
  filters,
  page,
}: {
  filters: PackageFilters;
  page: number;
}): Promise<PackagePage> {
  const term = filters.search
    .replace(/[,()*%\\]/g, ' ')
    .trim()
    .slice(0, 80);

  let query = supabase
    .from('packages_with_status')
    .select(PACKAGE_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (term) query = query.ilike('tracking_code', `%${term}%`);
  if (filters.clientId) query = query.eq('user_id', filters.clientId);
  if (filters.statusId !== null) query = query.eq('current_status_id', filters.statusId);
  if (filters.statusIds) query = query.in('current_status_id', filters.statusIds);

  const { data, error, count } = await query;
  if (error) throw error;
  // Las columnas de una vista se generan como anulables, pero estas vienen tal cual de packages.
  return { items: data as unknown as PackageRow[], total: count ?? 0 };
}

/**
 * D2: únicamente almacén registra paquetes.
 * RF-16 y RNF-23: la RPC calcula el precio y crea el paquete con su estado inicial en una transacción.
 */
export async function registerPackage(input: PackageInput, role: Role): Promise<void> {
  if (role !== 'almacen') {
    throw new Error('Solo almacén registra paquetes.');
  }
  const { error } = await supabase.rpc('register_package', {
    p_user_id: input.user_id,
    p_tracking_code: input.tracking_code,
    p_shipping_method_id: input.shipping_method_id,
    p_package_type_id: input.package_type_id,
    p_weight: input.weight ?? 0,
  });
  if (error) throw error;
}
