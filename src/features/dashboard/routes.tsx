import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'admin/dashboard',
    element: <RequireAccess section="dashboard" />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/DashboardPage')).DashboardPage }),
      },
    ],
  },
];
