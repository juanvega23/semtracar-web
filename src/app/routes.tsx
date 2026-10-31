import type { RouteObject } from 'react-router';
import { accesoRoutes, HomeRedirect, RequireAuth } from '@/features/acceso';
import { authRoutes } from '@/features/auth';
import { avisosRoutes } from '@/features/avisos';
import { cotizacionRoutes } from '@/features/cotizacion';
import { dashboardRoutes } from '@/features/dashboard';
import { facturacionRoutes } from '@/features/facturacion';
import { paquetesRoutes } from '@/features/paquetes';
import { pedidosRoutes } from '@/features/pedidos';
import { perfilRoutes } from '@/features/perfil';
import { recibosRoutes } from '@/features/recibos';
import { retiroRoutes } from '@/features/retiro';
import { seguimientoRoutes } from '@/features/seguimiento';
import { usuariosRoutes } from '@/features/usuarios';
import { AppLayout } from './layouts/AppLayout';
import { NotFoundPage, RouteErrorPage } from './pages/SystemPages';

/**
 * Router central (brief §6): solo junta las rutas que exporta cada feature.
 * Para agregar pantallas, edita el routes.tsx de tu feature, no este archivo.
 */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      ...authRoutes,
      ...accesoRoutes,
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <HomeRedirect /> },
              ...seguimientoRoutes,
              ...recibosRoutes,
              ...cotizacionRoutes,
              ...paquetesRoutes,
              ...facturacionRoutes,
              ...retiroRoutes,
              ...pedidosRoutes,
              ...dashboardRoutes,
              ...usuariosRoutes,
              ...avisosRoutes,
              ...perfilRoutes,
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
