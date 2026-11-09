import { INVOICES_PAGE_SIZE, type Invoice } from '@/features/facturacion';
import { supabase } from '@/lib/supabase';

export type ReceiptCard = {
  invoice: Invoice;
  title: string;
  category: string;
  method: string;
  /** Estado de la entrega para el cliente. */
  delivery: { label: string; done: boolean };
};

const DELIVERY_LABELS: Record<string, string> = {
  disponible: 'Buscando repartidor',
  aceptado: 'Repartidor asignado',
  en_camino: 'En camino',
  entregado: 'Entregado',
};

/** RF-38: historial del cliente; cada recibo muestra sus paquetes y cómo se entrega. */
export async function listReceiptCards(userId: string, page: number) {
  const { data, error, count } = await supabase
    .from('invoices')
    .select(
      'id,invoice_number,user_id,subtotal,tax_amount,has_delivery,delivery_cost,total,status,created_at,notes,invoice_items(package:packages(tracking_code,type:package_types(name),method:shipping_methods(name))),deliveries(status)',
      { count: 'exact' },
    )
    .eq('user_id', userId)
    .eq('document_type', 'recibo')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page * INVOICES_PAGE_SIZE, (page + 1) * INVOICES_PAGE_SIZE - 1);
  if (error) throw error;

  const items = data.map(({ invoice_items, deliveries, ...invoice }): ReceiptCard => {
    const packages = invoice_items.map((item) => item.package);
    const first = packages[0];
    const active = deliveries.find((delivery) => delivery.status !== 'cancelado');
    return {
      invoice,
      title: first
        ? `${first.tracking_code}${packages.length > 1 ? ` +${packages.length - 1}` : ''}`
        : 'Recibo sin paquetes',
      category: first?.type?.name ?? '',
      method: first?.method?.name ?? 'No disponible',
      delivery: active
        ? { label: DELIVERY_LABELS[active.status] ?? active.status, done: active.status === 'entregado' }
        : { label: 'Retiro en sucursal', done: false },
    };
  });
  return { items, total: count ?? 0 };
}
