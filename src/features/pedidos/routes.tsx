import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const pedidosRoutes: RouteObject[] = [
  {
    path: 'delivery',
    element: <RequireAccess section="misPedidos" />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/MisPedidosPage')).MisPedidosPage }),
      },
    ],
  },
  {
    path: 'admin/pedidos',
    element: <RequireAccess section="pedidos" />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/PedidosAdminPage')).PedidosAdminPage }),
      },
    ],
  },
];
