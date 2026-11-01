import { useQuery } from '@tanstack/react-query';
import { useRequiredCurrentUser } from '@/features/acceso';
import { listInvoices } from '@/features/facturacion';
import { useLiveUpdates } from '@/lib/liveUpdates';

const watches = [{ table: 'invoices' }, { table: 'invoice_items' }, { table: 'payments' }] as const;
export function useMyInvoices(page: number, search: string) {
  const user = useRequiredCurrentUser();
  useLiveUpdates('my-invoices', user.id, watches);
  return useQuery({
    queryKey: ['my-invoices', user.id, page, search],
    queryFn: () => listInvoices(page, search, user.id),
    refetchInterval: 30_000,
  });
}
