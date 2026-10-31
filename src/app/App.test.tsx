import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ToastProvider } from '@/components/ui';
import { SessionProvider } from '@/features/auth';
import { routes } from './routes';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>,
  );
  return router;
}

describe('rutas protegidas (RF-68)', () => {
  it('sin sesión, una ruta privada lleva al login', async () => {
    const router = renderAt('/admin/usuarios');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('muestra registro con aceptación de términos (RNF-42)', async () => {
    renderAt('/registro');
    expect(await screen.findByRole('heading', { name: 'Crea tu casillero' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('muestra 404 en rutas que no existen', async () => {
    renderAt('/no-existe');
    expect(await screen.findByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument();
  });
});
