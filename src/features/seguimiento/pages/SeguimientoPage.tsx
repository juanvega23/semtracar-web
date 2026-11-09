import { useState, type FormEvent, type ReactNode } from 'react';
import boxPlain from '@/assets/box.png';
import boxReady from '@/assets/box-listo.png';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  cn,
  CopyIcon,
  EmptyState,
  ErrorState,
  LoadingState,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  ShipmentTimeline,
  TextField,
  TicketIcon,
  TruckFastIcon,
  useToast,
} from '@/components/ui';
import { PAGE_SIZE, type StatusHistory } from '@/features/paquetes';
import { formatTimelineDate } from '@/lib/format';
import { PackageMap } from '../components/PackageMap';
import { useDeliveryMode, useTracking, useTrackingCatalog, useTrackingHistory } from '../hooks/useTracking';

const HEADLINES: Record<number, string> = {
  1: 'Tu paquete fue recibido',
  2: 'Tu paquete va en camino',
  3: 'Tu paquete está en aduana',
  4: 'Tu paquete está listo para recoger',
};

/** Fila de "Resumen del envío". */
function SummaryRow({
  icon,
  tint,
  label,
  value,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span
        aria-hidden="true"
        className={cn('flex size-[50px] shrink-0 items-center justify-center rounded-full', tint)}
      >
        {icon}
      </span>
      <div className="leading-snug">
        <p className="font-semibold text-[#8e8e93]">{label}</p>
        <p className="text-lg font-bold text-ink-900">{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-2xl font-bold text-[#5b6178] uppercase">{children}</h2>;
}

export function SeguimientoPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const query = useTracking(page, filter);
  const catalog = useTrackingCatalog();
  const items = query.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const history = useTrackingHistory(selected?.id ?? null);
  const hasDelivery = useDeliveryMode(selected?.id ?? null);
  const total = query.data?.total ?? 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    setFilter(search.trim());
    setPage(0);
    setSelectedId(null);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Código copiado.');
    } catch {
      toast.error('No se pudo copiar el código.');
    }
  }

  const records: StatusHistory[] = history.data ?? [];
  const last = records.at(-1);
  const statusId = selected ? (last?.status_id ?? query.data?.latest[selected.id]?.status_id) : undefined;
  const statusName = catalog.data?.find((status) => status.id === statusId)?.name ?? 'Sin estado registrado';
  const position = catalog.data?.findIndex((status) => status.id === statusId) ?? -1;

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Rastreo de paquetes</h1>
      {query.isPending || catalog.isPending ? (
        <LoadingState message="Cargando tus paquetes…" />
      ) : query.isError || catalog.isError ? (
        <ErrorState
          onRetry={() => {
            void query.refetch();
            void catalog.refetch();
          }}
        />
      ) : !selected ? (
        <>
          <SearchCard search={search} setSearch={setSearch} submit={submit} />
          <EmptyState
            title="No se encontraron paquetes"
            description={
              filter ? 'Revisa el código de rastreo.' : 'Tus paquetes aparecerán cuando almacén los registre.'
            }
          />
        </>
      ) : (
        <>
          <section className="flex flex-col gap-4 rounded-xl border border-[#fcefeb] bg-[#fef9f8] p-5 shadow-[0_2px_6px_rgba(229,79,29,0.15)] lg:flex-row lg:items-center lg:gap-16 lg:py-4 lg:pr-4 lg:pl-12">
            <img
              src={statusId === 4 ? boxReady : boxPlain}
              alt=""
              className="hidden h-[140px] w-auto shrink-0 lg:block"
              draggable={false}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-[34px] leading-tight font-bold text-ink-900">
                {(statusId && HEADLINES[statusId]) || statusName}
              </h2>
              <p className="mt-2 inline-flex h-[66px] items-center gap-4 rounded-lg border border-slate-300 bg-white px-5 text-2xl font-bold break-all text-ink-900">
                <TicketIcon size={32} className="shrink-0" />
                {selected.tracking_code}
              </p>
              {last && (
                <p className="mt-1 font-semibold text-[#6b6b7b]">
                  Actualizado: {formatTimelineDate(last.created_at)}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="h-[70px]! rounded-xl! px-5! text-[22px]!"
              onClick={() => setMapOpen(true)}
            >
              <MapPinIcon size={32} />
              Ver ubicación
            </Button>
            {statusId === 4 && !selected.is_paid && (
              <ButtonLink
                to="/delivery"
                className="h-[70px]! rounded-xl! px-5! text-[22px]!"
                icon={<TruckFastIcon size={34} />}
              >
                Solicitar delivery
              </ButtonLink>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,542fr)_minmax(0,1328fr)]">
            <div className="space-y-5">
              <Card className="px-6 py-5">
                <SectionTitle>Código de seguimiento</SectionTitle>
                <div className="flex items-center gap-4 rounded-lg border border-slate-300 px-4 py-3">
                  <TicketIcon size={32} className="shrink-0 text-ink-900" />
                  <span className="min-w-0 flex-1 text-2xl font-bold break-all text-ink-900">
                    {selected.tracking_code}
                  </span>
                  <button
                    type="button"
                    aria-label="Copiar código"
                    onClick={() => void copyCode(selected.tracking_code)}
                    className="shrink-0 text-[#b9b9c3] hover:text-ink-900"
                  >
                    <CopyIcon size={28} />
                  </button>
                </div>
                <p className="mt-4">
                  <Badge tone={selected.is_paid ? 'success' : 'warning'}>
                    {selected.is_paid ? 'Pagado' : 'Pendiente de pago'}
                  </Badge>
                </p>
              </Card>
              <Card className="px-6 py-5">
                <SectionTitle>Resumen del envío</SectionTitle>
                <div className="space-y-3">
                  <SummaryRow
                    icon={<TruckFastIcon size={28} className="text-[#e54f1d]" />}
                    tint="bg-[#ffe3d6]"
                    label="Modalidad"
                    value={hasDelivery.data ? 'Delivery' : 'Retiro en el local'}
                  />
                  <SummaryRow
                    icon={<MapPinIcon size={28} className="text-[#0088ff]" />}
                    tint="bg-[#e3f2ff]"
                    label="Sucursal"
                    value="Managua"
                  />
                  <SummaryRow
                    icon={<ShieldCheckIcon size={28} className="text-[#34c759]" />}
                    tint="bg-[#e0f7e6]"
                    label="Estado actual"
                    value={statusName}
                  />
                </div>
              </Card>
            </div>
            <PackageMap stage={position} open={mapOpen} onOpenChange={setMapOpen} />
          </div>

          <Card className="px-6 py-5">
            <SectionTitle>Seguimiento del envío</SectionTitle>
            {history.isError ? (
              <ErrorState onRetry={() => void history.refetch()} />
            ) : (
              <ShipmentTimeline
                label={`Recorrido de ${selected.tracking_code}`}
                stops={catalog.data.map((status, index) => {
                  const record = records.filter((entry) => entry.status_id === status.id).at(-1);
                  return {
                    id: status.id,
                    name: status.name,
                    reached: position >= 0 && index <= position,
                    current: index === position,
                    children: record ? (
                      <>
                        <p>{formatTimelineDate(record.created_at)}</p>
                        {record.notes && <p className="mt-2 max-w-40 leading-tight">{record.notes}</p>}
                      </>
                    ) : null,
                  };
                })}
              />
            )}
          </Card>

          <Card className="px-6 py-5">
            <SectionTitle>Mis paquetes</SectionTitle>
            <SearchForm search={search} setSearch={setSearch} submit={submit} />
            <ul className="mt-4 space-y-2">
              {items.map((item) => {
                const itemStatus = catalog.data.find(
                  (status) => status.id === query.data.latest[item.id]?.status_id,
                );
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={item.id === selected.id}
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border p-3 text-left shadow-[0_2px_6px_rgba(33,40,75,0.08)]',
                        item.id === selected.id ? 'border-brand-500' : 'border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#c4bcf5] text-ink-900"
                      >
                        <PackageIcon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold break-all text-ink-900">{item.tracking_code}</span>
                        <span className="block text-xs text-slate-500">
                          {itemStatus?.name ?? 'Sin estado registrado'}
                        </span>
                      </span>
                      <Badge tone={item.is_paid ? 'success' : 'info'}>
                        {item.is_paid ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} de {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || query.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * PAGE_SIZE >= total || query.isFetching}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

type SearchProps = { search: string; setSearch: (value: string) => void; submit: (event: FormEvent) => void };

function SearchForm({ search, setSearch, submit }: SearchProps) {
  return (
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
    </form>
  );
}

function SearchCard(props: SearchProps) {
  return (
    <Card>
      <SearchForm {...props} />
    </Card>
  );
}
