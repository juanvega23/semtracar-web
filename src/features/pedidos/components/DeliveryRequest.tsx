import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArchiveIcon,
  Button,
  Card,
  cn,
  EmptyState,
  ErrorState,
  IconInput,
  LoadingState,
  MapPinIcon,
  Modal,
  PhoneIcon,
  SectionTitle,
  StatusPill,
  StoreIcon,
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

/** Sangría de los detalles para alinearlos con el número de recibo. */
const INDENT = 'pl-9 sm:pl-[6.25rem]';

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
    <Card className="space-y-6 px-6 py-6">
      <div>
        <SectionTitle>Solicitar delivery</SectionTitle>
        <p className="mt-1 font-medium text-[#8e8e93]">
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
            <p role="status" className="rounded-xl bg-[#fff4d6] p-3 text-sm font-semibold text-[#9a7400]">
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
              <ul className="space-y-3">
                {candidates.data.items.map((invoice) => {
                  const checked = selected.includes(invoice.id);
                  const disabled = !ready || !invoice.canRequest || busy;
                  return (
                    <li
                      key={invoice.id}
                      className={cn(
                        'rounded-xl border p-4 transition-colors',
                        checked ? 'border-brand-600 bg-[#fef9f8]' : 'border-slate-200',
                      )}
                    >
                      <label
                        className={cn(
                          'flex items-center gap-4',
                          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-5 shrink-0 accent-[#e54f1d]"
                          disabled={disabled}
                          checked={checked}
                          onChange={(event) =>
                            setSelected((ids) =>
                              event.target.checked
                                ? [...ids, invoice.id]
                                : ids.filter((id) => id !== invoice.id),
                            )
                          }
                        />
                        <span
                          aria-hidden="true"
                          className="hidden size-12 shrink-0 items-center justify-center rounded-lg bg-[#d5d6dd] text-ink-900 sm:flex"
                        >
                          <ArchiveIcon size={26} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-lg font-bold text-ink-900">
                            {formatInvoiceNumber(invoice.invoice_number)}
                          </span>
                          <span className="block text-sm font-semibold text-[#8e8e93]">
                            {invoice.items.length} paquete(s)
                          </span>
                        </span>
                        <span className="text-lg font-bold text-ink-900 tabular-nums">
                          {formatUSD(invoice.total)}
                        </span>
                      </label>
                      <ul className={cn('mt-2 space-y-0.5 text-sm text-[#6d7588]', INDENT)}>
                        {invoice.items.map((item) => (
                          <li key={item.id}>{item.description}</li>
                        ))}
                      </ul>
                      {!invoice.canRequest && (
                        <p className={cn('mt-2 text-sm font-semibold text-[#9a7400]', INDENT)}>
                          {invoice.hasDelivery
                            ? 'Este recibo ya tiene un pedido de delivery registrado, aunque esté cancelado. No admite otra solicitud.'
                            : 'Todos los paquetes de este recibo deben estar listos para recoger.'}
                        </p>
                      )}
                      <div className={cn('mt-3', INDENT)}>
                        {invoice.delivery_choice === 'rechazado' ? (
                          <StatusPill tone="blue" icon={<StoreIcon size={16} />}>
                            Retiro en sucursal
                          </StatusPill>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-0! text-[#5b6178] underline-offset-4 hover:bg-transparent! hover:underline"
                            disabled={!ready || busy}
                            onClick={() => void pickup(invoice.id)}
                          >
                            <StoreIcon size={16} />
                            Prefiero retirar en sucursal
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {candidates.data.total > ORDERS_PAGE_SIZE && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                  <span>
                    {page * ORDERS_PAGE_SIZE + 1}–
                    {Math.min(candidates.data.total, (page + 1) * ORDERS_PAGE_SIZE)} de{' '}
                    {candidates.data.total} recibos
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
                        (page + 1) * ORDERS_PAGE_SIZE >= candidates.data.total ||
                        busy ||
                        candidates.isFetching
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
              )}
              <form onSubmit={(event) => void submit(event)} className="space-y-5" noValidate>
                <p className="text-lg font-bold text-ink-900">Datos de entrega</p>
                <IconInput
                  label="Dirección de entrega"
                  floating
                  icon={<MapPinIcon size={24} />}
                  required
                  maxLength={250}
                  disabled={busy}
                  {...form.register('address')}
                  error={form.formState.errors.address?.message}
                  autoComplete="street-address"
                />
                <IconInput
                  label="Teléfono de contacto"
                  floating
                  icon={<PhoneIcon size={24} />}
                  required
                  type="tel"
                  disabled={busy}
                  {...form.register('phone')}
                  error={form.formState.errors.phone?.message}
                  autoComplete="tel"
                  hint="8 dígitos, con o sin +505. Se guardan en tu perfil."
                />
                <div className="rounded-xl bg-brand-600 px-6 py-5 text-white">
                  <p className="text-lg font-bold">Cargo de delivery:</p>
                  <p className="mt-1 text-[40px] leading-none font-bold tabular-nums">
                    {formatUSD(config.data.deliveryCost)}
                  </p>
                  <dl className="mt-4 space-y-1 border-t border-white/40 pt-3 text-sm font-medium">
                    <div className="flex justify-between">
                      <dt>Recibos seleccionados</dt>
                      <dd className="tabular-nums">{chosen.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Paquetes</dt>
                      <dd className="tabular-nums">{packageCount}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs">
                    Un solo cargo por pedido, sin importar cuántos paquetes lleve.
                  </p>
                </div>
                {invalidGrouping && (
                  <p role="alert" className="text-sm font-semibold text-[#9a7400]">
                    Los pedidos de varios paquetes requieren recibos sin pagos para consolidarlos. Solicita
                    revisión a administración.
                  </p>
                )}
                <Button
                  type="submit"
                  variant="gradient"
                  fullWidth
                  className="h-[67px]! text-xl!"
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
          <p className="text-lg">
            Solicitarás la entrega de <strong>{packageCount} paquete(s)</strong> por{' '}
            <strong>{formatUSD(config.data?.deliveryCost)}</strong> de cargo de delivery.
          </p>
          <div className="space-y-2 rounded-xl bg-[#f6f6f8] p-4 text-sm">
            <p className="flex items-start gap-2">
              <MapPinIcon size={18} className="mt-0.5 shrink-0 text-brand-600" />
              {form.getValues('address')}
            </p>
            <p className="flex items-center gap-2">
              <PhoneIcon size={18} className="shrink-0 text-brand-600" />
              {form.getValues('phone')}
            </p>
          </div>
          {packageCount > 1 && (
            <p className="text-sm text-slate-600">
              Los recibos seleccionados se consolidarán en un solo recibo para este pedido. Los recibos
              secundarios se conservarán como anulados en tu historial.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>
              Volver
            </Button>
            <Button
              variant="gradient"
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
