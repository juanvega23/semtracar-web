import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRequiredCurrentUser } from '@/features/acceso';
import { useLiveUpdates } from '@/lib/liveUpdates';
import {
  cancelUnpaidInvoice,
  getInvoiceDetail,
  listInvoices,
  registerInvoicePayment,
} from '../services/invoicesService';

const invoicesKey = ['facturacion'] as const;
const watches = [{ table: 'invoices' }, { table: 'invoice_items' }, { table: 'payments' }] as const;

export function useInvoices(page: number, search: string) {
  const user = useRequiredCurrentUser();
  useLiveUpdates('facturacion', user.id, watches);
  return useQuery({
    queryKey: [...invoicesKey, user.id, 'recibos', page, search],
    queryFn: () => listInvoices(page, search),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useInvoiceDetail(invoiceId: string | null) {
  const user = useRequiredCurrentUser();
  useLiveUpdates('facturacion', user.id, watches);
  return useQuery({
    queryKey: [...invoicesKey, user.id, 'detalle', invoiceId],
    queryFn: () => getInvoiceDetail(invoiceId!),
    enabled: Boolean(invoiceId),
    refetchInterval: 30_000,
  });
}

export function useRegisterInvoicePayment() {
  const queryClient = useQueryClient();
  const user = useRequiredCurrentUser();
  return useMutation({
    mutationFn: (input: Parameters<typeof registerInvoicePayment>[0]) => {
      if (user.role !== 'admin') throw new Error('Solo administración puede registrar pagos.');
      return registerInvoicePayment(input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesKey }),
        queryClient.invalidateQueries({ queryKey: ['packages'] }),
        queryClient.invalidateQueries({ queryKey: ['tracking'] }),
        queryClient.invalidateQueries({ queryKey: ['my-invoices'] }),
      ]);
    },
  });
}

export function useCancelUnpaidInvoice() {
  const queryClient = useQueryClient();
  const user = useRequiredCurrentUser();
  return useMutation({
    mutationFn: (invoiceId: string) => {
      if (user.role !== 'admin') throw new Error('Solo administración puede anular recibos.');
      return cancelUnpaidInvoice(invoiceId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesKey }),
        queryClient.invalidateQueries({ queryKey: ['packages'] }),
        queryClient.invalidateQueries({ queryKey: ['retiro'] }),
        queryClient.invalidateQueries({ queryKey: ['tracking'] }),
        queryClient.invalidateQueries({ queryKey: ['my-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ]);
    },
  });
}
