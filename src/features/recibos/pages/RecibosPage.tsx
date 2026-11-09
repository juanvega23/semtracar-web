import { useState, type ReactNode } from 'react';
import {
  ArchiveIcon,
  Button,
  CalendarIcon,
  Card,
  CheckCircleIcon,
  CheckSquareIcon,
  ClockIcon,
  cn,
  EmptyState,
  ErrorState,
  InboxIcon,
  LoadingState,
  ReceiptIcon,
  TruckIcon,
} from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { INVOICES_PAGE_SIZE, InvoiceDetailModal, type Invoice } from '@/features/facturacion';
import { formatShortDate, formatUSD } from '@/lib/format';
import { useMyInvoices } from '../hooks/useMyInvoices';

const PAYMENT: Record<string, { label: string; className: string }> = {
  pagada: { label: 'Pagado', className: 'bg-[#e0f7e6] text-[#34c759]' },
  parcial: { label: 'Pago parcial', className: 'bg-[#fff4d6] text-[#b88a00]' },
  pendiente: { label: 'Pendiente', className: 'bg-[#e3f2ff] text-[#0088ff]' },
  anulada: { label: 'Anulado', className: 'bg-[#ffe8e8] text-[#ff383c]' },
};

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-11 items-center gap-2 rounded-full bg-[#ebebee] px-4 text-lg font-semibold text-[#8e8e93]">
      <span aria-hidden="true">{icon}</span>
      {children}
    </span>
  );
}

export function RecibosPage() {
  const user = useRequiredCurrentUser();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const query = useMyInvoices(page);
  const total = query.data?.total ?? 0;

  return (
    <div className="mx-auto max-w-[558px] pt-4 lg:pt-10">
      <h1 className="sr-only">Historial</h1>
      {query.isPending ? (
        <LoadingState message="Cargando tus recibos…" />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !query.data.items.length ? (
        <EmptyState
          title="Todavía no tienes recibos"
          description="Tus recibos aparecerán cuando los paquetes estén listos para recoger."
        />
      ) : (
        <>
          <ul className="space-y-5">
            {query.data.items.map(({ invoice, title, category, method, delivery }) => {
              const payment = PAYMENT[invoice.status] ?? PAYMENT.pendiente;
              return (
                <li key={invoice.id}>
                  <Card className="px-4 py-8 sm:px-[17px]">
                    <div className="flex flex-wrap items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="flex size-[69px] shrink-0 items-center justify-center rounded-lg bg-[#d5d6dd] text-ink-900"
                      >
                        <ArchiveIcon size={38} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-bold break-all text-ink-900">{title}</h2>
                        <p className="font-semibold text-[#8e8e93]">{category}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex h-11 items-center gap-2 rounded-full px-4 text-xl font-bold',
                          payment.className,
                        )}
                      >
                        <CheckCircleIcon size={22} aria-hidden="true" />
                        {payment.label}
                      </span>
                    </div>

                    <hr className="mx-4 my-6 border-[#e3e3e8]" />

                    <div className="flex flex-wrap gap-3">
                      <Chip icon={<TruckIcon size={24} />}>{method}</Chip>
                      <Chip icon={<InboxIcon size={22} />}>{user.casillero}</Chip>
                      <Chip icon={<CalendarIcon size={22} />}>{formatShortDate(invoice.created_at)}</Chip>
                    </div>

                    <p
                      className={cn(
                        'mt-7 inline-flex h-[67px] items-center gap-3 rounded-2xl px-4 text-xl font-bold',
                        delivery.done ? 'bg-[#cbf1d4] text-[#34c759]' : 'bg-[#e3f2ff] text-[#0088ff]',
                      )}
                    >
                      {delivery.done ? <CheckSquareIcon size={26} /> : <ClockIcon size={26} />}
                      {delivery.label}
                    </p>

                    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 px-1">
                      <p className="text-[31px] font-bold text-ink-900 tabular-nums">
                        {formatUSD(invoice.total)}
                      </p>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-[63px]! text-xl!"
                        onClick={() => setSelected(invoice)}
                      >
                        <ReceiptIcon size={28} />
                        Ver recibo
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          {total > INVOICES_PAGE_SIZE && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>
                {page * INVOICES_PAGE_SIZE + 1}–{Math.min(total, (page + 1) * INVOICES_PAGE_SIZE)} de {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 0 || query.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={(page + 1) * INVOICES_PAGE_SIZE >= total || query.isFetching}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <InvoiceDetailModal key={selected?.id ?? 'none'} invoice={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
