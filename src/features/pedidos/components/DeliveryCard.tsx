import type { ReactNode } from 'react';
import {
  Card,
  cn,
  MapPinIcon,
  PackageIcon,
  UsersIcon,
  StatusPill,
  TruckFastIcon,
  UserIcon,
} from '@/components/ui';
import { formatDateTime, formatInvoiceNumber, formatUSD } from '@/lib/format';
import { DELIVERY_STATUSES, type Delivery, type DeliveryStatus } from '../services/deliveriesService';

const STATUS_TONE: Record<DeliveryStatus, 'blue' | 'lilac' | 'yellow' | 'green' | 'red'> = {
  disponible: 'blue',
  aceptado: 'lilac',
  en_camino: 'yellow',
  entregado: 'green',
  cancelado: 'red',
};

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f1f1f4] text-[#5b6178]"
      >
        {icon}
      </span>
      <div className="min-w-0 leading-snug">
        <p className="text-sm font-semibold text-[#8e8e93]">{label}</p>
        <p className="font-semibold break-words text-ink-900">{children}</p>
      </div>
    </div>
  );
}

export function DeliveryCard({ delivery, admin = false }: { delivery: Delivery; admin?: boolean }) {
  const status = delivery.status as DeliveryStatus;
  const cancelled = status === 'cancelado';
  const steps = [
    ['Solicitado', delivery.created_at],
    ['Aceptado', delivery.accepted_at],
    ['En camino', delivery.on_the_way_at],
    ['Entregado', delivery.delivered_at],
  ] as const;
  // La etapa sale del estado del pedido: la app móvil no siempre guarda todas las fechas.
  const stage = { disponible: 0, aceptado: 1, en_camino: 2, entregado: 3, cancelado: 0 }[status] ?? -1;

  return (
    <Card className="px-5 py-6">
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#ffe3d6] text-brand-600"
        >
          <TruckFastIcon size={30} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-ink-900">
            {formatInvoiceNumber(delivery.invoice?.invoice_number)}
          </h3>
          <p className="text-sm font-semibold text-[#8e8e93]">
            Solicitado: {formatDateTime(delivery.created_at)}
          </p>
        </div>
        <StatusPill tone={STATUS_TONE[status] ?? 'gray'}>
          {DELIVERY_STATUSES[status] ?? 'Estado pendiente de confirmar'}
        </StatusPill>
      </div>

      <hr className="my-5 border-[#e3e3e8]" />

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoRow icon={<PackageIcon size={18} />} label={`Paquetes (${delivery.package_count ?? 1})`}>
          {delivery.package_tracking || delivery.package?.tracking_code || 'Consultar en el recibo'}
        </InfoRow>
        <InfoRow icon={<UserIcon size={18} />} label="Repartidor">
          {delivery.deliverer_name || 'Por asignar'}
        </InfoRow>
        <InfoRow icon={<MapPinIcon size={18} />} label="Dirección">
          {delivery.delivery_address}
        </InfoRow>
        {admin && (
          <InfoRow icon={<UsersIcon size={18} />} label="Cliente">
            {delivery.client
              ? `${delivery.client.name} ${delivery.client.last_name} · ${delivery.client.casillero}`
              : delivery.client_name || 'Sin datos de cliente'}
            <span className="block text-sm font-medium text-[#6d7588]">
              {delivery.client_phone || delivery.client?.phone || 'Sin teléfono registrado'}
            </span>
          </InfoRow>
        )}
      </div>

      <ol aria-label="Progreso del pedido" className="mt-6 grid grid-cols-4">
        {steps.map(([label, date], index) => {
          const done = index <= stage;
          const current = !cancelled && index === stage;
          return (
            <li key={label} className="relative flex flex-col items-center text-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-[9px] right-1/2 left-[-50%] h-1 rounded-full',
                    done ? 'bg-brand-600' : 'bg-[#e3e3e8]',
                  )}
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  'relative size-[22px] rounded-full border-4',
                  current
                    ? 'border-brand-600 bg-brand-600 ring-4 ring-brand-100'
                    : done
                      ? 'border-brand-600 bg-white'
                      : 'border-[#e3e3e8] bg-white',
                )}
              />
              <span
                className={cn('mt-2 text-xs font-bold sm:text-sm', done ? 'text-ink-900' : 'text-[#b0b5c3]')}
              >
                {label}
              </span>
              <span className="mt-0.5 hidden text-xs text-[#8e8e93] sm:block">
                {date ? formatDateTime(date) : done ? '—' : cancelled ? '' : 'Pendiente'}
              </span>
            </li>
          );
        })}
      </ol>

      {cancelled && (
        <p className="mt-4 rounded-lg bg-[#ffe8e8] px-3 py-2 text-sm font-semibold text-[#e0262a]">
          Este pedido fue cancelado.
        </p>
      )}

      {delivery.invoice && (
        <div className="mt-5 flex items-center justify-between border-t border-[#e3e3e8] pt-4">
          <span className="font-semibold text-[#8e8e93]">Total del recibo</span>
          <span className="text-2xl font-bold text-ink-900 tabular-nums">
            {formatUSD(delivery.invoice.total)}
          </span>
        </div>
      )}
    </Card>
  );
}
