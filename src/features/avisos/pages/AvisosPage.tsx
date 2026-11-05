import { useState } from 'react';
import { Link } from 'react-router';
import {
  Button,
  buttonClass,
  Card,
  cn,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  useToast,
} from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { toUserMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { useMarkAllAsRead, useMarkAsRead, useNotifications } from '../hooks/useNotifications';
import { NOTIFICATIONS_PAGE_SIZE } from '../services/notificationsService';

/** RF-54 a RF-57: centro de avisos, en tiempo real, con historial y marcado como leído. */
export function AvisosPage() {
  const user = useRequiredCurrentUser();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const query = useNotifications(user.id, page, onlyUnread);
  const markOne = useMarkAsRead(user.id);
  const markAll = useMarkAllAsRead(user.id);
  const total = query.data?.total ?? 0;

  function read(id: string) {
    markOne.mutate(id, { onError: (error) => toast.error(toUserMessage(error)) });
  }

  return (
    <>
      <PageHeader
        title="Avisos"
        description="Novedades de tus paquetes, recibos y pedidos."
        actions={
          <Button
            variant="outline"
            loading={markAll.isPending}
            onClick={() =>
              markAll.mutate(undefined, { onError: (error) => toast.error(toUserMessage(error)) })
            }
          >
            Marcar todos como leídos
          </Button>
        }
      />
      <div className="mb-4 flex gap-2" role="group" aria-label="Filtrar avisos">
        {[
          { label: 'Todos', value: false },
          { label: 'No leídos', value: true },
        ].map((option) => (
          <Button
            key={option.label}
            size="sm"
            variant={onlyUnread === option.value ? 'secondary' : 'outline'}
            aria-pressed={onlyUnread === option.value}
            onClick={() => {
              setOnlyUnread(option.value);
              setPage(0);
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {query.isPending ? (
        <LoadingState message="Cargando avisos…" />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title={onlyUnread ? 'No tienes avisos sin leer' : 'Todavía no tienes avisos'}
          description="Aquí verás las novedades de tus paquetes, recibos y pedidos."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {query.data.items.map((item) => (
              <li key={item.id}>
                <Card className={cn('sm:p-5', !item.read_at && 'border-brand-200 bg-brand-50/40')}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-2 font-semibold text-ink-900">
                        {!item.read_at && (
                          <span className="size-2 shrink-0 rounded-full bg-brand-500" aria-label="Sin leer" />
                        )}
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm break-words text-slate-600">{item.body}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {item.link && (
                        <Link
                          to={item.link}
                          className={buttonClass({ variant: 'outline', size: 'sm' })}
                          onClick={() => {
                            if (!item.read_at) read(item.id);
                          }}
                        >
                          Ver
                        </Link>
                      )}
                      {!item.read_at && (
                        <Button variant="ghost" size="sm" onClick={() => read(item.id)}>
                          Marcar como leído
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 py-5 text-sm text-slate-600">
            <span>
              {page * NOTIFICATIONS_PAGE_SIZE + 1}–{Math.min(total, (page + 1) * NOTIFICATIONS_PAGE_SIZE)} de{' '}
              {total}
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
                disabled={(page + 1) * NOTIFICATIONS_PAGE_SIZE >= total}
                onClick={() => setPage((value) => value + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
