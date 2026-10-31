import type { RouteObject } from 'react-router';
import { RequireAccess } from '@/features/acceso';

export const usuariosRoutes: RouteObject[] = [
  {
    path: 'admin/usuarios',
    element: <RequireAccess section="usuarios" />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/UsuariosPage')).UsuariosPage }) },
    ],
  },
];
