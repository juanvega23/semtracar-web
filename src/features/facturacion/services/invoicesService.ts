import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';

export const INVOICES_PAGE_SIZE = 15;
export type Invoice = Pick<
  Tables<'invoices'>,
  | 'id'
  | 'invoice_number'
  | 'user_id'
  | 'subtotal'
  | 'tax_amount'
  | 'has_delivery'
  | 'delivery_cost'
  | 'total'
  | 'status'
  | 'created_at'
>;
export type InvoiceItem = Pick<Tables<'invoice_items'>, 'id' | 'description' | 'amount' | 'package_id'>;
export type Payment = Pick<
  Tables<'payments'>,
  'id' | 'amount' | 'method' | 'reference' | 'bank_name' | 'paid_at'
>;
export type InvoiceDetail = { items: InvoiceItem[]; payments: Payment[] };
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta_datafono' | 'tarjeta_online';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_datafono', label: 'Tarjeta (datáfono)' },
  { value: 'tarjeta_online', label: 'Tarjeta en línea' },
];

export async function listInvoices(
  page: number,
  search: string,
): Promise<{ items: Invoice[]; total: number }> {
  const normalized = search.trim().toUpperCase();
  let query = supabase
    .from('invoices')
    .select(
      'id,invoice_number,user_id,subtotal,tax_amount,has_delivery,delivery_cost,total,status,created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(page * INVOICES_PAGE_SIZE, (page + 1) * INVOICES_PAGE_SIZE - 1);

  if (normalized) {
    const match = /^REC-(\d{1,9})$/.exec(normalized) ?? /^(\d{1,9})$/.exec(normalized);
    if (!match) return { items: [], total: 0 };
    query = query.eq('invoice_number', Number(match[1]));
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0 };
}

export async function getInvoiceDetail(invoiceId: string): Promise<InvoiceDetail> {
  const [itemsResult, paymentsResult] = await Promise.all([
    supabase.from('invoice_items').select('id,description,amount,package_id').eq('invoice_id', invoiceId),
    supabase
      .from('payments')
      .select('id,amount,method,reference,bank_name,paid_at')
      .eq('invoice_id', invoiceId)
      .order('paid_at', { ascending: true }),
  ]);
  if (itemsResult.error) throw itemsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;
  return { items: itemsResult.data ?? [], payments: paymentsResult.data ?? [] };
}

export async function registerInvoicePayment(input: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  bankName: string;
}): Promise<void> {
  if (
    !Number.isFinite(input.amount) ||
    input.amount <= 0 ||
    Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 1e-7
  ) {
    throw new Error('Ingresa un importe positivo válido.');
  }
  const { error } = await supabase.rpc('register_payment', {
    p_invoice_id: input.invoiceId,
    p_amount: input.amount,
    p_method: input.method,
    p_reference: input.reference.trim() || undefined,
    p_bank_name: input.bankName.trim() || undefined,
  });
  if (error) throw error;
}

/** RF-37: RPC transaccional; rechaza recibos con pagos. */
export async function cancelUnpaidInvoice(invoiceId: string): Promise<void> {
  const { error } = await supabase.rpc(
    'cancel_unpaid_invoice' as never,
    { p_invoice_id: invoiceId } as never,
  );
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') {
      throw new Error('La función para anular recibos aún no está instalada. Solicita su revisión a Juan.');
    }
    throw error;
  }
}
