import { getLatestStatuses, listPackages } from '@/features/paquetes';
import { supabase } from '@/lib/supabase';

export async function listMyPackages(userId: string, page: number, search: string) {
  const result = await listPackages({ page, filters: { clientId: userId, search, statusId: null } });
  const latest = await getLatestStatuses(result.items.map((item) => item.id));
  return { ...result, latest };
}

/** El paquete se entrega a domicilio si su recibo activo tiene delivery. */
export async function packageHasDelivery(packageId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('invoice:invoices!inner(has_delivery,status)')
    .eq('package_id', packageId)
    .neq('invoice.status', 'anulada')
    .limit(1);
  if (error) throw error;
  return data[0]?.invoice.has_delivery ?? false;
}
