import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useReporteAnalitico } from '../../hooks/useReporteAnalitico';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PanelCard } from '@/components/shared/PanelCard';
import { DataTable } from '@/components/tables/DataTable';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared/StateViews';

export function ProductAnalytics() {
  const { gerencial, loading, error, recargar, etiquetaPeriodo } = useReporteAnalitico();
  const { formatCurrency } = useReportesContext();

  const productos = gerencial?.top_productos || [];

  const totales = useMemo(() => {
    const cantidad = productos.reduce((acc, p) => acc + Number(p.total_cantidad || 0), 0);
    const ingresos = productos.reduce((acc, p) => acc + Number(p.total_ingresos || 0), 0);
    return {
      productos: productos.length,
      cantidad,
      ingresos,
      precioProm: cantidad > 0 ? ingresos / cantidad : 0,
    };
  }, [productos]);

  const datosGrafico = useMemo(
    () =>
      productos.slice(0, 10).map((p) => ({
        nombre: p.producto_nombre?.length > 18
          ? `${p.producto_nombre.substring(0, 18)}...`
          : p.producto_nombre,
        cantidad: Number(p.total_cantidad || 0),
        ingresos: Number(p.total_ingresos || 0),
      })),
    [productos]
  );

  const columns = useMemo(() => [
    { accessorKey: 'producto_nombre', header: 'Producto' },
    {
      accessorKey: 'total_cantidad',
      header: 'Cantidad',
      cell: ({ row }) => <Badge variant="secondary">{row.original.total_cantidad}</Badge>,
    },
    {
      accessorKey: 'total_ingresos',
      header: 'Ingresos netos',
      cell: ({ row }) => formatCurrency(row.original.total_ingresos),
    },
    { accessorKey: 'en_cuantas_ventas', header: 'En ventas' },
    {
      id: 'promedio',
      header: 'Precio prom. línea',
      cell: ({ row }) => {
        const c = Number(row.original.total_cantidad || 0);
        const i = Number(row.original.total_ingresos || 0);
        return formatCurrency(c > 0 ? i / c : 0);
      },
    },
  ], [formatCurrency]);

  if (loading && !gerencial) {
    return <LoadingState message="Cargando análisis de productos..." />;
  }

  if (error && !gerencial) {
    return <ErrorState message={error} onRetry={recargar} />;
  }

  if (!productos.length) {
    return (
      <div className="space-y-4">
        <EmptyState message="No hay productos vendidos en el período (excluye líneas de flete)." />
        <div className="flex justify-center">
          <Button onClick={recargar}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Productos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Top productos por cantidad vendida · {etiquetaPeriodo}
          </p>
        </div>
        <Button className="mt-3 sm:mt-0" onClick={recargar} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <MetricsGrid columns={4}>
        <MetricsCard title="Productos en ranking" value={totales.productos} color="blue" loading={loading} />
        <MetricsCard title="Unidades vendidas" value={totales.cantidad.toLocaleString('es-AR')} color="green" loading={loading} />
        <FinancialMetricsCard title="Ingresos netos (líneas)" value={totales.ingresos} formatCurrency={formatCurrency} color="purple" loading={loading} />
        <FinancialMetricsCard title="Precio promedio" value={totales.precioProm} formatCurrency={formatCurrency} color="yellow" loading={loading} />
      </MetricsGrid>

      <PanelCard title="Top 10 por cantidad">
        {datosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value, name) => [name === 'cantidad' ? value : formatCurrency(value), name === 'cantidad' ? 'Cantidad' : 'Ingresos']} />
              <Bar dataKey="cantidad" fill="#3B82F6" name="cantidad" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Sin datos para el gráfico" />
        )}
      </PanelCard>

      <PanelCard title="Detalle de productos">
        <DataTable columns={columns} data={productos} pageSize={20} />
      </PanelCard>
    </div>
  );
}
