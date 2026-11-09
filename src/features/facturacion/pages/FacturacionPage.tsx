import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  CheckIcon,
  ClockIcon,
  cn,
  EmptyState,
  ErrorState,
  LoadingState,
  ReceiptIcon,
  SoftStat,
  TextField,
  type BadgeTone,
} from '@/components/ui';
import { currentMonth, fetchDashboard } from '@/features/dashboard';
import { downloadCsv } from '@/lib/csv';
import { formatDate, formatInvoiceNumber, formatUSD } from '@/lib/format';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { useInvoices } from '../hooks/useInvoices';
import {
  INVOICES_PAGE_SIZE,
  INVOICE_FILTERS,
  type Invoice,
  type InvoiceFilter,
} from '../services/invoicesService';

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pendiente: { label: 'Pendiente', tone: 'info' },
  parcial: { label: 'Parcial', tone: 'warning' },
  pagada: { label: 'Pagada', tone: 'success' },
  anulada: { label: 'Anulada', tone: 'danger' },
};

export function FacturacionPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<InvoiceFilter>('todos');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const query = useInvoices(page, filter, status);
  const month = currentMonth();
  const totals = useQuery({ queryKey: ['dashboard', month], queryFn: () => fetchDashboard(month) });
  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  function exportCurrentPage() {
    downloadCsv(
      `semtracar-recibos-pagina-${page + 1}.csv`,
      ['Recibo', 'Fecha', 'Subtotal (USD)', 'Impuesto (USD)', 'Total (USD)', 'Estado'],
      rows.map((invoice) => [
        formatInvoiceNumber(invoice.invoice_number),
        formatDate(invoice.created_at),
        Number(invoice.subtotal).toFixed(2),
        Number(invoice.tax_amount).toFixed(2),
        Number(invoice.total).toFixed(2),
        invoice.status,
      ]),
    );
  }

  function searchInvoices(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilter(search.trim());
    setPage(0);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="sr-only">Recibos</h1>
      <div className="grid grid-cols-2 gap-4 sm:gap-10">
        <SoftStat
          tone="green"
          icon={<CheckIcon size={24} />}
          label="Cobrado este mes"
          value={totals.data ? formatUSD(totals.data.income) : '—'}
        />
        <SoftStat
          tone="blue"
          icon={<ClockIcon size={24} />}
          label="Por cobrar"
          value={totals.data ? formatUSD(totals.data.pending_balance) : '—'}
        />
      </div>

      <div className="flex flex-wrap justify-between gap-2" role="group" aria-label="Filtrar recibos">
        {INVOICE_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={status === option.value}
            onClick={() => {
              setStatus(option.value);
              setPage(0);
            }}
            className={cn(
              'h-10 rounded-full border-2 border-ink-900 px-6 text-sm font-bold transition-colors',
              status === option.value ? 'bg-ink-900 text-white' : 'bg-white text-ink-900 hover:bg-ink-50',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={searchInvoices} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextField
            label="Número de recibo"
            placeholder="REC-00001"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button type="submit">Buscar</Button>
        <Button
          variant="outline"
          disabled={query.isFetching || query.isError || rows.length === 0}
          onClick={exportCurrentPage}
        >
          Exportar página visible (CSV)
        </Button>
      </form>

      {query.isPending ? (
        <LoadingState message="Cargando recibos…" />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No se encontraron recibos"
          description="Revisa el número buscado o prueba con otro filtro."
        />
      ) : (
        <>
          <ul className="space-y-3" aria-busy={query.isFetching}>
            {rows.map((invoice) => {
              const state = STATUS[invoice.status] ?? { label: invoice.status, tone: 'neutral' as const };
              return (
                <li key={invoice.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(invoice)}
                    className="flex w-full items-center gap-4 rounded-lg bg-white p-3 text-left shadow-[0_2px_8px_rgba(33,40,75,0.18)] hover:bg-ink-50 sm:px-4"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#c4bcf5] text-ink-900"
                    >
                      <ReceiptIcon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink-900">
                        {formatInvoiceNumber(invoice.invoice_number)}
                      </span>
                      <span className="block text-sm text-slate-500">
                        {invoice.package_count} paquete(s) - {formatUSD(invoice.total)}
                      </span>
                    </span>
                    <Badge tone={state.tone}>{state.label}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
            <span>
              {page * INVOICES_PAGE_SIZE + 1}–{Math.min(total, (page + 1) * INVOICES_PAGE_SIZE)} de {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((value) => value - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * INVOICES_PAGE_SIZE >= total}
                onClick={() => setPage((value) => value + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
      <InvoiceDetailModal key={selected?.id ?? 'none'} invoice={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
