import { Navigate, Outlet } from 'react-router';
import { LockedState } from '@/components/ui';
import { useRequiredCurrentUser } from '../hooks/useCurrentUser';
import { accessFor, homePathFor, type Section } from '../roles';

/** Protege una sección según la matriz de permisos: entra, candado (RF-66) u oculta (RF-68). */
export function RequireAccess({ section }: { section: Section }) {
  const user = useRequiredCurrentUser();
  const access = accessFor(user.role, section);

  if (access === 'allowed') return <Outlet />;
  if (access === 'locked') {
    return (
      <LockedState
        className="py-24"
        description="Como encargado de almacén no tienes acceso a esta sección. Si lo necesitas, pídeselo a un administrador."
      />
    );
  }
  return <Navigate to={homePathFor(user.role)} replace />;
}

/** Ruta "/": lleva a cada rol a su pantalla inicial. */
export function HomeRedirect() {
  const user = useRequiredCurrentUser();
  return <Navigate to={homePathFor(user.role)} replace />;
}
