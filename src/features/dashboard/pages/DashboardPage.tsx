import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardTitle,
  ChartIcon,
  ClockIcon,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  ShipmentTimeline,
  SoftStat,
  Table,
  Td,
  TextField,
  Th,
  TruckIcon,
  UsersIcon,
} from '@/components/ui';
import { downloadCsv } from '@/lib/csv';
import { formatUSD } from '@/lib/format';
import { currentMonth, fetchDashboard } from '../services/dashboardService';

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
        title="Resumen"
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
            <SoftStat
              tone="green"
              icon={<ChartIcon size={24} />}
              label="Ingresos del mes"
              value={formatUSD(data.income)}
            />
            <SoftStat
              tone="blue"
              icon={<ClockIcon size={24} />}
              label="Por cobrar"
              value={formatUSD(data.pending_balance)}
            />
            <SoftStat
              tone="lilac"
              icon={<TruckIcon size={24} />}
              label="Entregas del mes"
              value={String(data.deliveries)}
            />
            <SoftStat
              tone="peach"
              icon={<UsersIcon size={24} />}
              label="Total de clientes"
              value={String(data.clients)}
            />
          </div>

          <Card>
            <CardTitle>Paquetes activos por estado</CardTitle>
            <ShipmentTimeline
              label="Paquetes activos por estado"
              stops={data.packages_by_status.map((item) => ({
                id: item.id,
                name: item.name,
                reached: item.count > 0,
                children: <p className="text-3xl font-bold text-ink-900 tabular-nums">{item.count}</p>,
              }))}
            />
          </Card>

          <Card className="p-0 sm:p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <h2 className="text-base font-bold text-slate-600 uppercase">Entregas por repartidor</h2>
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
