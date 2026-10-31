import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const recibosRoutes: RouteObject[] = [
  {
    path: 'historial',
    element: <RequireAccess section="recibos" />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/RecibosPage')).RecibosPage }) },
    ],
  },
];
