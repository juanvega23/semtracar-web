import { PageHeader } from '@/components/ui';
import { DeliveryRequest } from '../components/DeliveryRequest';
import { OrdersList } from '../components/OrdersList';

export function MisPedidosPage() {
  return (
    <>
      <PageHeader title="Delivery" description="Solicita la entrega a domicilio y sigue tus pedidos." />
      <div className="space-y-8">
        <DeliveryRequest />
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Mis pedidos</h2>
          <OrdersList />
        </section>
      </div>
    </>
  );
}
