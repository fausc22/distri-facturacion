import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useReporteAnalitico } from '../../hooks/useReporteAnalitico';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';
import { CustomLineChart, CustomBarChart, CustomAreaChart } from '../charts/CustomCharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PanelCard } from '@/components/shared/PanelCard';
import { DataTable } from '@/components/tables/DataTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateViews';

export function FinancialBalance() {
  const { balance, loading, error, recargar, etiquetaPeriodo } = useReporteAnalitico({ incluirBalance: true });
  const { formatCurrency, formatPercentage } = useReportesContext();

  const balanceGeneral = balance.general;
  const balancePorCuenta = balance.porCuenta;
  const flujoDeFondos = balance.flujo;
  const totalesBalance = balance.totales;

  const flujoTotales = useMemo(
    () =>
      (flujoDeFondos || []).reduce(
        (acc, item) => ({
          totalIngresos: acc.totalIngresos + (parseFloat(item.ingreso) || 0),
          totalEgresos: acc.totalEgresos + (parseFloat(item.egreso) || 0),
          saldoFinal:
            acc.saldoFinal + (parseFloat(item.ingreso) || 0) - (parseFloat(item.egreso) || 0),
        }),
        { totalIngresos: 0, totalEgresos: 0, saldoFinal: 0 }
      ),
    [flujoDeFondos]
  );

  const evolucionBalance = useMemo(
    () =>
      (balanceGeneral || []).map((item) => ({
        periodo: item.mes || item.periodo,
        ingresos: parseFloat(item.ingresos),
        egresos: parseFloat(item.egresos),
        balance: parseFloat(item.balance),
      })),
    [balanceGeneral]
  );

  const cuentaColumns = useMemo(
    () => [
      { accessorKey: 'cuenta', header: 'Cuenta' },
      { accessorKey: 'ingresos', header: 'Ingresos', cell: ({ row }) => formatCurrency(row.original.ingresos) },
      { accessorKey: 'egresos', header: 'Egresos', cell: ({ row }) => formatCurrency(row.original.egresos) },
      { accessorKey: 'balance', header: 'Balance', cell: ({ row }) => formatCurrency(row.original.balance) },
      {
        id: 'participacion',
        header: '% ingresos',
        cell: ({ row }) =>
          formatPercentage(
            totalesBalance?.totalIngresos > 0
              ? (row.original.ingresos / totalesBalance.totalIngresos) * 100
              : 0
          ),
      },
    ],
    [formatCurrency, formatPercentage, totalesBalance?.totalIngresos]
  );

  if (loading && !balanceGeneral) {
    return <LoadingState message="Cargando balance financiero..." />;
  }

  if (error && !balanceGeneral) {
    return <ErrorState message={error} onRetry={recargar} />;
  }

  const sinDatos = !balanceGeneral?.length && !balancePorCuenta?.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Balance Financiero</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Movimientos de fondos (ingresos y egresos) · {etiquetaPeriodo}
          </p>
        </div>
        <Button className="mt-3 sm:mt-0" onClick={recargar} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {sinDatos ? (
        <EmptyState message="No hay movimientos de fondos en el período seleccionado." />
      ) : (
        <>
          <MetricsGrid columns={4}>
            <FinancialMetricsCard
              title="Total ingresos"
              value={totalesBalance?.totalIngresos || flujoTotales.totalIngresos || 0}
              formatCurrency={formatCurrency}
              color="green"
              loading={loading}
            />
            <FinancialMetricsCard
              title="Total egresos"
              value={totalesBalance?.totalEgresos || flujoTotales.totalEgresos || 0}
              formatCurrency={formatCurrency}
              color="red"
              loading={loading}
            />
            <FinancialMetricsCard
              title="Balance neto"
              value={totalesBalance?.balanceTotal || flujoTotales.saldoFinal || 0}
              formatCurrency={formatCurrency}
              color="blue"
              loading={loading}
            />
            <MetricsCard
              title="Rentabilidad"
              value={formatPercentage(
                totalesBalance?.totalIngresos > 0
                  ? (totalesBalance.balanceTotal / totalesBalance.totalIngresos) * 100
                  : 0
              )}
              color="purple"
              loading={loading}
            />
          </MetricsGrid>

          <CustomLineChart
            data={evolucionBalance}
            xKey="periodo"
            yKeys={[
              { dataKey: 'ingresos', name: 'Ingresos', color: '#10B981' },
              { dataKey: 'egresos', name: 'Egresos', color: '#EF4444' },
              { dataKey: 'balance', name: 'Balance', color: '#3B82F6' },
            ]}
            title="Evolución mensual del balance"
            height={350}
            formatCurrency={formatCurrency}
            loading={loading}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CustomBarChart
              data={balancePorCuenta}
              xKey="cuenta"
              yKeys={[
                { dataKey: 'ingresos', name: 'Ingresos', color: '#10B981' },
                { dataKey: 'egresos', name: 'Egresos', color: '#EF4444' },
              ]}
              title="Balance por cuenta"
              height={300}
              formatCurrency={formatCurrency}
              loading={loading}
            />
            <CustomAreaChart
              data={evolucionBalance}
              xKey="periodo"
              yKeys={[{ dataKey: 'balance', name: 'Balance neto', color: '#3B82F6' }]}
              title="Tendencia del balance"
              height={300}
              formatCurrency={formatCurrency}
              loading={loading}
            />
          </div>

          <PanelCard title="Detalle por cuenta">
            {balancePorCuenta?.length > 0 ? (
              <DataTable columns={cuentaColumns} data={balancePorCuenta} pageSize={10} />
            ) : (
              <EmptyState message="Sin movimientos por cuenta en el período." />
            )}
          </PanelCard>

          <PanelCard title="Resumen de movimientos">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { label: 'Movimientos de ingreso', value: flujoDeFondos?.filter((i) => parseFloat(i.ingreso) > 0).length || 0 },
                { label: 'Movimientos de egreso', value: flujoDeFondos?.filter((i) => parseFloat(i.egreso) > 0).length || 0 },
                { label: 'Total movimientos', value: flujoDeFondos?.length || 0 },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="text-2xl font-bold">{item.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PanelCard>
        </>
      )}
    </div>
  );
}
