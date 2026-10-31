import { Navigate, Outlet } from 'react-router';
import { LoadingState } from '@/components/ui';
import { useSession } from '../hooks/useSession';

/** Login, registro y recuperar contraseña: si ya hay sesión, va al inicio de su rol. */
export function PublicOnlyRoute() {
  const { session, loading } = useSession();
  if (loading) return <LoadingState className="min-h-dvh" />;
  if (session) return <Navigate to="/" replace />;
  return <Outlet />;
}
