import { useQuery } from '@tanstack/react-query';
import { useRequiredCurrentUser } from '@/features/acceso';
import { getPackageHistory, getStatusCatalog } from '@/features/paquetes';
import { useLiveUpdates } from '@/lib/liveUpdates';
import { listMyPackages } from '../services/trackingService';

const watches = [{ table: 'packages' }, { table: 'package_status_history' }] as const;
export function useTracking(page: number, search: string) {
  const user = useRequiredCurrentUser();
  useLiveUpdates('tracking', user.id, watches);
  return useQuery({
    queryKey: ['tracking', user.id, 'list', page, search],
    queryFn: () => listMyPackages(user.id, page, search),
    refetchInterval: 30_000,
  });
}
export function useTrackingHistory(packageId: string | null) {
  const user = useRequiredCurrentUser();
  return useQuery({
    queryKey: ['tracking', user.id, 'history', packageId],
    queryFn: () => getPackageHistory(packageId!),
    enabled: Boolean(packageId),
    refetchInterval: 30_000,
  });
}
export function useTrackingCatalog() {
  return useQuery({ queryKey: ['package-status-catalog'], queryFn: getStatusCatalog, staleTime: 600_000 });
}
