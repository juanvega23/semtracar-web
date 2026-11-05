import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Table,
  Td,
  TextField,
  Th,
} from '@/components/ui';
import { downloadCsv } from '@/lib/csv';
import { formatUSD } from '@/lib/format';
import { barWidth, currentMonth, fetchDashboard } from '../services/dashboardService';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="sm:p-5">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

/** RF-58: indicadores de la operación. RF-59: entregas por repartidor. */
export function DashboardPage() {
  const thisMonth = currentMonth();
  const [month, setMonth] = useState(thisMonth);
  const query = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => fetchDashboard(month),
    placeholderData: keepPreviousData,
    enabled: /^\d{4}-\d{2}$/.test(month),
  });

  const data = query.data;
  const activePackages = data?.packages_by_status.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const maxStatus = Math.max(0, ...(data?.packages_by_status.map((item) => item.count) ?? []));

  function exportReport() {
    if (!data) return;
    downloadCsv(
      `semtracar-entregas-${month}.csv`,
      ['Repartidor', `Entregas de ${month}`, 'Entregas totales', 'Pedidos en curso'],
      data.deliverers.map((item) => [
        item.name,
        item.month_delivered,
        item.total_delivered,
        item.in_progress,
      ]),
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Indicadores de la operación y reporte de entregas."
        actions={
          <div className="w-44">
            <TextField
              label="Mes"
              type="month"
              max={thisMonth}
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </div>
        }
      />
      {query.isLoading ? (
        <LoadingState message="Cargando indicadores…" />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !data ? (
        <EmptyState title="Selecciona un mes" description="Elige el mes que quieres consultar." />
      ) : (
        <div className="space-y-5" aria-busy={query.isFetching}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Ingresos del mes"
              value={formatUSD(data.income)}
              hint={`Por cobrar en total: ${formatUSD(data.pending_balance)}`}
            />
            <Stat label="Entregas del mes" value={String(data.deliveries)} hint="Pedidos entregados" />
            <Stat
              label="Paquetes activos"
              value={String(activePackages)}
              hint="Sin pagar, en cualquier estado"
            />
            <Stat label="Total de clientes" value={String(data.clients)} hint="Con cuenta en SEMTRACAR" />
          </div>

          <Card>
            <CardTitle>Paquetes activos por estado</CardTitle>
            <ul className="space-y-3">
              {data.packages_by_status.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_3rem]"
                >
                  <span className="text-ink-800">{item.name}</span>
                  <span className="h-3 overflow-hidden rounded bg-slate-100" aria-hidden="true">
                    <span
                      className="block h-full rounded bg-brand-500"
                      style={{ width: `${barWidth(item.count, maxStatus)}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold text-ink-900 tabular-nums">{item.count}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-0 sm:p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <h2 className="text-lg font-semibold text-ink-900">Entregas por repartidor</h2>
              <Button
                variant="outline"
                size="sm"
                disabled={data.deliverers.length === 0}
                onClick={exportReport}
              >
                Exportar CSV
              </Button>
            </div>
            {data.deliverers.length === 0 ? (
              <EmptyState
                title="Todavía no hay repartidores"
                description="Promueve un cliente a repartidor desde Usuarios."
              />
            ) : (
              <div className="px-5 pb-5 sm:px-0 sm:pb-0">
                <Table>
                  <thead>
                    <tr>
                      <Th>Repartidor</Th>
                      <Th>Entregas del mes</Th>
                      <Th>Entregas totales</Th>
                      <Th>En curso</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.deliverers.map((item) => (
                      <tr key={item.id}>
                        <Td className="font-medium">{item.name}</Td>
                        <Td className="tabular-nums">{item.month_delivered}</Td>
                        <Td className="tabular-nums">{item.total_delivered}</Td>
                        <Td className="tabular-nums">{item.in_progress}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
