import { z } from 'zod';
import { phoneSchema } from '@/features/auth';
import { getLatestStatuses } from '@/features/paquetes';
import { supabase, type Tables } from '@/lib/supabase';

export const ORDERS_PAGE_SIZE = 15;
export const DELIVERY_STATUSES = {
  disponible: 'Buscando repartidor',
  aceptado: 'Aceptado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
} as const;
export type DeliveryStatus = keyof typeof DELIVERY_STATUSES;
export type Delivery = Pick<
  Tables<'deliveries'>,
  | 'id'
  | 'invoice_id'
  | 'package_id'
  | 'client_id'
  | 'delivery_address'
  | 'client_phone'
  | 'client_name'
  | 'deliverer_name'
  | 'status'
  | 'created_at'
  | 'accepted_at'
  | 'on_the_way_at'
  | 'delivered_at'
  | 'package_count'
  | 'package_tracking'
> & {
  invoice: { invoice_number: number | null; total: number; payments: { id: string }[] } | null;
  client: { name: string; last_name: string; phone: string | null; casillero: string } | null;
  package: { tracking_code: string } | null;
};
export type DeliveryCandidate = Pick<
  Tables<'invoices'>,
  'id' | 'invoice_number' | 'total' | 'status' | 'delivery_choice'
> & {
  items: Pick<Tables<'invoice_items'>, 'id' | 'package_id' | 'description' | 'amount'>[];
  canRequest: boolean;
  hasDelivery: boolean;
  hasPayments: boolean;
};
export class DeliveryValidationError extends Error {}

export const deliveryContactSchema = z.object({
  address: z
    .string()
    .trim()
    .min(5, 'Escribe una dirección de al menos 5 caracteres.')
    .max(250, 'La dirección es demasiado larga.'),
  phone: phoneSchema,
});

export async function listDeliveries(page: number, status: string, userId?: string) {
  let query = supabase
    .from('deliveries')
    .select(
      'id,invoice_id,package_id,client_id,delivery_address,client_phone,client_name,deliverer_name,status,created_at,accepted_at,on_the_way_at,delivered_at,package_count,package_tracking,invoice:invoices!deliveries_invoice_id_fkey(invoice_number,total,payments(id)),client:users!deliveries_client_id_fkey(name,last_name,phone,casillero),package:packages!deliveries_package_id_fkey(tracking_code)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page * ORDERS_PAGE_SIZE, (page + 1) * ORDERS_PAGE_SIZE - 1);
  if (userId) query = query.eq('client_id', userId);
  if (status && status in DELIVERY_STATUSES) query = query.eq('status', status);
  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data, total: count ?? 0 };
}

export async function listDeliveryCandidates(userId: string, page: number) {
  const { data, error, count } = await supabase
    .from('invoices')
    .select(
      'id,invoice_number,total,status,delivery_choice,items:invoice_items(id,package_id,description,amount,package:packages(deliveries(id),delivery_packages(id))),payments(id)',
      { count: 'exact' },
    )
    .eq('user_id', userId)
    .eq('document_type', 'recibo')
    .neq('status', 'anulada')
    .eq('has_delivery', false)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page * ORDERS_PAGE_SIZE, (page + 1) * ORDERS_PAGE_SIZE - 1);
  if (error) throw error;
  const packageIds = data.flatMap((invoice) => invoice.items.map((item) => item.package_id));
  const latest = await getLatestStatuses(packageIds);
  // Los recibos completos son la unidad de selección, para no omitir paquetes al consolidar.
  return {
    items: data.map(({ payments, items, ...invoice }): DeliveryCandidate => {
      const hasDelivery = items.some((item) =>
        Boolean(item.package?.deliveries.length || item.package?.delivery_packages.length),
      );
      return {
        ...invoice,
        items: items.map((item) => ({
          id: item.id,
          package_id: item.package_id,
          description: item.description,
          amount: item.amount,
        })),
        hasPayments: payments.length > 0,
        hasDelivery,
        canRequest:
          !hasDelivery && items.length > 0 && items.every((item) => latest[item.package_id]?.status_id === 4),
      };
    }),
    total: count ?? 0,
  };
}

