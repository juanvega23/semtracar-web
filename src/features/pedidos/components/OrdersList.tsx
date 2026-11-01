import { useState } from 'react';
import { Button, EmptyState, ErrorState, LoadingState, Modal, SelectField, useToast } from '@/components/ui';
import { downloadCsv } from '@/lib/csv';
import { toUserMessage } from '@/lib/errors';
import { formatDateTime, formatInvoiceNumber } from '@/lib/format';
import { useCancelDelivery, useDeliveries } from '../hooks/useDeliveries';
import {
  DELIVERY_STATUSES,
  DeliveryValidationError,
  ORDERS_PAGE_SIZE,
  type Delivery,
  type DeliveryStatus,
} from '../services/deliveriesService';
import { DeliveryCard } from './DeliveryCard';

export function OrdersList({ admin = false }: { admin?: boolean }) {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Delivery | null>(null);
  const query = useDeliveries(page, status, !admin);
  const cancel = useCancelDelivery();
  const toast = useToast();
  const total = query.data?.total ?? 0;
  function exportPage() {
    downloadCsv(
      `semtracar-pedidos-pagina-${page + 1}.csv`,
      [
        'Pedido',
        'Recibo',
        'Cliente',
        'Casillero',
        'Paquetes',
        'Repartidor',
        'Estado',
        'Dirección',
        'Teléfono',
        'Solicitado',
        'Aceptado',
        'En camino',
        'Entregado',
      ],
      (query.data?.items ?? []).map((delivery) => [
        delivery.id,
        formatInvoiceNumber(delivery.invoice?.invoice_number),
        delivery.client
          ? `${delivery.client.name} ${delivery.client.last_name}`
          : (delivery.client_name ?? ''),
        delivery.client?.casillero ?? '',
        delivery.package_tracking || delivery.package?.tracking_code || '',
        delivery.deliverer_name ?? '',
        DELIVERY_STATUSES[delivery.status as DeliveryStatus] ?? delivery.status,
        delivery.delivery_address,
        delivery.client_phone || delivery.client?.phone || '',
        formatDateTime(delivery.created_at),
        delivery.accepted_at ? formatDateTime(delivery.accepted_at) : '',
        delivery.on_the_way_at ? formatDateTime(delivery.on_the_way_at) : '',
        delivery.delivered_at ? formatDateTime(delivery.delivered_at) : '',
      ]),
    );
  }
  async function cancelSelected() {
    if (!selected || cancel.isPending) return;
    try {
      await cancel.mutateAsync(selected.id);
      setSelected(null);
      toast.success('Pedido cancelado.');
    } catch (error) {
      toast.error(
        toUserMessage(
          error,
          error instanceof DeliveryValidationError ? error.message : 'No se pudo cancelar el pedido.',
        ),
      );
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-52">
          <SelectField
            label="Estado del pedido"
            value={status}
            disabled={cancel.isPending}
            onChange={(event) => {
              setPage(0);
              setStatus(event.target.value);
            }}
          >
            <option value="">Todos los estados</option>
            {Object.entries(DELIVERY_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            Actualizar
          </Button>
          {admin && (
            <Button
              variant="outline"
              disabled={query.isFetching || query.isError || !query.data?.items.length}
              onClick={exportPage}
            >
              Exportar página visible (CSV)
            </Button>
          )}
        </div>
      </div>
      {query.isPending ? (
        <LoadingState message="Cargando pedidos…" />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !query.data.items.length ? (
        <EmptyState
          title="No se encontraron pedidos"
          description={
            status
              ? 'Prueba con otro estado.'
              : 'Los pedidos aparecerán al solicitar una entrega a domicilio.'
          }
        />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {query.data.items.map((delivery) => (
              <div key={delivery.id} className="space-y-2">
                <DeliveryCard delivery={delivery} admin={admin} />
                {admin && ['disponible', 'aceptado', 'en_camino'].includes(delivery.status) && (
                  <Button variant="outline" disabled={cancel.isPending} onClick={() => setSelected(delivery)}>
                    Cancelar pedido de {formatInvoiceNumber(delivery.invoice?.invoice_number)}
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              {page * ORDERS_PAGE_SIZE + 1}–{Math.min(total, (page + 1) * ORDERS_PAGE_SIZE)} de {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 0 || query.isFetching || cancel.isPending}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={(page + 1) * ORDERS_PAGE_SIZE >= total || query.isFetching || cancel.isPending}
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
        onClose={() => {
          if (!cancel.isPending) setSelected(null);
        }}
        title="Cancelar pedido"
      >
        <div className="space-y-4">
          <p>
            ¿Confirmas la cancelación del pedido de {formatInvoiceNumber(selected?.invoice?.invoice_number)}?
          </p>
          {selected?.invoice?.payments.length ? (
            <p role="alert" className="text-sm text-amber-800">
              Este recibo tiene pagos. La cancelación requiere revisión administrativa y no puede hacerse
              automáticamente.
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              Se cancelará el pedido y se quitará el cargo de delivery del recibo. Si se registra un pago
              antes de confirmar, la cancelación se bloqueará para revisión administrativa.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={cancel.isPending} onClick={() => setSelected(null)}>
              Volver
            </Button>
            <Button
              loading={cancel.isPending}
              disabled={!selected?.invoice || Boolean(selected.invoice.payments.length)}
              onClick={() => void cancelSelected()}
            >
              Confirmar cancelación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
