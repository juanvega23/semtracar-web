import { EmptyState } from '@/components/ui';
import type { StatusCatalog, StatusHistory } from '@/features/paquetes';
import { formatDateTime } from '@/lib/format';

export function PackageTimeline({
  history,
  catalog,
}: {
  history: StatusHistory[];
  catalog: StatusCatalog[];
}) {
  if (!history.length)
    return (
      <EmptyState
        title="Sin movimientos registrados"
        description="El historial aparecerá cuando almacén registre el primer estado."
      />
    );
  return (
    <ol aria-label="Historial del paquete" className="space-y-5 border-l-2 border-brand-200 pl-5">
      {history.map((entry, index) => (
        <li key={entry.id} className="relative space-y-1">
          <span
            aria-hidden="true"
            className={`absolute top-1 -left-[1.7rem] size-3 rounded-full ${index === history.length - 1 ? 'bg-brand-500' : 'bg-slate-300'}`}
          />
          <h3 className="font-semibold">
            {catalog.find((status) => status.id === entry.status_id)?.name ?? 'Estado registrado'}
          </h3>
          <p className="text-sm text-slate-500">{formatDateTime(entry.created_at)}</p>
          {entry.notes && <p className="text-sm text-slate-700">{entry.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
