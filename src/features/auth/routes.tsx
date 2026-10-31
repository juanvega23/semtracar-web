import type { RouteObject } from 'react-router';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';

/** Rutas públicas de autenticación (RF-01 a RF-07, RNF-42). Cada página se carga por separado (RNF-09). */
export const authRoutes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: 'login', lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }) },
      {
        path: 'registro',
        lazy: async () => ({ Component: (await import('./pages/RegisterPage')).RegisterPage }),
      },
      {
        path: 'recuperar',
        lazy: async () => ({ Component: (await import('./pages/ForgotPasswordPage')).ForgotPasswordPage }),
      },
    ],
  },
  {
    path: 'reset-password',
    lazy: async () => ({ Component: (await import('./pages/ResetPasswordPage')).ResetPasswordPage }),
  },
  { path: 'terminos', lazy: async () => ({ Component: (await import('./pages/LegalPage')).TermsPage }) },
  { path: 'privacidad', lazy: async () => ({ Component: (await import('./pages/LegalPage')).PrivacyPage }) },
];
