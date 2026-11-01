import { useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Table,
  Td,
  TextField,
  Th,
} from '@/components/ui';
import { formatDate, formatInvoiceNumber, formatUSD } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { useInvoices } from '../hooks/useInvoices';
import { INVOICES_PAGE_SIZE, type Invoice } from '../services/invoicesService';

export function FacturacionPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const query = useInvoices(page, filter);
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
    <>
      <PageHeader title="Facturación" description="Consulta recibos, pagos realizados y saldos pendientes." />
      <div className="mb-3 flex justify-end">
        <Button
          variant="outline"
          disabled={query.isFetching || query.isError || rows.length === 0}
          onClick={exportCurrentPage}
        >
          Exportar página visible (CSV)
        </Button>
      </div>
      <Card className="p-0 sm:p-0">
        <form
          onSubmit={searchInvoices}
          className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-end"
        >
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
        </form>
        {query.isPending ? (
          <LoadingState message="Cargando recibos…" />
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No se encontraron recibos"
            description="Revisa el número buscado o prueba otra página."
          />
        ) : (
          <>
            <div className="px-5 sm:px-0">
              <Table aria-busy={query.isFetching}>
                <thead>
                  <tr>
                    <Th>Recibo</Th>
                    <Th>Fecha</Th>
                    <Th>Total</Th>
                    <Th>Estado</Th>
                    <Th>Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((invoice) => (
                    <tr key={invoice.id}>
                      <Td className="font-mono">{formatInvoiceNumber(invoice.invoice_number)}</Td>
                      <Td>{formatDate(invoice.created_at)}</Td>
                      <Td>{formatUSD(invoice.total)}</Td>
                      <Td>
                        <Badge
                          tone={
                            invoice.status === 'pagada'
                              ? 'success'
                              : invoice.status === 'anulada'
                                ? 'warning'
                                : 'info'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Button variant="outline" size="sm" onClick={() => setSelected(invoice)}>
                          Ver detalle
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-3 p-5 text-sm text-slate-600">
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
      </Card>
      <InvoiceDetailModal key={selected?.id ?? 'none'} invoice={selected} onClose={() => setSelected(null)} />
    </>
  );
}
