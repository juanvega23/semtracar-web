import { Navigate, Outlet, useLocation } from 'react-router';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { useSession, useSignOut } from '@/features/auth';
import { useCurrentUser, useCurrentUserRealtime } from '../hooks/useCurrentUser';

/**
 * Rutas que necesitan sesión (RF-68). Además:
 * - escucha el cambio de rol en tiempo real (RF-10);
 * - manda al repartidor a la pantalla de app móvil (RF-09).
 */
export function RequireAuth() {
  const { session, loading } = useSession();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const signOut = useSignOut();
  useCurrentUserRealtime();

  if (loading) return <LoadingState message="Verificando sesión…" className="min-h-dvh" />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (currentUser.isPending) return <LoadingState message="Cargando tu cuenta…" className="min-h-dvh" />;

  if (currentUser.isError) {
    return <ErrorState className="min-h-dvh" onRetry={() => void currentUser.refetch()} />;
  }

  if (!currentUser.data) {
    return (
      <ErrorState
        className="min-h-dvh"
        title="Tu cuenta no tiene perfil"
        description={
          <>
            No encontramos tus datos de cliente. Escríbenos para revisarlo.
            <span className="mt-4 block">
              <Button variant="outline" loading={signOut.isPending} onClick={() => signOut.mutate()}>
                Cerrar sesión
              </Button>
            </span>
          </>
        }
      />
    );
  }

  if (currentUser.data.role === 'repartidor') return <Navigate to="/app-movil" replace />;

  return <Outlet />;
}
