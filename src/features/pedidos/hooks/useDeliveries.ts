import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { currentUserKey, useRequiredCurrentUser } from '@/features/acceso';
import { updateProfile } from '@/features/perfil';
import { useLiveUpdates } from '@/lib/liveUpdates';
import {
  cancelDelivery,
  declineDelivery,
  deliveryContactSchema,
  listDeliveries,
  listDeliveryCandidates,
  requestDelivery,
} from '../services/deliveriesService';

const watches = [
  { table: 'deliveries' },
  { table: 'delivery_packages' },
  { table: 'invoices' },
  { table: 'payments' },
  { table: 'package_status_history' },
] as const;

export function useDeliveries(page: number, status: string, ownOnly: boolean) {
  const user = useRequiredCurrentUser();
  useLiveUpdates('orders', user.id, watches);
  return useQuery({
    queryKey: ['orders', user.id, 'list', ownOnly, page, status],
    queryFn: () => listDeliveries(page, status, ownOnly ? user.id : undefined),
    refetchInterval: 30_000,
  });
}

export function useDeliveryCandidates(page: number) {
  const user = useRequiredCurrentUser();
  return useQuery({
    queryKey: ['orders', user.id, 'candidates', page],
    queryFn: () => listDeliveryCandidates(user.id, page),
    refetchInterval: 30_000,
  });
}

function useInvalidateDelivery() {
  const client = useQueryClient();
  return async () => {
    await Promise.all(
      ['orders', 'my-invoices', 'facturacion', 'tracking', 'packages', 'retiro'].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    );
  };
}

export function useRequestDelivery() {
  const user = useRequiredCurrentUser();
  const client = useQueryClient();
  const invalidate = useInvalidateDelivery();
  return useMutation({
    mutationFn: async (input: { invoiceIds: string[]; address: string; phone: string }) => {
      const contact = deliveryContactSchema.parse(input);
      await updateProfile(user.id, { name: user.name, lastName: user.lastName, ...contact });
      await client.invalidateQueries({ queryKey: currentUserKey(user.id) });
      return requestDelivery({ userId: user.id, invoiceIds: input.invoiceIds, address: contact.address });
    },
    onSettled: invalidate,
  });
}

export function useDeclineDelivery() {
  const invalidate = useInvalidateDelivery();
  return useMutation({ mutationFn: declineDelivery, onSettled: invalidate });
}

export function useCancelDelivery() {
  const user = useRequiredCurrentUser();
  const invalidate = useInvalidateDelivery();
  return useMutation({ mutationFn: (id: string) => cancelDelivery(id, user.role), onSettled: invalidate });
}
