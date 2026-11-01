import type { Role } from '@/features/acceso';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { getLatestStatuses } from './packageStatusService';

export type PackageInput = Pick<
  Database['public']['Tables']['packages']['Insert'],
  'user_id' | 'tracking_code' | 'shipping_method_id' | 'package_type_id' | 'weight' | 'price'
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
 */
export type PackageFilters = {
  search: string;
  clientId: string;
  statusId: number | null;
};

/**
 * RF-19: listado de paquetes con filtros.
 *
 * Código y cliente se filtran en PostgreSQL.
 *
 * Para el estado actual, se consulta el último
 * movimiento del historial antes de paginar.
 *
 * En volúmenes grandes, este recorrido deberá
 * optimizarse mediante una vista o RPC.
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

  function baseQuery() {
    let query = supabase
      .from('packages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (term) {
      query = query.ilike('tracking_code', `%${term}%`);
    }

    if (filters.clientId) {
      query = query.eq('user_id', filters.clientId);
    }

    return query;
  }

  /**
   * Sin filtro de estado:
   * paginación directa desde PostgreSQL.
   */
  if (filters.statusId === null) {
    const { data, error, count } = await baseQuery().range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    return {
      items: data,
      total: count ?? 0,
    };
  }

  /**
   * Con filtro de estado:
   * obtener el estado más reciente de cada paquete
   * antes de aplicar la paginación final.
   */
  const matched: PackageRow[] = [];
  const BATCH = 150;

  for (let offset = 0; ; offset += BATCH) {
    const { data, error } = await baseQuery().range(offset, offset + BATCH - 1);

    if (error) {
      throw error;
    }

    if (!data.length) {
      break;
    }

    const latest = await getLatestStatuses(data.map((item) => item.id));

    for (const item of data) {
      if (latest[item.id]?.status_id === filters.statusId) {
        matched.push(item);
      }
    }

    if (data.length < BATCH) {
      break;
    }
  }

  return {
    items: matched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    total: matched.length,
  };
}

/**
 * D2: únicamente almacén puede registrar paquetes.
 *
 * La comprobación del frontend es adicional.
 * La autorización definitiva debe aplicarse
 * mediante las políticas RLS de Supabase.
 */
export async function registerPackage(input: PackageInput, role: Role): Promise<void> {
  // El rol llega de useRequiredCurrentUser(); no se vuelve a pedir a la base.
  if (role !== 'almacen') {
    throw new Error('Solo almacén registra paquetes.');
  }

  /**
   * Registrar paquete.
   */
  const { data: created, error } = await supabase.from('packages').insert(input).select('id').single();

  if (error) {
    throw error;
  }

  /**
   * Registrar el estado inicial.
   *
   * El esquema actual no dispone de una RPC
   * transaccional para registrar el paquete
   * y su primer estado conjuntamente.
   *
   * Si falla esta operación, no se debe volver
   * a insertar el mismo paquete.
   */
  const { error: statusError } = await supabase.from('package_status_history').insert({
    package_id: created.id,
    status_id: 1,
    notes: 'Recibido en Estados Unidos',
  });

  if (statusError) {
    throw new Error(
      'Se guardó el paquete, pero falló su estado inicial. No lo registres otra vez; informa al encargado para revisarlo.',
    );
  }
}
