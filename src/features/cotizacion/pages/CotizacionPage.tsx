import {
  Button,
  Card,
  ErrorState,
  IconInput,
  IconSelect,
  LoadingState,
  RouteSignIcon,
  ScaleIcon,
  ShapesIcon,
} from '@/components/ui';
import { formatUSD } from '@/lib/format';
import { useQuotation } from '../hooks/useQuotation';

const METHOD_LABELS: Record<string, string> = { Aéreo: 'Por Avión', Marítimo: 'Por Barco' };

export function CotizacionPage() {
  const { form, result, clearResult, submit, config, catalogs } = useQuotation();
  const errors = form.formState.errors;
  return (
    <div className="mx-auto max-w-[418px] pt-4 lg:pt-20">
      <h1 className="sr-only">Calcular envío</h1>
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
        <>
          <Card className="p-9">
            <form
              onSubmit={(event) => void submit(event)}
              onChange={clearResult}
              className="flex flex-col gap-5"
              noValidate
            >
              <IconInput
                label="Peso (libras)"
                placeholder="Peso (libras)"
                icon={<ScaleIcon size={32} />}
                inputMode="decimal"
                required
                {...form.register('weight')}
                error={errors.weight?.message}
              />
              <IconSelect
                label="Método de Envío"
                icon={<RouteSignIcon size={32} />}
                required
                {...form.register('method')}
                error={errors.method?.message}
              >
                {catalogs.data.methods
                  .filter((method) => config.data.ratesByShippingMethod[method.id] > 0)
                  .map((method) => (
                    <option key={method.id} value={method.id}>
                      {METHOD_LABELS[method.name] ?? method.name}
                    </option>
                  ))}
              </IconSelect>
              <IconSelect
                label="Categoría"
                icon={<ShapesIcon size={32} />}
                required
                {...form.register('category')}
                error={errors.category?.message}
              >
                {catalogs.data.types
                  .filter((category) => config.data.multipliersByPackageType[category.id] > 0)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </IconSelect>
              {errors.root && (
                <p role="alert" className="text-sm text-red-600">
                  {errors.root.message}
                </p>
              )}
              <Button
                type="submit"
                variant="secondary"
                fullWidth
                className="mt-2 h-[67px]! text-2xl! uppercase"
              >
                Calcular precio
              </Button>
            </form>
          </Card>

          <section
            aria-live="polite"
            className="mt-8 rounded-xl bg-brand-600 px-9 py-5 text-white"
            aria-label="Resultado de la cotización"
          >
            <p className="text-2xl font-bold">Costo Total:</p>
            <p className="mt-3 text-[44px] leading-none font-bold tabular-nums">
              {formatUSD(result?.total ?? 0)}
            </p>
            {result && (
              <dl className="mt-5 space-y-1 border-t border-white/40 pt-4 text-sm font-medium">
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
              </dl>
            )}
            {result && (
              <p className="mt-3 text-xs">
                Estimación. El importe final se confirma al pesar y registrar el paquete.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
