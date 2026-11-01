import { useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  Modal,
  SelectField,
  TextField,
  useToast,
} from '@/components/ui';
import { formatDateTime, formatInvoiceNumber, formatUSD } from '@/lib/format';
import { useCancelUnpaidInvoice, useInvoiceDetail, useRegisterInvoicePayment } from '../hooks/useInvoices';
import { PAYMENT_METHODS, type Invoice, type PaymentMethod } from '../services/invoicesService';

type Props = { invoice: Invoice | null; onClose: () => void };
const cents = (amount: number) => Math.round(amount * 100);

export function InvoiceDetailModal({ invoice, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [reference, setReference] = useState('');
  const [bankName, setBankName] = useState('');
  const detail = useInvoiceDetail(invoice?.id ?? null);
  const register = useRegisterInvoicePayment();
  const cancelInvoice = useCancelUnpaidInvoice();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const toast = useToast();
  const paidCents = (detail.data?.payments ?? []).reduce((sum, item) => sum + cents(Number(item.amount)), 0);
  const balanceCents = Math.max(0, cents(Number(invoice?.total ?? 0)) - paidCents);
  const amountCents = cents(Number(amount));
  const canPay = Boolean(invoice && invoice.status !== 'anulada' && balanceCents > 0);
  const canCancel = Boolean(
    invoice && invoice.status !== 'anulada' && detail.data && detail.data.payments.length === 0,
  );
  const amountValid =
    amount.trim() !== '' &&
    /^\d+(\.\d{1,2})?$/.test(amount.trim()) &&
    amountCents > 0 &&
    amountCents <= balanceCents;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoice || !canPay || !amountValid || register.isPending) return;
    try {
      await register.mutateAsync({
        invoiceId: invoice.id,
        amount: amountCents / 100,
        method,
        reference,
        bankName,
      });
      setAmount('');
      setReference('');
      setBankName('');
      toast.success('Pago registrado correctamente.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible registrar el pago.');
    }
  }

  async function cancelSelectedInvoice() {
    if (!invoice || !canCancel || cancelInvoice.isPending) return;
    try {
      await cancelInvoice.mutateAsync(invoice.id);
      setConfirmCancel(false);
      toast.success('Recibo anulado correctamente.');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible anular el recibo.');
    }
  }

  return (
    <Modal
      open={Boolean(invoice)}
      onClose={() => {
        if (!register.isPending && !cancelInvoice.isPending) onClose();
      }}
      title={`Detalle de ${formatInvoiceNumber(invoice?.invoice_number)}`}
      className="max-w-2xl"
    >
      {detail.isPending ? (
        <LoadingState message="Cargando recibo…" />
      ) : detail.isError ? (
        <ErrorState onRetry={() => void detail.refetch()} />
      ) : invoice ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-600">{formatDateTime(invoice.created_at)}</span>
            <Badge
              tone={
                invoice.status === 'pagada' ? 'success' : invoice.status === 'anulada' ? 'warning' : 'info'
              }
            >
              {invoice.status}
            </Badge>
          </div>
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <h3 className="font-semibold">Paquetes del recibo</h3>
            {detail.data?.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span>{item.description}</span>
                <span>{formatUSD(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatUSD(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Impuesto</span>
              <span>{formatUSD(invoice.tax_amount)}</span>
            </div>
            {invoice.has_delivery && (
              <div className="flex justify-between text-sm">
                <span>Delivery</span>
                <span>{formatUSD(invoice.delivery_cost)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatUSD(invoice.total)}</span>
            </div>
          </div>
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <h3 className="font-semibold">Pagos registrados</h3>
            {detail.data?.payments.length ? (
              detail.data.payments.map((payment) => (
                <div key={payment.id} className="flex flex-wrap justify-between gap-2 text-sm">
                  <span>
                    {formatDateTime(payment.paid_at)} ·{' '}
                    {PAYMENT_METHODS.find((item) => item.value === payment.method)?.label ?? payment.method}
                    {payment.reference ? ` · ${payment.reference}` : ''}
                  </span>
                  <span>{formatUSD(payment.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No hay pagos registrados.</p>
            )}
            <div className="flex justify-between text-sm">
              <span>Total pagado</span>
              <span>{formatUSD(paidCents / 100)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Saldo pendiente</span>
              <span>{formatUSD(balanceCents / 100)}</span>
            </div>
          </div>
          {canPay && (
            <form onSubmit={(event) => void submit(event)} className="space-y-3">
              <h3 className="font-semibold">Registrar pago</h3>
              <TextField
                label="Monto (USD)"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max={(balanceCents / 100).toFixed(2)}
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                hint={`Máximo: ${formatUSD(balanceCents / 100)}`}
              />
              <SelectField
                label="Método de pago"
                value={method}
                onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Referencia (opcional)"
                maxLength={100}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
              <TextField
                label="Banco (opcional)"
                maxLength={100}
                value={bankName}
                onChange={(event) => setBankName(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={register.isPending}>
                  Cerrar
                </Button>
                <Button type="submit" loading={register.isPending} disabled={!amountValid}>
                  Registrar pago
                </Button>
              </div>
            </form>
          )}
          {!canPay && <p className="text-sm text-slate-600">Este recibo no admite nuevos pagos.</p>}
          {canCancel && !confirmCancel && (
            <div className="border-t border-slate-200 pt-4">
              <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                Anular recibo
              </Button>
            </div>
          )}
          {confirmCancel && canCancel && (
            <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-900">
                ¿Confirmas la anulación de {formatInvoiceNumber(invoice.invoice_number)}?
              </p>
              <p className="text-sm text-red-900">
                Se conservará el recibo y su número, pero su estado cambiará a anulada. Esta acción no se
                puede deshacer desde esta pantalla.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={cancelInvoice.isPending}
                  onClick={() => setConfirmCancel(false)}
                >
                  Volver
                </Button>
                <Button
                  loading={cancelInvoice.isPending}
                  disabled={cancelInvoice.isPending}
                  onClick={() => void cancelSelectedInvoice()}
                >
                  Confirmar anulación
                </Button>
              </div>
            </div>
          )}
          {invoice.status !== 'anulada' && detail.data && detail.data.payments.length > 0 && (
            <p className="text-sm text-slate-600">
              La anulación de recibos con pagos requiere un procedimiento de devolución aprobado.
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
