import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePeriodoReportes } from '../../hooks/usePeriodoReportes';
import { useReportesContext } from '../../context/ReportesContext';
import {
  useResumenFinancieroQuery,
  useResumenPorCuentaQuery,
} from '../../hooks/queries/finanzasQueries';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/shared/PanelCard';
import { DataTable } from '@/components/tables/DataTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateViews';

export function ResultadoNeto() {
  const { rango, etiquetaPeriodo } = usePeriodoReportes();
  const { formatCurrency, formatPercentage } = useReportesContext();
  const filtros = useMemo(
    () => ({ desde: rango.desde, hasta: rango.hasta }),
    [rango.desde, rango.hasta]
  );

  const resumenQuery = useResumenFinancieroQuery(filtros);
  const porCuentaQuery = useResumenPorCuentaQuery(filtros);

  const resumen = resumenQuery.data;
  const porCuenta = porCuentaQuery.data?.data ?? [];
  const loading = resumenQuery.isFetching || porCuentaQuery.isFetching;
  const error = resumenQuery.error?.message || porCuentaQuery.error?.message || null;

  const recargar = () => {
    resumenQuery.refetch();
    porCuentaQuery.refetch();
  };

  const columnasCuenta = useMemo(
    () => [
      { accessorKey: 'cuenta', header: 'Cuenta' },
      {
        accessorKey: 'ingresos',
        header: 'Ingresos (ventas)',
        cell: ({ row }) => formatCurrency(row.original.ingresos),
      },
      {
        accessorKey: 'compras',
        header: 'Compras',
        cell: ({ row }) => formatCurrency(row.original.compras),
      },
      {
        accessorKey: 'gastos',
        header: 'Gastos',
        cell: ({ row }) => formatCurrency(row.original.gastos),
      },
      {
        accessorKey: 'egresos',
        header: 'Egresos',
        cell: ({ row }) => formatCurrency(row.original.egresos),
      },
      {
        accessorKey: 'resultado',
        header: 'Resultado',
        cell: ({ row }) => formatCurrency(row.original.resultado),
      },
    ],
    [formatCurrency]
  );

  if (loading && !resumen) {
    return <LoadingState message="Cargando resultado neto..." />;
  }

  if (error && !resumen) {
    return <ErrorState message={error} onRetry={recargar} />;
  }

  if (!resumen) {
    return <EmptyState message="No hay datos financieros en el período seleccionado." />;
  }

  const ventas = resumen.ventas || {};
  const egresos = resumen.egresos || {};
  const ganancias = resumen.ganancias || {};
  const resultado = resumen.resultado || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resultado Neto</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresos facturados menos compras y gastos operativos · {etiquetaPeriodo}
          </p>
        </div>
        <Button className="mt-3 sm:mt-0" onClick={recargar} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <MetricsGrid columns={4}>
        <FinancialMetricsCard
          title="Ingresos (ventas)"
          value={ventas.monto_total || 0}
          formatCurrency={formatCurrency}
          color="green"
          loading={loading}
        />
        <FinancialMetricsCard
          title="Egresos totales"
          value={egresos.total || 0}
          formatCurrency={formatCurrency}
          color="red"
          loading={loading}
        />
        <FinancialMetricsCard
          title="Resultado neto"
          value={resultado.resultado_neto || 0}
          formatCurrency={formatCurrency}
          color="blue"
          loading={loading}
        />
        <MetricsCard
          title="Rentabilidad"
          value={formatPercentage(resultado.rentabilidad || 0)}
          color="purple"
          loading={loading}
        />
      </MetricsGrid>

      <MetricsGrid columns={4}>
        <FinancialMetricsCard
          title="Compras"
          value={egresos.compras?.monto || 0}
          formatCurrency={formatCurrency}
          color="blue"
          loading={loading}
        />
        <FinancialMetricsCard
          title="Gastos operativos"
          value={egresos.gastos?.monto || 0}
          formatCurrency={formatCurrency}
          color="red"
          loading={loading}
        />
        <FinancialMetricsCard
          title="Ganancia bruta"
          value={ganancias.ganancia_bruta || 0}
          formatCurrency={formatCurrency}
          color="green"
          loading={loading}
        />
        <FinancialMetricsCard
          title="Ganancia neta"
          value={ganancias.ganancia_neta || 0}
          formatCurrency={formatCurrency}
          color="blue"
          loading={loading}
        />
      </MetricsGrid>

      <PanelCard title="Detalle por cuenta">
        {porCuenta.length > 0 ? (
          <DataTable columns={columnasCuenta} data={porCuenta} pageSize={10} />
        ) : (
          <EmptyState message="Sin movimientos por cuenta en el período." />
        )}
      </PanelCard>
    </div>
  );
}

export default ResultadoNeto;
