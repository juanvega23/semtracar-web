import { getLatestStatuses, listPackages } from '@/features/paquetes';

export async function listMyPackages(userId: string, page: number, search: string) {
  const result = await listPackages({ page, filters: { clientId: userId, search, statusId: null } });
  const latest = await getLatestStatuses(result.items.map((item) => item.id));
  return { ...result, latest };
}
