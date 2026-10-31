import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const seguimientoRoutes: RouteObject[] = [
  {
    path: 'rastreo',
    element: <RequireAccess section="seguimiento" />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/SeguimientoPage')).SeguimientoPage }),
      },
    ],
  },
];
