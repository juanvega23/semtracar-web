import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SelectField,
  Table,
  Td,
  TextField,
  Th,
} from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { formatDate, formatUSD } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { PackageStatusModal } from '../components/PackageStatusModal';
import { useLatestStatuses, useStatusCatalog } from '../hooks/usePackageStatuses';
import type { PackageFilters, PackageRow } from '../services/packagesService';
import { RegisterPackageModal } from '../components/RegisterPackageModal';
import { useClientSearch, usePackages } from '../hooks/usePackages';
import { PAGE_SIZE } from '../services/packagesService';

/** Listado e historial (T2). El filtrado visual no sustituye RLS para RF-67. */
export function PaquetesPage() {
  const current = useRequiredCurrentUser();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PackageRow | null>(null);
  const [search, setSearch] = useState('');
  const [clientTerm, setClientTerm] = useState('');
  const [clientId, setClientId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [filters, setFilters] = useState<PackageFilters>({
    search: '',
    clientId: '',
    statusId: null,
  });
  const clients = useClientSearch(clientTerm);
  const [page, setPage] = useState(0);
  const query = usePackages(filters, page);
  const count = query.data?.total ?? 0;
  const statusCatalog = useStatusCatalog();
  const packageIds = query.data?.items.map((item) => item.id) ?? [];
  const statuses = useLatestStatuses(packageIds);
  const statusNames = new Map(statusCatalog.data?.map((item) => [item.id, item.name]) ?? []);
  const items = (query.data?.items ?? []).filter(
    (item) =>
      current.role !== 'almacen' ||
      Boolean(statuses.data?.[item.id] && statuses.data[item.id].status_id <= 2),
  );
  function exportCurrentPage() {
    downloadCsv(
      `semtracar-paquetes-pagina-${page + 1}.csv`,
      ['Código de rastreo', 'Fecha', 'Peso (lb)', 'Precio (USD)', 'Estado'],
      items.map((item) => [
        item.tracking_code,
        formatDate(item.created_at),
        item.weight,
        Number(item.price).toFixed(2),
        statuses.data?.[item.id]
          ? (statusNames.get(statuses.data[item.id].status_id) ?? 'Desconocido')
          : 'Sin estado',
      ]),
    );
  }

  return (
    <>
      <PageHeader
        title="Paquetes"
        description="Consulta los paquetes registrados y sus códigos de rastreo."
        actions={
          current.role === 'almacen' ? (
            <Button onClick={() => setOpen(true)}>Registrar paquete</Button>
          ) : undefined
        }
      />
      {(statuses.isFetching || statusCatalog.isFetching) && (
        <p className="mb-2 text-xs text-slate-500">Actualizando estados…</p>
      )}
      <div className="mb-3 flex justify-end">
        <Button
          variant="outline"
          disabled={
            query.isFetching ||
            statuses.isFetching ||
            statusCatalog.isFetching ||
            query.isError ||
            statuses.isError ||
            statusCatalog.isError ||
            items.length === 0
          }
          onClick={exportCurrentPage}
        >
          Exportar página visible (CSV)
        </Button>
      </div>
      <Card className="p-0 sm:p-0">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFilters({
              search: search.trim(),
              clientId,
              statusId: statusId ? Number(statusId) : null,
            });
            setPage(0);
          }}
          className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <TextField
            label="Código de rastreo"
            type="search"
            placeholder="Buscar por código"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="space-y-2">
            <TextField
              label="Buscar cliente"
              type="search"
              placeholder="Nombre, correo o casillero"
              value={clientTerm}
              onChange={(event) => {
                setClientTerm(event.target.value);
                setClientId('');
              }}
            />
            <SelectField
              label="Cliente"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              disabled={clientTerm.trim().length < 2 || clients.isFetching}
            >
              <option value="">Todos los clientes</option>
              {clients.data?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.last_name} — {client.casillero}
                </option>
              ))}
            </SelectField>
            {clients.isError && (
              <p role="alert" className="text-sm text-red-600">
                No se pudo buscar clientes.
              </p>
            )}
          </div>
          <SelectField
            label="Estado actual"
            value={statusId}
            onChange={(event) => setStatusId(event.target.value)}
          >
            <option value="">Todos los estados</option>
            {statusCatalog.data?.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </SelectField>
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={clients.isError}>
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch('');
                setClientTerm('');
                setClientId('');
                setStatusId('');
                setFilters({ search: '', clientId: '', statusId: null });
                setPage(0);
              }}
            >
              Limpiar
            </Button>
          </div>
        </form>
        {query.isPending || statuses.isLoading || statusCatalog.isPending ? (
          <LoadingState message="Cargando paquetes y estados…" />
        ) : query.isError || statuses.isError || statusCatalog.isError ? (
          <ErrorState
            onRetry={() => {
              void query.refetch();
              void statuses.refetch();
              void statusCatalog.refetch();
            }}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No se encontraron paquetes"
            description="Revisa los filtros o utiliza otra búsqueda."
          />
        ) : (
          <>
            <div className="px-5 sm:px-0">
              <Table aria-busy={query.isFetching}>
                <thead>
                  <tr>
                    <Th>Código</Th>
                    <Th>Fecha</Th>
                    <Th>Peso</Th>
                    <Th>Precio</Th>
                    <Th>Pago</Th>
                    <Th>Estado</Th>
                    <Th>Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <Td className="font-mono font-medium">{item.tracking_code}</Td>
                      <Td>{formatDate(item.created_at)}</Td>
                      <Td>{item.weight} lb</Td>
                      <Td>{formatUSD(item.price)}</Td>
                      <Td>{current.role === 'almacen' ? '—' : item.is_paid ? 'Pagado' : 'Pendiente'}</Td>
                      <Td>
                        <Badge tone={statuses.data?.[item.id] ? 'info' : 'warning'}>
                          {statuses.data?.[item.id]
                            ? (statusNames.get(statuses.data[item.id].status_id) ?? 'Desconocido')
                            : 'Sin estado'}
                        </Badge>
                      </Td>
                      <Td>
                        <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
                          Ver historial
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-3 p-5 text-sm text-slate-600">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min(count, (page + 1) * PAGE_SIZE)} de {count}
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
                  disabled={(page + 1) * PAGE_SIZE >= count}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
      {current.role === 'almacen' && <RegisterPackageModal open={open} onClose={() => setOpen(false)} />}
      {(current.role === 'almacen' || current.role === 'admin') && (
        <PackageStatusModal
          key={selected?.id ?? 'no-package'}
          selected={selected}
          role={current.role}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
