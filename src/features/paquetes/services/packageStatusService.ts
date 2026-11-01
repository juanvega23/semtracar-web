import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type StatusHistory = Database['public']['Tables']['package_status_history']['Row'];
export type StatusCatalog = Database['public']['Tables']['status_types']['Row'];
export type StatusWithName = StatusHistory & { name: string };
export type StatusRole = 'admin' | 'almacen';

/** Estados según el catálogo real; no se hardcodean etiquetas de BD. */
export async function getStatusCatalog(): Promise<StatusCatalog[]> {
  const { data, error } = await supabase.from('status_types').select('id, name').order('id');
  if (error) throw error;
  return data;
}

export async function getPackageHistory(packageId: string): Promise<StatusHistory[]> {
  const { data, error } = await supabase
    .from('package_status_history')
    .select('id, package_id, status_id, notes, created_at')
    .eq('package_id', packageId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getLatestStatuses(packageIds: string[]): Promise<Record<string, StatusHistory>> {
  if (!packageIds.length) return {};
  const { data, error } = await supabase
    .from('package_status_history')
    .select('id, package_id, status_id, notes, created_at')
    .in('package_id', packageIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const result: Record<string, StatusHistory> = {};
  for (const item of data) if (!result[item.package_id]) result[item.package_id] = item;
  return result;
}

/** D1: el estado 4 exige recibo automático; no permitir transición incompleta. */
export async function addPackageStatus(input: {
  packageId: string;
  statusId: number;
  location: string;
  role: StatusRole;
}): Promise<void> {
  // input.role llega de useRequiredCurrentUser(); no se vuelve a pedir a la base.
  const isWarehouse = input.role === 'almacen';
  if (!isWarehouse && input.role !== 'admin') {
    throw new Error('Tu cuenta no tiene permisos para modificar este estado.');
  }
  if (![1, 2, 3].includes(input.statusId) || (isWarehouse && input.statusId > 2)) {
    throw new Error('La transición solicitada no está permitida.');
  }
  const location = input.location.trim();
  if (!location || location.length > 200) throw new Error('Ingresa una ubicación de 1 a 200 caracteres.');
  const { data: history, error: historyError } = await supabase
    .from('package_status_history')
    .select('status_id')
    .eq('package_id', input.packageId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (historyError) throw historyError;
  if (!history?.length)
    throw new Error('El paquete no tiene un estado inicial. Solicita revisar su registro.');
  const previous = history[0].status_id;
  if (previous >= input.statusId) throw new Error('El estado debe avanzar respecto al estado actual.');
  if (input.statusId !== previous + 1) throw new Error('No se pueden saltar estados del recorrido.');
  const { error } = await supabase.from('package_status_history').insert({
    package_id: input.packageId,
    status_id: input.statusId,
    notes: location,
  });
  if (error) throw error;
}

/** D1: cambio a estado 4 + creación del recibo en UNA transacción de PostgreSQL (RPC `transition_package_ready`). */
export async function markPackageReady(input: { packageId: string; location: string }): Promise<string> {
  const location = input.location.trim();
  if (!location || location.length > 200) {
    throw new Error('Ingresa una ubicación de 1 a 200 caracteres.');
  }
  // No sustituir por create_invoice + insert en el navegador: serían dos transacciones.
  const { data, error } = await supabase.rpc('transition_package_ready', {
    p_package_id: input.packageId,
    p_location: location,
  });
  if (error) throw error;
  if (!data) throw new Error('La base de datos no devolvió el identificador del recibo.');
  return data;
}
