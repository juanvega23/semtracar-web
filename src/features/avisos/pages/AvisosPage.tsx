import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  BellIcon,
  Button,
  buttonClass,
  Card,
  CheckCircleIcon,
  CheckIcon,
  CheckSquareIcon,
  cn,
  EmptyState,
  ErrorState,
  FilterPills,
  LoadingState,
  PackageIcon,
  ReceiptIcon,
  TruckFastIcon,
  useToast,
} from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { toUserMessage } from '@/lib/errors';
import { formatTimelineDate } from '@/lib/format';
import { useMarkAllAsRead, useMarkAsRead, useNotifications, useUnreadCount } from '../hooks/useNotifications';
import { NOTIFICATIONS_PAGE_SIZE } from '../services/notificationsService';

/** Ícono y color de cada tipo de aviso que generan los triggers de la base. */
const KINDS: Record<string, { icon: ReactNode; className: string }> = {
  paquete_listo: { icon: <CheckCircleIcon size={24} />, className: 'bg-[#e0f7e6] text-[#1f9d45]' },
  paquete_estado: { icon: <PackageIcon size={24} />, className: 'bg-[#e3f2ff] text-[#0070d6]' },
  recibo_generado: { icon: <ReceiptIcon size={24} />, className: 'bg-[#efeafd] text-[#5b3fd0]' },
  recibo_anulado: { icon: <ReceiptIcon size={24} />, className: 'bg-[#ffe8e8] text-[#e0262a]' },
  pago_registrado: { icon: <CheckSquareIcon size={24} />, className: 'bg-[#e0f7e6] text-[#1f9d45]' },
  pedido_nuevo: { icon: <TruckFastIcon size={24} />, className: 'bg-[#ffe3d6] text-brand-600' },
  pedido_estado: { icon: <TruckFastIcon size={24} />, className: 'bg-[#ffe3d6] text-brand-600' },
  entrega_confirmada: { icon: <CheckCircleIcon size={24} />, className: 'bg-[#e0f7e6] text-[#1f9d45]' },
};
const FALLBACK = { icon: <BellIcon size={24} />, className: 'bg-[#ebebee] text-[#5b6178]' };

/** RF-54 a RF-57: centro de avisos, en tiempo real, con historial y marcado como leído. */
export function AvisosPage() {
  const user = useRequiredCurrentUser();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'todos' | 'no_leidos'>('todos');
  const onlyUnread = filter === 'no_leidos';
  const query = useNotifications(user.id, page, onlyUnread);
  const unread = useUnreadCount(user.id).data ?? 0;
  const markOne = useMarkAsRead(user.id);
  const markAll = useMarkAllAsRead(user.id);
  const total = query.data?.total ?? 0;

  function read(id: string) {
    markOne.mutate(id, { onError: (error) => toast.error(toUserMessage(error)) });
  }

  return (
    <div className="mx-auto max-w-[820px] pt-2 lg:pt-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] leading-tight font-bold text-ink-900">Avisos</h1>
          <p className="text-lg font-medium text-[#8e8e93]">Novedades de tus paquetes, recibos y pedidos.</p>
        </div>
        <Button
          variant="outline"
          loading={markAll.isPending}
          disabled={!unread}
          onClick={() => markAll.mutate(undefined, { onError: (error) => toast.error(toUserMessage(error)) })}
        >
          <CheckSquareIcon size={18} />
          Marcar todos como leídos
        </Button>
      </div>

      <div className="mb-5">
        <FilterPills
          label="Filtrar avisos"
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(0);
          }}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'no_leidos', label: unread ? `No leídos (${unread})` : 'No leídos' },
          ]}
        />
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
            {query.data.items.map((item) => {
              const kind = KINDS[item.type] ?? FALLBACK;
              const isUnread = !item.read_at;
              return (
                <li key={item.id}>
                  <Card
                    className={cn(
                      'flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center',
                      isUnread && 'border-[#f6c9b8] bg-[#fef9f8]',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-full',
                        kind.className,
                      )}
                    >
                      {kind.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                        {isUnread && (
                          <span
                            className="size-2.5 shrink-0 rounded-full bg-brand-600"
                            aria-label="Sin leer"
                          />
                        )}
                        {item.title}
                      </h2>
                      <p className="mt-0.5 break-words text-[#5b6178]">{item.body}</p>
                      <p className="mt-1 text-sm font-semibold text-[#8e8e93]">
                        {formatTimelineDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {item.link && (
                        <Link
                          to={item.link}
                          className={buttonClass({ variant: 'outline', size: 'sm' })}
                          onClick={() => {
                            if (isUnread) read(item.id);
                          }}
                        >
                          Ver
                        </Link>
                      )}
                      {isUnread && (
                        <Button variant="ghost" size="sm" onClick={() => read(item.id)}>
                          <CheckIcon size={16} />
                          Marcar como leído
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          {total > NOTIFICATIONS_PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 py-5 text-sm text-slate-600">
              <span>
                {page * NOTIFICATIONS_PAGE_SIZE + 1}–{Math.min(total, (page + 1) * NOTIFICATIONS_PAGE_SIZE)}{' '}
                de {total}
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
          )}
        </>
      )}
    </div>
  );
}
