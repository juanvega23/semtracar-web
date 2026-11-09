import { useQuery } from '@tanstack/react-query';
import { useRequiredCurrentUser } from '@/features/acceso';
import { useLiveUpdates } from '@/lib/liveUpdates';
import { listReceiptCards } from '../services/receiptCardsService';

const watches = [
  { table: 'invoices' },
  { table: 'invoice_items' },
  { table: 'payments' },
  { table: 'deliveries' },
] as const;

export function useMyInvoices(page: number) {
  const user = useRequiredCurrentUser();
  useLiveUpdates('my-invoices', user.id, watches);
  return useQuery({
    queryKey: ['my-invoices', user.id, page],
    queryFn: () => listReceiptCards(user.id, page),
    refetchInterval: 30_000,
  });
}
