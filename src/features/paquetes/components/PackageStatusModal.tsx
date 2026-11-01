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
import { formatDateTime } from '@/lib/format';
import type { PackageRow } from '../services/packagesService';
import {
  useAddPackageStatus,
  useMarkPackageReady,
  usePackageHistory,
  useStatusCatalog,
} from '../hooks/usePackageStatuses';
import type { StatusRole } from '../services/packageStatusService';

type Props = { selected: PackageRow | null; role: StatusRole; onClose: () => void };

export function PackageStatusModal({ selected, role, onClose }: Props) {
  const [nextStatus, setNextStatus] = useState('');
  const [location, setLocation] = useState('');
  const toast = useToast();
  const history = usePackageHistory(selected?.id ?? null);
  const catalog = useStatusCatalog();
  const mutation = useAddPackageStatus();
  const readyMutation = useMarkPackageReady();
  const busy = mutation.isPending || readyMutation.isPending;
  const records = history.data ?? [];
  const last = records.at(-1);
  const names = new Map(catalog.data?.map((item) => [item.id, item.name]) ?? []);
  const available = last
    ? (catalog.data ?? []).filter(
        (status) => status.id === last.status_id + 1 && status.id <= (role === 'almacen' ? 2 : 4),
      )
    : [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !nextStatus) return;
    try {
      if (Number(nextStatus) === 4) {
        const invoiceId = await readyMutation.mutateAsync({ packageId: selected.id, location });
        toast.success(`Paquete listo para recoger. Recibo generado (${invoiceId.slice(0, 8)}…).`);
      } else {
        await mutation.mutateAsync({ packageId: selected.id, statusId: Number(nextStatus), location, role });
        toast.success('Estado actualizado correctamente.');
      }
      setNextStatus('');
      setLocation('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el estado.');
    }
  }

  return (
    <Modal
      open={Boolean(selected)}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={`Historial de ${selected?.tracking_code ?? 'paquete'}`}
      className="max-w-2xl"
    >
      {history.isPending || catalog.isPending ? (
        <LoadingState message="Cargando historial…" />
      ) : history.isError || catalog.isError ? (
        <ErrorState
          onRetry={() => {
            void history.refetch();
            void catalog.refetch();
          }}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">Estado actual</span>
            <Badge tone={last ? 'info' : 'warning'}>
              {last ? (names.get(last.status_id) ?? `Estado ${last.status_id}`) : 'Sin estado inicial'}
            </Badge>
          </div>
          {records.length === 0 ? (
            <p role="alert" className="text-sm text-amber-700">
              Este paquete no tiene historial. No se puede avanzar hasta revisar su estado inicial.
            </p>
          ) : (
            <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
              {records.map((entry) => (
                <li key={entry.id} className="space-y-1">
                  <p className="font-medium text-ink-900">
                    {names.get(entry.status_id) ?? `Estado ${entry.status_id}`}
                  </p>
                  <p className="text-sm text-slate-600">{entry.notes || 'Sin ubicación indicada'}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                </li>
              ))}
            </ol>
          )}
          {available.length > 0 ? (
            <form
              onSubmit={(event) => void submit(event)}
              className="space-y-4 border-t border-slate-100 pt-4"
            >
              <h3 className="font-semibold">Registrar siguiente estado</h3>
              <SelectField
                label="Nuevo estado"
                required
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value)}
              >
                <option value="">Seleccionar estado</option>
                {available.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </SelectField>
              {nextStatus === '4' && (
                <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  Al guardar se generará automáticamente el recibo del paquete.
                </p>
              )}
              <TextField
                label="Ubicación del paquete"
                required
                maxLength={200}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ej. Bodega de tránsito"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
                <Button type="submit" loading={busy} disabled={!nextStatus || !location.trim()}>
                  Guardar estado
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-600">
              No hay transiciones disponibles para tu rol o este estado.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
