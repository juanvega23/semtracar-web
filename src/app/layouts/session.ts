import { useNavigate } from 'react-router';
import { ROLE_LABELS, type CurrentUser } from '@/features/acceso';
import { useSignOut } from '@/features/auth';

/** Subtítulo del usuario: casillero para el cliente, rol para el personal. */
export function userSubtitle(user: CurrentUser) {
  return user.role === 'cliente' ? user.casillero : ROLE_LABELS[user.role];
}

/** Cierra sesión y vuelve al login (RF-07). */
export function useLogout() {
  const navigate = useNavigate();
  const signOut = useSignOut();
  return {
    pending: signOut.isPending,
    logout: () => signOut.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) }),
  };
}
