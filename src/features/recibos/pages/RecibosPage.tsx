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
import { INVOICES_PAGE_SIZE, InvoiceDetailModal, type Invoice } from '@/features/facturacion';
import { formatDate, formatInvoiceNumber, formatUSD } from '@/lib/format';
import { useMyInvoices } from '../hooks/useMyInvoices';

export function RecibosPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const query = useMyInvoices(page, filter);
  const total = query.data?.total ?? 0;
  function submit(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setFilter(search.trim());
  }
  return (
    <>
      <PageHeader
        title="Historial de recibos"
        description="Consulta tus recibos, pagos y saldos. Descarga tu PDF y QR para el retiro."
      />
      <Card>
        <form onSubmit={submit} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label="Número de recibo"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="REC-00001"
            />
          </div>
          <Button type="submit">Buscar</Button>
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            Actualizar
          </Button>
        </form>
        {query.isPending ? (
          <LoadingState message="Cargando tus recibos…" />
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : !query.data.items.length ? (
          <EmptyState
            title="No se encontraron recibos"
            description={
              filter
                ? 'Revisa el número de recibo.'
                : 'Tus recibos aparecerán cuando los paquetes estén listos para recoger.'
            }
          />
        ) : (
          <>
            <Table>
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
                {query.data.items.map((invoice) => (
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
                      <Button size="sm" variant="outline" onClick={() => setSelected(invoice)}>
                        Ver recibo, PDF y QR
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
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
          </>
        )}
      </Card>
      <InvoiceDetailModal key={selected?.id ?? 'none'} invoice={selected} onClose={() => setSelected(null)} />
    </>
  );
}
