import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const avisosRoutes: RouteObject[] = [
  {
    path: 'avisos',
    element: <RequireAccess section="avisos" />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/AvisosPage')).AvisosPage }) },
    ],
  },
];
