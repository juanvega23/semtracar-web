import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceDetail } from '@/features/facturacion';

export type WithdrawalLookup = {
  invoice: Invoice;
  client: { name: string; last_name: string; casillero: string | null } | null;
  detail: InvoiceDetail;
  paidCents: number;
  balanceCents: number;
};

/** Busca un recibo por número REC; no valida ni registra una entrega física. */
export async function lookupWithdrawal(receipt: string): Promise<WithdrawalLookup | null> {
  const match = /^REC-(\d{1,9})$/i.exec(receipt.trim());
  if (!match) throw new Error('Ingresa un número válido con formato REC-00001.');
  const invoiceNumber = Number(match[1]);
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(
      'id,invoice_number,user_id,subtotal,tax_amount,has_delivery,delivery_cost,total,status,created_at',
    )
    .eq('document_type', 'recibo')
    .eq('invoice_number', invoiceNumber)
    .maybeSingle();
  if (invoiceError) throw invoiceError;
  if (!invoice) return null;

  const [userResult, itemsResult, paymentsResult] = await Promise.all([
    supabase.from('users').select('name,last_name,casillero').eq('id', invoice.user_id).maybeSingle(),
    supabase.from('invoice_items').select('id,description,amount,package_id').eq('invoice_id', invoice.id),
    supabase
      .from('payments')
      .select('id,amount,method,reference,bank_name,paid_at')
      .eq('invoice_id', invoice.id)
      .order('paid_at', { ascending: true }),
  ]);
  if (userResult.error) throw userResult.error;
  if (itemsResult.error) throw itemsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const detail: InvoiceDetail = {
    items: itemsResult.data ?? [],
    payments: paymentsResult.data ?? [],
  };
  const paidCents = detail.payments.reduce(
    (sum, payment) => sum + Math.round(Number(payment.amount) * 100),
    0,
  );
  const balanceCents = Math.max(0, Math.round(Number(invoice.total) * 100) - paidCents);
  return { invoice, client: userResult.data, detail, paidCents, balanceCents };
}
