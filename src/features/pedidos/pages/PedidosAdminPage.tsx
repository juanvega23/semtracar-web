import { PageHeader } from '@/components/ui';
import { OrdersList } from '../components/OrdersList';

export function PedidosAdminPage() {
  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Consulta las entregas, sus repartidores y el estado de cada pedido."
      />
      <OrdersList admin />
    </>
  );
}
