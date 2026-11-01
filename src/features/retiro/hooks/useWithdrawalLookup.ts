import { useQuery } from '@tanstack/react-query';
import { lookupWithdrawal } from '../services/retiroService';

export function useWithdrawalLookup(receipt: string | null) {
  return useQuery({
    queryKey: ['retiro', 'recibo', receipt],
    queryFn: () => lookupWithdrawal(receipt!),
    enabled: Boolean(receipt),
    retry: false,
  });
}
