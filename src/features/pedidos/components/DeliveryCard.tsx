import { Badge, Card } from '@/components/ui';
import { formatDateTime, formatInvoiceNumber, formatUSD } from '@/lib/format';
import { DELIVERY_STATUSES, type Delivery, type DeliveryStatus } from '../services/deliveriesService';

export function DeliveryCard({ delivery, admin = false }: { delivery: Delivery; admin?: boolean }) {
  const steps = [
    ['Solicitado', delivery.created_at],
    ['Aceptado', delivery.accepted_at],
    ['En camino', delivery.on_the_way_at],
    ['Entregado', delivery.delivered_at],
  ] as const;
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono font-semibold">{formatInvoiceNumber(delivery.invoice?.invoice_number)}</h3>
        <Badge
          tone={
            delivery.status === 'entregado' ? 'success' : delivery.status === 'cancelado' ? 'warning' : 'info'
          }
        >
          {DELIVERY_STATUSES[delivery.status as DeliveryStatus] ?? 'Estado pendiente de confirmar'}
        </Badge>
      </div>
      <p className="text-sm break-words">
        Paquetes: {delivery.package_tracking || delivery.package?.tracking_code || 'Consultar en el recibo'} (
        {delivery.package_count ?? 1})
      </p>
      {admin && (
        <p className="text-sm">
          Cliente:{' '}
          {delivery.client
            ? `${delivery.client.name} ${delivery.client.last_name} · ${delivery.client.casillero}`
            : delivery.client_name || 'Sin datos de cliente'}
        </p>
      )}
      <p className="text-sm">Dirección: {delivery.delivery_address}</p>
      {admin && (
        <p className="text-sm">
          Teléfono: {delivery.client_phone || delivery.client?.phone || 'Sin teléfono registrado'}
        </p>
      )}
      <p className="text-sm">Repartidor: {delivery.deliverer_name || 'Por asignar'}</p>
      {delivery.invoice && (
        <p className="text-sm font-semibold">Total del recibo: {formatUSD(delivery.invoice.total)}</p>
      )}
      <ol aria-label="Progreso del pedido" className="space-y-2 text-sm">
        {steps.map(([label, date]) => (
          <li key={label} className="flex flex-wrap justify-between gap-2">
            <span className={date ? 'font-medium text-ink-900' : 'text-slate-400'}>{label}</span>
            <span className="text-slate-500">{date ? formatDateTime(date) : 'Pendiente'}</span>
          </li>
        ))}
      </ol>
      {delivery.status === 'cancelado' && (
        <p className="text-sm text-amber-700">Este pedido fue cancelado.</p>
      )}
    </Card>
  );
}
