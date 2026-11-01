import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPackageStatus,
  markPackageReady,
  getLatestStatuses,
  getPackageHistory,
  getStatusCatalog,
  type StatusRole,
} from '../services/packageStatusService';

export function useStatusCatalog() {
  return useQuery({ queryKey: ['package-status-catalog'], queryFn: getStatusCatalog, staleTime: 600_000 });
}
export function useLatestStatuses(packageIds: string[]) {
  return useQuery({
    queryKey: ['package-status-latest', packageIds],
    queryFn: () => getLatestStatuses(packageIds),
    enabled: packageIds.length > 0,
  });
}
export function usePackageHistory(packageId: string | null) {
  return useQuery({
    queryKey: ['package-history', packageId],
    queryFn: () => getPackageHistory(packageId!),
    enabled: Boolean(packageId),
  });
}
export function useAddPackageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { packageId: string; statusId: number; location: string; role: StatusRole }) =>
      addPackageStatus(input),
    onSuccess: (_, input) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['package-history', input.packageId] }),
        queryClient.invalidateQueries({ queryKey: ['package-status-latest'] }),
        queryClient.invalidateQueries({ queryKey: ['packages'] }),
      ]),
  });
}

/** Transición atómica de un paquete desde Aduana a Listo para recoger. */
export function useMarkPackageReady() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markPackageReady,
    onSuccess: (_, input) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['package-history', input.packageId] }),
        queryClient.invalidateQueries({ queryKey: ['package-status-latest'] }),
        queryClient.invalidateQueries({ queryKey: ['packages'] }),
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
      ]),
  });
}
