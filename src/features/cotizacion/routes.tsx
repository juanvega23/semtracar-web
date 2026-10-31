import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const cotizacionRoutes: RouteObject[] = [
  {
    path: 'cotizar',
    element: <RequireAccess section="cotizacion" />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/CotizacionPage')).CotizacionPage }),
      },
    ],
  },
];
