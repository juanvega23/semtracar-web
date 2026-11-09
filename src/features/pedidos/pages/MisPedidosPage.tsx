import { SectionTitle, TruckFastIcon } from '@/components/ui';
import { DeliveryRequest } from '../components/DeliveryRequest';
import { OrdersList } from '../components/OrdersList';

export function MisPedidosPage() {
  return (
    <div className="space-y-5">
      <section className="flex items-center gap-5 rounded-xl border border-[#fcefeb] bg-[#fef9f8] p-5 shadow-[0_2px_6px_rgba(229,79,29,0.15)] lg:gap-8 lg:px-12 lg:py-7">
        <span
          aria-hidden="true"
          className="hidden size-[96px] shrink-0 items-center justify-center rounded-full bg-[#ffe3d6] text-brand-600 sm:flex"
        >
          <TruckFastIcon size={52} />
        </span>
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-bold text-ink-900 lg:text-[34px]">
            Recibe tus paquetes en casa
          </h1>
          <p className="mt-1 text-lg font-medium text-[#6b6b7b]">
            Elige los recibos listos para recoger y un repartidor los lleva a tu dirección.
          </p>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,560fr)_minmax(0,800fr)]">
        <DeliveryRequest />
        <section className="space-y-5">
          <SectionTitle>Mis pedidos</SectionTitle>
          <OrdersList />
        </section>
      </div>
    </div>
  );
}
