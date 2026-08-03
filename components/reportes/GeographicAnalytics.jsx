import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useReporteAnalitico } from '../../hooks/useReporteAnalitico';
import { useReportesContext } from '../../context/ReportesContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PanelCard } from '@/components/shared/PanelCard';
import { DataTable } from '@/components/tables/DataTable';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared/StateViews';

export function GeographicAnalytics() {
  const { gerencial, loading, error, recargar, etiquetaPeriodo } = useReporteAnalitico();
  const { formatCurrency } = useReportesContext();

  const ciudades = gerencial?.top_ciudades || [];

  const totales = useMemo(
    () =>
      ciudades.reduce(
        (acc, item) => ({
          ventas: acc.ventas + Number(item.cantidad_ventas || 0),
          clientes: acc.clientes + Number(item.clientes_unicos || 0),
          facturado: acc.facturado + Number(item.total_facturado || 0),
        }),
        { ventas: 0, clientes: 0, facturado: 0 }
      ),
    [ciudades]
  );

  const generalPico = ciudades.find(
    (d) => d.ciudad && d.ciudad.toLowerCase().includes('general pico')
  );

  const columns = useMemo(
    () => [
      {
        id: 'rank',
        header: '#',
        cell: ({ row }) => {
          const esGP = row.original.ciudad?.toLowerCase().includes('general pico');
          return <span>{row.index + 1}{esGP ? ' 🏆' : ''}</span>;
        },
      },
      { accessorKey: 'ciudad', header: 'Ciudad' },
      { accessorKey: 'provincia', header: 'Provincia' },
      { accessorKey: 'cantidad_ventas', header: 'Ventas' },
      { accessorKey: 'clientes_unicos', header: 'Clientes' },
      {
        accessorKey: 'total_facturado',
        header: 'Facturado',
        cell: ({ row }) => formatCurrency(row.original.total_facturado),
      },
      {
        id: 'participacion',
        header: '% del total',
        cell: ({ row }) => {
          const pct = totales.facturado > 0
            ? ((Number(row.original.total_facturado) / totales.facturado) * 100).toFixed(1)
            : 0;
          return <Badge variant={parseFloat(pct) > 20 ? 'success' : 'secondary'}>{pct}%</Badge>;
        },
      },
    ],
    [formatCurrency, totales.facturado]
  );

  if (loading && !gerencial) {
    return <LoadingState message="Cargando análisis geográfico..." />;
  }

  if (error && !gerencial) {
    return <ErrorState message={error} onRetry={recargar} />;
  }

  if (!ciudades.length) {
    return (
      <div className="space-y-4">
        <EmptyState message="No hay ventas con ciudad registrada en el período." />
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
          <h2 className="text-2xl font-bold">Análisis Geográfico</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Facturación por ciudad y provincia · {etiquetaPeriodo}
          </p>
        </div>
        <Button className="mt-3 sm:mt-0" onClick={recargar} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Ciudades', value: ciudades.length },
          { label: 'Ventas', value: totales.ventas },
          { label: 'Clientes únicos', value: totales.clientes },
          { label: 'Facturado', value: formatCurrency(totales.facturado) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{kpi.label}</div>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {generalPico && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <Badge variant="info" className="mb-2">Ciudad principal</Badge>
            <h3 className="text-xl font-bold">General Pico</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div><div className="text-sm text-muted-foreground">Ventas</div><div className="font-bold">{generalPico.cantidad_ventas}</div></div>
              <div><div className="text-sm text-muted-foreground">Clientes</div><div className="font-bold">{generalPico.clientes_unicos}</div></div>
              <div><div className="text-sm text-muted-foreground">Facturado</div><div className="font-bold">{formatCurrency(generalPico.total_facturado)}</div></div>
              <div>
                <div className="text-sm text-muted-foreground">Participación</div>
                <div className="font-bold">
                  {totales.facturado > 0
                    ? ((Number(generalPico.total_facturado) / totales.facturado) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PanelCard title="Ventas por ciudad">
        <DataTable columns={columns} data={ciudades} pageSize={20} />
      </PanelCard>
    </div>
  );
}
