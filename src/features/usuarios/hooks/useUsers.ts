import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listUsers, promoteToRepartidor, setUserRole, type RoleFilter } from '../services/usersService';

const usersKey = ['usuarios'] as const;

export function useUsers(params: { search: string; role: RoleFilter; page: number }) {
  return useQuery({
    queryKey: [...usersKey, params],
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function usePromoteToRepartidor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, phone }: { userId: string; phone: string }) => promoteToRepartidor(userId, phone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'cliente' | 'almacen' }) =>
      setUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  });
}
