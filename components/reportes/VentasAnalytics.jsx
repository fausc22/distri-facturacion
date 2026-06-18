import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useReporteAnalitico } from '../../hooks/useReporteAnalitico';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PanelCard } from '@/components/shared/PanelCard';
import { DataTable } from '@/components/tables/DataTable';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared/StateViews';

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatearMes = (yyyymm) => {
  if (!yyyymm) return '-';
  const [y, m] = String(yyyymm).split('-');
  const idx = parseInt(m, 10) - 1;
  return idx >= 0 && idx < 12 ? `${MESES_ES[idx]} ${y}` : yyyymm;
};

export function VentasAnalytics() {
  const { gerencial, loading, error, recargar, etiquetaPeriodo } = useReporteAnalitico();
  const { formatCurrency } = useReportesContext();

  const resumen = gerencial?.resumen || {};
  const ventasPorMes = gerencial?.ventas_por_mes || [];
  const vendedores = gerencial?.vendedores || [];

  const totales = useMemo(() => ({
    facturado: resumen.total_facturado_sin_fletes || 0,
    ventas: resumen.cantidad_ventas_sin_fletes || 0,
    ticket: resumen.ticket_promedio_sin_fletes || 0,
    facturadoGlobal: resumen.total_facturado_global || 0,
  }), [resumen]);

  const evolucionColumns = useMemo(() => [
    {
      accessorKey: 'mes',
      header: 'Período',
      cell: ({ row }) => formatearMes(row.original.mes),
    },
    {
      accessorKey: 'cantidad_ventas',
      header: 'Ventas',
      cell: ({ row }) => <Badge variant="info">{row.original.cantidad_ventas}</Badge>,
    },
    {
      accessorKey: 'total_facturado',
      header: 'Facturado (sin fletes)',
      cell: ({ row }) => formatCurrency(row.original.total_facturado),
    },
    {
      id: 'ticket',
      header: 'Ticket prom.',
      cell: ({ row }) => {
        const v = row.original.cantidad_ventas > 0
          ? row.original.total_facturado / row.original.cantidad_ventas
          : 0;
        return formatCurrency(v);
      },
    },
  ], [formatCurrency]);

  const vendedoresColumns = useMemo(() => [
    { accessorKey: 'vendedor', header: 'Vendedor' },
    {
      accessorKey: 'cantidad_ventas',
      header: 'Ventas',
      cell: ({ row }) => <Badge variant="info">{row.original.cantidad_ventas}</Badge>,
    },
    {
      accessorKey: 'total_vendido',
      header: 'Total facturado',
      cell: ({ row }) => formatCurrency(row.original.total_vendido),
    },
    {
      accessorKey: 'ticket_promedio',
      header: 'Ticket promedio',
      cell: ({ row }) => formatCurrency(row.original.ticket_promedio),
    },
    { accessorKey: 'primera_venta', header: 'Primera venta' },
    { accessorKey: 'ultima_venta', header: 'Última venta' },
  ], [formatCurrency]);

  if (loading && !gerencial) {
    return <LoadingState message="Cargando análisis de ventas..." />;
  }

  if (error && !gerencial) {
    return <ErrorState message={error} onRetry={recargar} />;
  }

  const sinDatos = ventasPorMes.length === 0 && vendedores.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Ventas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Facturación real por mes y vendedor · {etiquetaPeriodo}
          </p>
        </div>
        <Button className="mt-3 sm:mt-0" onClick={recargar} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {sinDatos ? (
        <EmptyState message="No hay ventas facturadas en el período seleccionado." />
      ) : (
        <>
          <MetricsGrid columns={4}>
            <FinancialMetricsCard
              title="Facturación (sin fletes)"
              value={totales.facturado}
              formatCurrency={formatCurrency}
              color="green"
              loading={loading}
            />
            <MetricsCard title="Cantidad de ventas" value={totales.ventas} color="blue" loading={loading} />
            <FinancialMetricsCard
              title="Ticket promedio"
              value={totales.ticket}
              formatCurrency={formatCurrency}
              color="amber"
              loading={loading}
            />
            <FinancialMetricsCard
              title="Facturación total"
              value={totales.facturadoGlobal}
              formatCurrency={formatCurrency}
              color="purple"
              loading={loading}
            />
          </MetricsGrid>

          <PanelCard title="Evolución mensual (sin ventas con flete)">
            <DataTable columns={evolucionColumns} data={ventasPorMes} pageSize={12} />
          </PanelCard>

          <PanelCard title="Performance por vendedor">
            <DataTable columns={vendedoresColumns} data={vendedores} pageSize={15} />
          </PanelCard>
        </>
      )}
    </div>
  );
}
