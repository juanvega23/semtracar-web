import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const paquetesRoutes: RouteObject[] = [
  {
    path: 'admin/paquetes',
    element: <RequireAccess section="paquetes" />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/PaquetesPage')).PaquetesPage }) },
    ],
  },
];
