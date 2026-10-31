import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const retiroRoutes: RouteObject[] = [
  {
    path: 'admin/retiro',
    element: <RequireAccess section="retiro" />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/RetiroPage')).RetiroPage }) },
    ],
  },
];
