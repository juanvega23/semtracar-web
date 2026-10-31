import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSession } from '@/features/auth';
import { fetchCurrentUser, subscribeToCurrentUser, type CurrentUser } from '../services/currentUserService';

export const currentUserKey = (userId: string | undefined) => ['current-user', userId] as const;

/** Perfil y rol del usuario con sesión. */
export function useCurrentUser() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: currentUserKey(userId),
    queryFn: () => fetchCurrentUser(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

/** Igual que useCurrentUser, pero para pantallas dentro de RequireAuth, donde el perfil ya existe. */
export function useRequiredCurrentUser(): CurrentUser {
  const { data } = useCurrentUser();
  if (!data) throw new Error('useRequiredCurrentUser se usó fuera de una ruta protegida.');
  return data;
}

/** Aplica al instante los cambios de la propia fila: rol, nombre, etc. (RF-10). Montar una sola vez. */
export function useCurrentUserRealtime() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    return subscribeToCurrentUser(userId, (user) => {
      queryClient.setQueryData(currentUserKey(userId), user);
    });
  }, [userId, queryClient]);
}
