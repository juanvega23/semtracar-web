import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SelectField,
  TextField,
} from '@/components/ui';
import { formatUSD } from '@/lib/format';
import { useQuotation } from '../hooks/useQuotation';

export function CotizacionPage() {
  const { form, result, clearResult, submit, config, catalogs } = useQuotation();
  const errors = form.formState.errors;
  return (
    <>
      <PageHeader
        title="Cotizar envío"
        description="Calcula el costo estimado de traer tus compras a Nicaragua."
      />
      {config.isPending || catalogs.isPending ? (
        <LoadingState message="Cargando tarifas…" />
      ) : config.isError || catalogs.isError ? (
        <ErrorState
          onRetry={() => {
            void config.refetch();
            void catalogs.refetch();
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <form
              onSubmit={(event) => void submit(event)}
              onChange={clearResult}
              className="space-y-5"
              noValidate
            >
              <TextField
                label="Peso (lb)"
                inputMode="decimal"
                placeholder="Ej. 2.5"
                required
                {...form.register('weight')}
                error={errors.weight?.message}
                hint="Mayor que 0 y hasta 1000 lb. Puedes usar decimales."
              />
              <SelectField
                label="Método de envío"
                required
                {...form.register('method')}
                error={errors.method?.message}
              >
                <option value="">Seleccionar método</option>
                {catalogs.data.methods
                  .filter((method) => config.data.ratesByShippingMethod[method.id] > 0)
                  .map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name} · {formatUSD(config.data.ratesByShippingMethod[method.id])}/lb
                    </option>
                  ))}
              </SelectField>
              <SelectField
                label="Categoría"
                required
                {...form.register('category')}
                error={errors.category?.message}
              >
                <option value="">Seleccionar categoría</option>
                {catalogs.data.types
                  .filter((category) => config.data.multipliersByPackageType[category.id] > 0)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} · ×{config.data.multipliersByPackageType[category.id].toFixed(2)}
                    </option>
                  ))}
              </SelectField>
              {errors.root && (
                <p role="alert" className="text-sm text-red-600">
                  {errors.root.message}
                </p>
              )}
              <Button type="submit" fullWidth>
                Calcular cotización
              </Button>
            </form>
          </Card>
          <Card>
            {result ? (
              <div aria-live="polite" className="space-y-4">
                <h2 className="text-lg font-semibold">Desglose estimado</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt>Peso</dt>
                    <dd>{result.weight} lb</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Tarifa por libra</dt>
                    <dd>{formatUSD(result.rate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Base del envío</dt>
                    <dd>{formatUSD(result.base)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Multiplicador de categoría</dt>
                    <dd>×{result.multiplier.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Ajuste por categoría</dt>
                    <dd>{formatUSD(result.surcharge)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-4 text-xl font-semibold">
                    <dt>Total estimado</dt>
                    <dd>{formatUSD(result.total)}</dd>
                  </div>
                </dl>
                <p className="text-sm text-slate-500">
                  Estimación de envío. El importe final se confirma al pesar y registrar el paquete. El
                  delivery se solicita por separado.
                </p>
              </div>
            ) : (
              <EmptyState
                title="Tu estimación aparecerá aquí"
                description="Selecciona el peso, el método y la categoría para ver el desglose."
              />
            )}
          </Card>
        </div>
      )}
    </>
  );
}
