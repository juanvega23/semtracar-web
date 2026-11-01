import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelUnpaidInvoice,
  getInvoiceDetail,
  listInvoices,
  registerInvoicePayment,
} from '../services/invoicesService';

const invoicesKey = ['facturacion', 'recibos'] as const;

export function useInvoices(page: number, search: string) {
  return useQuery({
    queryKey: [...invoicesKey, page, search],
    queryFn: () => listInvoices(page, search),
    placeholderData: keepPreviousData,
  });
}

export function useInvoiceDetail(invoiceId: string | null) {
  return useQuery({
    queryKey: ['facturacion', 'detalle', invoiceId],
    queryFn: () => getInvoiceDetail(invoiceId!),
    enabled: Boolean(invoiceId),
  });
}

export function useRegisterInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerInvoicePayment,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesKey }),
        queryClient.invalidateQueries({ queryKey: ['facturacion', 'detalle', variables.invoiceId] }),
        queryClient.invalidateQueries({ queryKey: ['packages'] }),
      ]);
    },
  });
}

export function useCancelUnpaidInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelUnpaidInvoice,
    onSuccess: async (_result, invoiceId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesKey }),
        queryClient.invalidateQueries({ queryKey: ['facturacion', 'detalle', invoiceId] }),
        queryClient.invalidateQueries({ queryKey: ['packages'] }),
        queryClient.invalidateQueries({ queryKey: ['retiro'] }),
      ]);
    },
  });
}
