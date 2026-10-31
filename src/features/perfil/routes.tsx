import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const perfilRoutes: RouteObject[] = [
  {
    path: 'perfil',
    element: <RequireAccess section="perfil" />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/PerfilPage')).PerfilPage }) },
    ],
  },
];
