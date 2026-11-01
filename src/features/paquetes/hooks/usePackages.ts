import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRequiredCurrentUser } from '@/features/acceso';
import {
  findClients,
  getPackageCatalogs,
  listPackages,
  registerPackage,
  type PackageInput,
  type PackageFilters,
} from '../services/packagesService';

export function usePackages(filters: PackageFilters, page: number) {
  return useQuery({
    queryKey: ['packages', filters.search, filters.clientId, filters.statusId, page],
    queryFn: () => listPackages({ filters, page }),
  });
}
export function usePackageCatalogs() {
  return useQuery({ queryKey: ['package-catalogs'], queryFn: getPackageCatalogs, staleTime: 600_000 });
}
export function useClientSearch(term: string) {
  return useQuery({
    queryKey: ['package-clients', term],
    queryFn: () => findClients(term),
    enabled: term.trim().length >= 2,
  });
}
export function useRegisterPackage() {
  const client = useQueryClient();
  const { role } = useRequiredCurrentUser();
  return useMutation({
    mutationFn: (data: PackageInput) => registerPackage(data, role),
    onSuccess: () => client.invalidateQueries({ queryKey: ['packages'] }),
  });
}
