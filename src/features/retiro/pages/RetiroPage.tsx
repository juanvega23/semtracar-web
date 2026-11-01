import { useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TextField,
} from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { InvoiceDetailModal } from '@/features/facturacion';
import { formatDateTime, formatFullName, formatInvoiceNumber, formatUSD } from '@/lib/format';
import { useWithdrawalLookup } from '../hooks/useWithdrawalLookup';

/** RF-43–46: consulta por REC y verificación de saldo. Registro de entrega pendiente de RPC aprobada. */
export function RetiroPage() {
  const current = useRequiredCurrentUser();
  const [input, setInput] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const lookup = useWithdrawalLookup(receipt);
  const record = lookup.data;
  const invoice = record?.invoice;
  const eligible = Boolean(invoice?.status === 'pagada' && record?.balanceCents === 0);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowPayment(false);
    setReceipt(input.trim().toUpperCase());
  }

  return (
    <>
      <PageHeader
        title="Retiro en sucursal"
        description="Verificá un recibo REC, consultá su saldo y registrá pagos antes de autorizar el retiro."
      />
      <Card className="space-y-5">
        <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label="Número de recibo"
              placeholder="REC-00001"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              required
            />
          </div>
          <Button type="submit">Buscar recibo</Button>
        </form>

        {lookup.isLoading && <LoadingState message="Consultando recibo…" />}
        {lookup.isError && (
          <ErrorState
            title="No se pudo consultar el recibo"
            description={
              lookup.error instanceof Error ? lookup.error.message : 'Revisa el número e inténtalo de nuevo.'
            }
            onRetry={() => void lookup.refetch()}
          />
        )}
        {lookup.isSuccess && !record && (
          <EmptyState
            title="Recibo no encontrado"
            description="Comprobá el número REC antes de intentar nuevamente."
          />
        )}
        {lookup.isSuccess && record && invoice && (
          <section className="space-y-5 border-t border-slate-200 pt-5" aria-label="Resultado del retiro">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink-900">
                {formatInvoiceNumber(invoice.invoice_number)}
              </h2>
              <Badge tone={eligible ? 'success' : 'warning'}>{invoice.status}</Badge>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Cliente</dt>
                <dd className="font-medium">
                  {record.client ? formatFullName(record.client) : 'No disponible'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Casillero</dt>
                <dd className="font-medium">{record.client?.casillero ?? 'No disponible'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fecha del recibo</dt>
                <dd>{formatDateTime(invoice.created_at)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Paquetes asociados</dt>
                <dd>{record.detail.items.length}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Total</dt>
                <dd>{formatUSD(invoice.total)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Abonado</dt>
                <dd>{formatUSD(record.paidCents / 100)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Saldo pendiente</dt>
                <dd className="font-semibold">{formatUSD(record.balanceCents / 100)}</dd>
              </div>
            </dl>
            <div className="space-y-2">
              <h3 className="font-semibold">Contenido del recibo</h3>
              {record.detail.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span>{item.description}</span>
                  <span>{formatUSD(item.amount)}</span>
                </div>
              ))}
            </div>
            {invoice.status === 'anulada' ? (
              <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
                Este recibo está anulado. No se autoriza el retiro.
              </p>
            ) : eligible ? (
              <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                Pago completo. El recibo está habilitado para revisión de retiro, pero la entrega física
                todavía no se registra en el sistema.
              </p>
            ) : (
              <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                Hay un saldo pendiente o el estado del recibo aún no está pagado. Completá el pago antes de
                autorizar el retiro.
              </p>
            )}
            {current.role === 'admin' && invoice.status !== 'anulada' && record.balanceCents > 0 && (
              <Button onClick={() => setShowPayment(true)}>Registrar pago pendiente</Button>
            )}
            <p className="text-xs text-slate-500">
              La validación se realiza por número de recibo, cliente y saldo.
            </p>
          </section>
        )}
      </Card>
      {showPayment && invoice && (
        <InvoiceDetailModal
          key={invoice.id}
          invoice={invoice}
          onClose={() => {
            setShowPayment(false);
            void lookup.refetch();
          }}
        />
      )}
    </>
  );
}
