import { useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  TextField,
} from '@/components/ui';
import { PAGE_SIZE, type PackageRow } from '@/features/paquetes';
import { formatDateTime, formatUSD } from '@/lib/format';
import { useTracking, useTrackingCatalog, useTrackingHistory } from '../hooks/useTracking';
import { PackageTimeline } from '../components/PackageTimeline';

export function SeguimientoPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<PackageRow | null>(null);
  const query = useTracking(page, filter);
  const catalog = useTrackingCatalog();
  const history = useTrackingHistory(selected?.id ?? null);
  const total = query.data?.total ?? 0;
  function submit(event: FormEvent) {
    event.preventDefault();
    setFilter(search.trim());
    setPage(0);
  }
  return (
    <>
      <PageHeader
        title="Rastreo de paquetes"
        description="Consulta el recorrido y el estado de pago de tus paquetes."
      />
      <Card className="mb-5">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label="Código de rastreo"
              type="search"
              value={search}
              maxLength={80}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar entre mis paquetes"
            />
          </div>
          <Button type="submit">Buscar</Button>
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            Actualizar
          </Button>
        </form>
      </Card>
      {query.isPending || catalog.isPending ? (
        <LoadingState message="Cargando tus paquetes…" />
      ) : query.isError || catalog.isError ? (
        <ErrorState
          onRetry={() => {
            void query.refetch();
            void catalog.refetch();
          }}
        />
      ) : !query.data.items.length ? (
        <EmptyState
          title="No se encontraron paquetes"
          description={
            filter ? 'Revisa el código de rastreo.' : 'Tus paquetes aparecerán cuando almacén los registre.'
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {query.data.items.map((item) => (
              <Card key={item.id} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-mono font-semibold break-all">{item.tracking_code}</h2>
                  <Badge tone={item.is_paid ? 'success' : 'warning'}>
                    {item.is_paid ? 'Pagado' : 'Pendiente de pago'}
                  </Badge>
                </div>
                <p className="font-semibold text-brand-600">
                  {catalog.data.find((status) => status.id === query.data.latest[item.id]?.status_id)?.name ??
                    'Sin estado registrado'}
                </p>
                <p className="text-sm text-slate-500">Registrado: {formatDateTime(item.created_at)}</p>
                <div className="flex justify-between text-sm">
                  <span>{Number(item.weight)} lb</span>
                  <span>{formatUSD(item.price)}</span>
                </div>
                <Button variant="outline" onClick={() => setSelected(item)}>
                  Ver recorrido
                </Button>
              </Card>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              {page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} de {total}
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
                disabled={(page + 1) * PAGE_SIZE >= total || query.isFetching}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Recorrido · ${selected?.tracking_code ?? ''}`}
      >
        {history.isPending ? (
          <LoadingState message="Cargando recorrido…" />
        ) : history.isError ? (
          <ErrorState onRetry={() => void history.refetch()} />
        ) : (
          <PackageTimeline history={history.data} catalog={catalog.data ?? []} />
        )}
      </Modal>
    </>
  );
}
