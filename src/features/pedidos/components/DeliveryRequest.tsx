import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  TextField,
  useToast,
} from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { useAppConfig } from '@/lib/appConfig';
import { toUserMessage } from '@/lib/errors';
import { formatInvoiceNumber, formatUSD } from '@/lib/format';
import { useDeclineDelivery, useDeliveryCandidates, useRequestDelivery } from '../hooks/useDeliveries';
import {
  deliveryContactSchema,
  DeliveryValidationError,
  ORDERS_PAGE_SIZE,
} from '../services/deliveriesService';

export function DeliveryRequest() {
  const user = useRequiredCurrentUser();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const candidates = useDeliveryCandidates(page);
  const config = useAppConfig();
  const request = useRequestDelivery();
  const decline = useDeclineDelivery();
  const toast = useToast();
  const form = useForm({
    resolver: zodResolver(deliveryContactSchema),
    defaultValues: { address: user.address ?? '', phone: user.phone ?? '' },
  });
  const chosen =
    candidates.data?.items.filter((invoice) => selected.includes(invoice.id) && invoice.canRequest) ?? [];
  const packageCount = chosen.reduce((sum, invoice) => sum + invoice.items.length, 0);
  const invalidGrouping = packageCount > 1 && chosen.some((invoice) => invoice.hasPayments);
  const busy = request.isPending || decline.isPending;
  const ready = config.data && Number.isFinite(config.data.deliveryCost) && config.data.deliveryCost > 0;
  const submit = form.handleSubmit(() => setConfirm(true));
  async function send() {
    if (!chosen.length || chosen.length !== selected.length || invalidGrouping || busy) return;
    try {
      const result = await request.mutateAsync({
        invoiceIds: chosen.map((invoice) => invoice.id),
        ...form.getValues(),
      });
      setSelected([]);
      setConfirm(false);
      if (result.notified) toast.success('Pedido creado. Avisamos a los repartidores.');
      else
        toast.show(
          'El pedido quedó creado, pero no pudimos avisar a los repartidores. Contacta a SEMTRACAR; no vuelvas a solicitarlo.',
          'info',
        );
    } catch (error) {
      toast.error(
        toUserMessage(
          error,
          error instanceof DeliveryValidationError
            ? error.message
            : 'No pudimos confirmar la solicitud. Actualiza tus pedidos antes de volver a intentarlo.',
        ),
      );
      setConfirm(false);
    }
  }
  async function pickup(id: string) {
    if (busy) return;
    try {
      await decline.mutateAsync(id);
      setSelected((ids) => ids.filter((value) => value !== id));
      toast.success('Elegiste retirar en sucursal.');
    } catch (error) {
      toast.error(
        toUserMessage(
          error,
          error instanceof DeliveryValidationError ? error.message : 'No se pudo guardar tu elección.',
        ),
      );
    }
  }
  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Solicitar entrega a domicilio</h2>
        <p className="mt-1 text-sm text-slate-500">
          El retiro en sucursal es la opción predeterminada. Selecciona recibos completos para llevar todos
          sus paquetes en un pedido.
        </p>
      </div>
      {candidates.isPending || config.isPending ? (
        <LoadingState message="Cargando opciones de entrega…" />
      ) : candidates.isError || config.isError ? (
        <ErrorState
          onRetry={() => {
            void candidates.refetch();
            void config.refetch();
          }}
        />
      ) : (
        <>
          {!ready && (
            <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              No hay una tarifa de delivery disponible. Puedes retirar en sucursal o contactar a SEMTRACAR.
            </p>
          )}
          {!candidates.data.items.length ? (
            <EmptyState
              title="No hay recibos disponibles para solicitar delivery"
              description="Los paquetes deben estar listos para recoger y no tener un pedido de delivery previo."
            />
          ) : (
            <>
              <div className="space-y-3">
                {candidates.data.items.map((invoice) => (
                  <div key={invoice.id} className="space-y-2 rounded-xl border border-slate-200 p-4">
                    <Checkbox
                      label={
                        <span>
                          <span className="font-mono font-semibold">
                            {formatInvoiceNumber(invoice.invoice_number)}
                          </span>{' '}
                          · {invoice.items.length} paquete(s) · {formatUSD(invoice.total)}
                        </span>
                      }
                      disabled={!ready || !invoice.canRequest || busy}
                      checked={selected.includes(invoice.id)}
                      onChange={(event) =>
                        setSelected((ids) =>
                          event.target.checked ? [...ids, invoice.id] : ids.filter((id) => id !== invoice.id),
                        )
                      }
                    />
                    <ul className="pl-7 text-sm text-slate-500">
                      {invoice.items.map((item) => (
                        <li key={item.id}>{item.description}</li>
                      ))}
                    </ul>
                    {!invoice.canRequest && (
                      <p className="text-sm text-amber-700">
                        {invoice.hasDelivery
                          ? 'Este recibo ya tiene un pedido de delivery registrado, aunque esté cancelado. No admite otra solicitud.'
                          : 'Todos los paquetes de este recibo deben estar listos para recoger.'}
                      </p>
                    )}
                    {invoice.delivery_choice === 'rechazado' ? (
                      <Badge tone="info">Retiro en sucursal</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!ready || busy}
                        onClick={() => void pickup(invoice.id)}
                      >
                        Prefiero retirar en sucursal
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                <span>
                  {page * ORDERS_PAGE_SIZE + 1}–
                  {Math.min(candidates.data.total, (page + 1) * ORDERS_PAGE_SIZE)} de {candidates.data.total}{' '}
                  recibos
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0 || busy || candidates.isFetching}
                    onClick={() => {
                      setSelected([]);
                      setPage(page - 1);
                    }}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      (page + 1) * ORDERS_PAGE_SIZE >= candidates.data.total || busy || candidates.isFetching
                    }
                    onClick={() => {
                      setSelected([]);
                      setPage(page + 1);
                    }}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
              <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
                <TextField
                  label="Dirección de entrega"
                  required
                  maxLength={250}
                  disabled={busy}
                  {...form.register('address')}
                  error={form.formState.errors.address?.message}
                  autoComplete="street-address"
                />
                <TextField
                  label="Teléfono de contacto"
                  required
                  type="tel"
                  disabled={busy}
                  {...form.register('phone')}
                  error={form.formState.errors.phone?.message}
                  autoComplete="tel"
                  hint="8 dígitos, con o sin +505."
                />
                <p className="text-sm text-slate-500">
                  La dirección y el teléfono se guardarán en tu perfil antes de solicitar la entrega.
                </p>
                <p className="font-semibold">
                  Cargo por pedido: {formatUSD(config.data.deliveryCost)} · {packageCount} paquete(s)
                  seleccionado(s)
                </p>
                {invalidGrouping && (
                  <p role="alert" className="text-sm text-amber-700">
                    Los pedidos de varios paquetes requieren recibos sin pagos para consolidarlos. Solicita
                    revisión a administración.
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={
                    !ready ||
                    !chosen.length ||
                    chosen.length !== selected.length ||
                    invalidGrouping ||
                    candidates.isFetching ||
                    busy
                  }
                >
                  Revisar solicitud
                </Button>
              </form>
            </>
          )}
        </>
      )}
      <Modal
        open={confirm}
        onClose={() => {
          if (!busy) setConfirm(false);
        }}
        title="Confirmar delivery"
      >
        <div className="space-y-4">
          <p>
            Solicitarás la entrega de {packageCount} paquete(s) por {formatUSD(config.data?.deliveryCost)} de
            cargo de delivery.
          </p>
          <p className="text-sm">Dirección: {form.getValues('address')}</p>
          <p className="text-sm">Teléfono: {form.getValues('phone')}</p>
          {packageCount > 1 && (
            <p className="text-sm text-slate-600">
              Los recibos seleccionados se consolidarán en un solo recibo para este pedido. Los recibos
              secundarios se conservarán como anulados en tu historial.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>
              Volver
            </Button>
            <Button
              loading={request.isPending}
              disabled={
                !ready ||
                !chosen.length ||
                invalidGrouping ||
                chosen.length !== selected.length ||
                candidates.isFetching
              }
              onClick={() => void send()}
            >
              Confirmar pedido
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
