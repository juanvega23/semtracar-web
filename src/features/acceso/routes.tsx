import type { RouteObject } from 'react-router';
import { MobileAppPage } from './pages/MobileAppPage';

/** Rutas públicas de acceso (fuera de RequireAuth). */
export const accesoRoutes: RouteObject[] = [{ path: 'app-movil', element: <MobileAppPage /> }];