/** La RPC ya confirmó el pedido: un fallo del push nunca debe provocar otra solicitud. */
export async function notifyDeliverers(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      timeout: 10_000,
      body: {
        title: 'Nuevo pedido de delivery',
        body: 'Hay un nuevo pedido disponible en SEMTRACAR.',
        role: 'repartidor',
      },
    });
    return !error && data?.success !== false && !data?.error;
  } catch {
    return false;
  }
}

export async function requestDelivery(input: { userId: string; invoiceIds: string[]; address: string }) {
  const ids = [...new Set(input.invoiceIds)];
  if (!ids.length || ids.length > ORDERS_PAGE_SIZE)
    throw new DeliveryValidationError('Selecciona entre 1 y 15 recibos completos.');
  // Leer de nuevo antes de escribir: no confiar en selección ni importes guardados en el navegador.
  const { data, error } = await supabase
    .from('invoices')
    .select(
      'id,status,has_delivery,items:invoice_items(package_id,package:packages(deliveries(id),delivery_packages(id))),payments(id)',
    )
    .eq('user_id', input.userId)
    .in('id', ids);
  if (error) throw error;
  if (
    data.length !== ids.length ||
    data.some((invoice) => invoice.status === 'anulada' || invoice.has_delivery || !invoice.items.length)
  ) {
    throw new DeliveryValidationError('Uno de los recibos ya no está disponible. Actualiza la lista.');
  }
  const packageIds = data.flatMap((invoice) => invoice.items.map((item) => item.package_id));
  if (
    data.some((invoice) =>
      invoice.items.some((item) => item.package?.deliveries.length || item.package?.delivery_packages.length),
    )
  ) {
    throw new DeliveryValidationError(
      'Uno de los paquetes ya tiene un delivery registrado, aunque esté cancelado. No admite otra solicitud.',
    );
  }
  if (new Set(packageIds).size !== packageIds.length)
    throw new DeliveryValidationError(
      'Hay paquetes repetidos entre los recibos seleccionados. Solicita revisión.',
    );
  const latest = await getLatestStatuses(packageIds);
  if (packageIds.some((id) => latest[id]?.status_id !== 4))
    throw new DeliveryValidationError('Todos los paquetes deben estar listos para recoger.');
  if (packageIds.length > 1 && data.some((invoice) => invoice.payments.length > 0))
    throw new DeliveryValidationError(
      'Para agrupar paquetes, los recibos deben estar sin pagos. Solicita revisión a administración.',
    );
  const address = input.address.trim();
  if (address.length < 5 || address.length > 250)
    throw new DeliveryValidationError('Revisa la dirección de entrega.');
  const result =
    packageIds.length === 1
      ? await supabase.rpc('request_delivery', {
          p_invoice_id: data[0].id,
          p_package_id: packageIds[0],
          p_delivery_address: address,
        })
      : await supabase.rpc('request_delivery_multi', {
          p_package_ids: packageIds,
          p_delivery_address: address,
        });
  if (result.error) throw result.error;
  return { notified: await notifyDeliverers() };
}

export async function declineDelivery(invoiceId: string) {
  const { error } = await supabase.rpc('decline_delivery', { p_invoice_id: invoiceId });
  if (error) throw error;
}

export async function cancelDelivery(id: string, role: string) {
  if (role !== 'admin') throw new DeliveryValidationError('Solo administración puede cancelar pedidos.');
  const { error } = await supabase.rpc('cancel_delivery', { p_delivery_id: id });
  if (error) {
    if (/tiene pagos/i.test(error.message))
      throw new DeliveryValidationError(
        'Este recibo tiene pagos. La cancelación requiere revisión administrativa.',
      );
    if (/ya cambió de estado/i.test(error.message))
      throw new DeliveryValidationError('El pedido ya cambió de estado. Actualiza la lista.');
    throw error;
  }
}
