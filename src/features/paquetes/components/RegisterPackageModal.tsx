import { useState, type FormEvent } from 'react';
import { Button, ErrorState, LoadingState, Modal, SelectField, TextField, useToast } from '@/components/ui';
import { toUserMessage } from '@/lib/errors';
import { useAppConfig } from '@/lib/appConfig';
import { formatUSD } from '@/lib/format';
import { useClientSearch, usePackageCatalogs, useRegisterPackage } from '../hooks/usePackages';

export function RegisterPackageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const catalogs = usePackageCatalogs();
  const config = useAppConfig();
  const mutation = useRegisterPackage();
  const [search, setSearch] = useState('');
  const clients = useClientSearch(search);
  const [userId, setUserId] = useState('');
  const [tracking, setTracking] = useState('');
  const [method, setMethod] = useState('');
  const [type, setType] = useState('');
  const [weight, setWeight] = useState('');
  const parsedWeight = Number(weight);
  const tariff = config.data?.ratesByShippingMethod[Number(method)];
  // 'Otros' (id 4) se calcula como Ropa por decisión del equipo.
  const multiplier = Number(type) === 4 ? 1 : config.data?.multipliersByPackageType[Number(type)];
  const validPrice =
    Number.isFinite(parsedWeight) &&
    parsedWeight > 0 &&
    parsedWeight <= 1000 &&
    tariff !== undefined &&
    multiplier !== undefined;
  const calculatedPrice = validPrice
    ? Math.round((parsedWeight * tariff! * multiplier! + Number.EPSILON) * 100) / 100
    : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !method || !type || !tracking.trim()) return;
    if (calculatedPrice === null) {
      toast.error('Revisa el peso y la configuración de tarifa y categoría.');
      return;
    }
    try {
      await mutation.mutateAsync({
        user_id: userId,
        tracking_code: tracking.trim(),
        shipping_method_id: Number(method),
        package_type_id: Number(type),
        weight: parsedWeight,
        price: calculatedPrice,
      });
      toast.success('Paquete registrado con estado Recibido.');
      setSearch('');
      setUserId('');
      setTracking('');
      setMethod('');
      setType('');
      setWeight('');
      onClose();
    } catch (error) {
      // No ocultar el error de conciliación si el segundo paso de registro falló.
      toast.error(
        error instanceof Error && error.message.startsWith('Se guardó el paquete')
          ? error.message
          : toUserMessage(
              error,
              'No se pudo registrar el paquete. Verifica si el código de rastreo ya existe.',
            ),
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
      title="Registrar paquete"
    >
      {catalogs.isPending || config.isPending ? (
        <LoadingState message="Cargando catálogos y tarifas…" />
      ) : catalogs.isError || config.isError ? (
        <ErrorState
          onRetry={() => {
            void catalogs.refetch();
            void config.refetch();
          }}
        />
      ) : (
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <TextField
            label="Buscar cliente"
            placeholder="Nombre, correo o casillero"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setUserId('');
            }}
          />
          <SelectField
            label="Cliente"
            required
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            disabled={search.trim().length < 2 || clients.isPending}
          >
            <option value="">{clients.isFetching ? 'Buscando clientes…' : 'Seleccionar cliente'}</option>
            {clients.data?.map((client) => (
              <option value={client.id} key={client.id}>
                {client.name} {client.last_name} — {client.casillero}
              </option>
            ))}
          </SelectField>
          {clients.isError && <p className="text-sm text-red-600">No se pudieron consultar los clientes.</p>}
          <TextField
            label="Código de rastreo"
            required
            maxLength={120}
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
          />
          <SelectField
            label="Método de envío"
            required
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            <option value="">Seleccionar método</option>
            {catalogs.data.methods.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Tipo de paquete"
            required
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">Seleccionar tipo</option>
            {catalogs.data.types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Peso (lb)"
              required
              type="number"
              min="0.001"
              max="1000"
              step="any"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Precio calculado (USD)</span>
              <output className="flex min-h-12 items-center rounded-xl border border-slate-200 px-4 text-sm">
                {calculatedPrice === null
                  ? 'Selecciona tarifa, categoría y peso'
                  : formatUSD(calculatedPrice)}
              </output>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={
                !userId ||
                !method ||
                !type ||
                !tracking.trim() ||
                calculatedPrice === null ||
                mutation.isPending
              }
            >
              Guardar paquete
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
