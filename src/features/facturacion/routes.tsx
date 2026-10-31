import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const facturacionRoutes: RouteObject[] = [
  {
    path: 'admin/facturacion',
    element: <RequireAccess section="facturacion" />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/FacturacionPage')).FacturacionPage }),
      },
    ],
  },
];
