import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, FileDown } from 'lucide-react';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';
import { axiosAuth } from '../../utils/apiClient';
import toast from '@/components/shared/toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PanelCard } from '@/components/shared/PanelCard';
import { DataTable } from '@/components/tables/DataTable';
import { ErrorState, LoadingState, EmptyState } from '@/components/shared/StateViews';

export function DashboardReportes() {
  const {
    dashboardData,
    isAnyLoading,
    cargarDashboard,
    formatCurrency,
    formatPercentage,
    error,
    lastUpdateFormatted,
    finanzasApi,
    filtros
  } = useReportesContext();

  const [generandoPDF, setGenerandoPDF] = useState(false);

  const [topProductosTabla, setTopProductosTabla] = useState(null);
  const [loadingTopProductos, setLoadingTopProductos] = useState(false);
  const [evolucionVentas, setEvolucionVentas] = useState(null);
  const [loadingEvolucion, setLoadingEvolucion] = useState(false);

  const evolucionColumns = useMemo(
    () => [
      { accessorKey: 'periodo', header: 'Período' },
      { accessorKey: 'total_ventas', header: 'Ventas' },
      {
        accessorKey: 'ingresos_totales',
        header: 'Ingresos',
        cell: ({ row }) => formatCurrency(row.original.ingresos_totales),
      },
      {
        accessorKey: 'ganancia_estimada',
        header: 'Ganancia',
        cell: ({ row }) => formatCurrency(row.original.ganancia_estimada),
      },
      {
        accessorKey: 'factura_promedio',
        header: 'Factura Prom.',
        cell: ({ row }) => formatCurrency(row.original.factura_promedio),
      },
    ],
    [formatCurrency]
  );

  const topProductosColumns = useMemo(
    () => [
      { accessorKey: 'producto_nombre', header: 'Producto' },
      {
        accessorKey: 'categoria',
        header: 'Categoría',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.categoria || 'Sin categoría'}</Badge>
        ),
      },
      {
        accessorKey: 'precio_promedio',
        header: 'Precio Promedio',
        cell: ({ row }) => formatCurrency(row.original.precio_promedio),
      },
      { accessorKey: 'cantidad_vendida', header: 'Cantidad' },
      {
        accessorKey: 'ingresos_producto',
        header: 'Ingresos',
        cell: ({ row }) => formatCurrency(row.original.ingresos_producto),
      },
      {
        accessorKey: 'ganancia_total',
        header: 'Ganancia',
        cell: ({ row }) => formatCurrency(row.original.ganancia_total),
      },
    ],
    [formatCurrency]
  );

  const empleadosColumns = useMemo(
    () => [
      {
        accessorKey: 'empleado_nombre',
        header: 'Empleado',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.empleado_nombre}</div>
            <div className="text-xs text-muted-foreground">ID: {row.original.empleado_id}</div>
          </div>
        ),
      },
      {
        accessorKey: 'total_ventas',
        header: 'Ventas',
        cell: ({ row }) => <Badge variant="info">{row.original.total_ventas} ventas</Badge>,
      },
      {
        accessorKey: 'ingresos_generados',
        header: 'Total Vendido',
        cell: ({ row }) => formatCurrency(row.original.ingresos_generados),
      },
      {
        accessorKey: 'ganancia_generada',
        header: 'Ganancia',
        cell: ({ row }) => formatCurrency(row.original.ganancia_generada),
      },
      {
        accessorKey: 'factura_promedio',
        header: 'Factura Promedio',
        cell: ({ row }) => formatCurrency(row.original.factura_promedio),
      },
      { accessorKey: 'clientes_atendidos', header: 'Clientes' },
      {
        id: 'eficiencia',
        header: 'Eficiencia %',
        cell: ({ row }) => {
          const emp = row.original;
          const eficiencia =
            emp.clientes_atendidos > 0 ? (emp.total_ventas / emp.clientes_atendidos) * 100 : 0;
          const variant =
            eficiencia >= 150 ? 'success' : eficiencia >= 100 ? 'warning' : 'destructive';
          return <Badge variant={variant}>{eficiencia.toFixed(1)}%</Badge>;
        },
      },
    ],
    [formatCurrency]
  );

  const clientesColumns = useMemo(
    () => [
      { accessorKey: 'nombre', header: 'Cliente' },
      { accessorKey: 'cantidad_ventas', header: 'Ventas' },
      {
        accessorKey: 'monto_total',
        header: 'Monto',
        cell: ({ row }) => formatCurrency(row.original.monto_total),
      },
      {
        accessorKey: 'ticket_promedio',
        header: 'Ticket',
        cell: ({ row }) => formatCurrency(row.original.ticket_promedio),
      },
    ],
    [formatCurrency]
  );

  useEffect(() => {
    if (!dashboardData) {
      cargarDashboard();
    }
  }, []);

  // ✅ Cargar top productos para tabla
  useEffect(() => {
    const cargarTopProductos = async () => {
      setLoadingTopProductos(true);
      try {
        // ✅ CORREGIDO: Pasar filtros como parámetro
        const resultado = await finanzasApi.obtenerTopProductosTabla?.(filtros) || 
                  await finanzasApi.obtenerGananciasPorProducto({ ...filtros, limite: 5 });
        if (resultado.success) {
          setTopProductosTabla(resultado.data);
        }
      } catch (error) {
        console.error('Error cargando top productos:', error);
      } finally {
        setLoadingTopProductos(false);
      }
    };

    // ✅ CORREGIDO: Solo cargar si hay filtros válidos
    if (dashboardData && filtros?.desde && filtros?.hasta) {
      cargarTopProductos();
    }
  }, [dashboardData, filtros]);

  // ✅ Cargar evolución de ventas cronológica
  useEffect(() => {
    const cargarEvolucionVentas = async () => {
      setLoadingEvolucion(true);
      try {
        // ✅ CORREGIDO: Pasar filtros como parámetro
        const resultado = await finanzasApi.obtenerGananciasDetalladas(filtros);
        if (resultado.success) {
          setEvolucionVentas(resultado.data);
        }
      } catch (error) {
        console.error('Error cargando evolución ventas:', error);
      } finally {
        setLoadingEvolucion(false);
      }
    };

    // ✅ CORREGIDO: Solo cargar si hay filtros válidos
    if (dashboardData && filtros?.desde && filtros?.hasta) {
        cargarEvolucionVentas();
      }
  }, [dashboardData, filtros]);

  // ✅ FUNCIÓN PARA GENERAR REPORTE PDF
  const generarReportePDF = async () => {
    if (!filtros?.desde || !filtros?.hasta) {
      toast.error('Por favor selecciona un período válido');
      return;
    }

    setGenerandoPDF(true);
    try {
      const response = await axiosAuth.get('/finanzas/generar-pdf-reporte', {
        params: {
          desde: filtros.desde,
          hasta: filtros.hasta
        },
        responseType: 'blob'
      });

      // Crear link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_financiero_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF. Verifica que haya datos en el período seleccionado.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  if (error && !dashboardData) {
    return <ErrorState message={error} onRetry={() => cargarDashboard()} />;
  }

  const resumen = dashboardData?.resumen?.data;
  const ejecutivo = dashboardData?.ejecutivo?.data;
  const empleados = dashboardData?.empleados?.data;
  const mejoresClientes = ejecutivo?.clientes || [];
  const cuentas = ejecutivo?.cuentas || [];

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Financiero</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Última actualización: {lastUpdateFormatted}
          </p>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row">
          <Button onClick={() => cargarDashboard()} disabled={isAnyLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isAnyLoading ? 'animate-spin' : ''}`} />
            {isAnyLoading ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button
            variant="danger"
            onClick={generarReportePDF}
            disabled={isAnyLoading || generandoPDF}
          >
            <FileDown className={`mr-2 h-4 w-4 ${generandoPDF ? 'animate-pulse' : ''}`} />
            {generandoPDF ? 'Generando PDF...' : 'Generar reporte PDF'}
          </Button>
        </div>
      </div>

      {/* ✅ KPIs Principales - Estructura corregida */}
      <MetricsGrid columns={4}>
        <FinancialMetricsCard
          title="Ingresos Totales"
          value={resumen?.ventas?.monto_total || resumen?.ventas?.ingresos_totales || 0}
          formatCurrency={formatCurrency}
          color="green"
          loading={isAnyLoading}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />

        <FinancialMetricsCard
          title="Ganancia Bruta"
          value={resumen?.ganancias?.ganancia_bruta || resumen?.ganancias?.ganancia_estimada || 0}
          formatCurrency={formatCurrency}
          color="blue"
          loading={isAnyLoading}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <MetricsCard
          title="Total Ventas"
          value={resumen?.ventas?.total_ventas || 0}
          color="purple"
          loading={isAnyLoading}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />

        <FinancialMetricsCard
          title="Factura Promedio"
          value={resumen?.ventas?.factura_promedio || 0}
          formatCurrency={formatCurrency}
          color="yellow"
          loading={isAnyLoading}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
      </MetricsGrid>

      <PanelCard title="Resumen del Período">
        {loadingEvolucion ? (
          <LoadingState message="Cargando evolución..." />
        ) : evolucionVentas?.length > 0 ? (
          <DataTable
            columns={evolucionColumns}
            data={evolucionVentas.slice(0, 10)}
            enablePagination={false}
          />
        ) : (
          <EmptyState message="No hay datos del período para mostrar" />
        )}
      </PanelCard>

      <PanelCard title="Top 5 Productos por Ganancia">
        {loadingTopProductos ? (
          <LoadingState message="Cargando productos..." />
        ) : topProductosTabla?.length > 0 ? (
          <DataTable
            columns={topProductosColumns}
            data={topProductosTabla.slice(0, 5)}
            enablePagination={false}
          />
        ) : (
          <EmptyState message="No hay productos vendidos en el período seleccionado" />
        )}
      </PanelCard>

      <PanelCard title="Performance de Empleados">
        {empleados?.length > 0 ? (
          <>
            <DataTable columns={empleadosColumns} data={empleados} pageSize={10} />
            <div className="mt-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 p-4">
              <h4 className="mb-2 text-md font-semibold">Información para Bonos y Comisiones</h4>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div className="rounded-lg bg-background p-3 shadow-sm">
                  <div className="text-muted-foreground">Total Ganancia Generada</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {formatCurrency(
                      empleados.reduce((sum, emp) => sum + parseFloat(emp.ganancia_generada || 0), 0)
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-background p-3 shadow-sm">
                  <div className="text-muted-foreground">Promedio por Venta</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(
                      empleados.reduce((sum, emp) => sum + parseFloat(emp.factura_promedio || 0), 0) /
                        empleados.length
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-background p-3 shadow-sm">
                  <div className="text-muted-foreground">Eficiencia Promedio</div>
                  <div className="text-lg font-bold text-purple-600">
                    {(
                      empleados.reduce((sum, emp) => {
                        const eff =
                          emp.clientes_atendidos > 0
                            ? (emp.total_ventas / emp.clientes_atendidos) * 100
                            : 0;
                        return sum + eff;
                      }, 0) / empleados.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState message="No hay datos de empleados en el período seleccionado" />
        )}
      </PanelCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelCard title="Mejores Clientes">
          {mejoresClientes.length > 0 ? (
            <DataTable
              columns={clientesColumns}
              data={mejoresClientes.slice(0, 8)}
              enablePagination={false}
            />
          ) : (
            <EmptyState message="Sin datos de clientes para el período." />
          )}
        </PanelCard>

        <PanelCard title="Facturación por Cuenta">
          {cuentas.length > 0 ? (
            <div className="space-y-3">
              {cuentas.map((cuenta, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md bg-muted/40 p-3"
                >
                  <div className="font-medium">{cuenta.nombre}</div>
                  <div className="font-semibold text-primary">
                    {formatCurrency(cuenta.facturacion_neta)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Sin datos por cuenta para el período." />
          )}
        </PanelCard>
      </div>

      <PanelCard title="Métricas Operativas del Negocio">
        <MetricsGrid>
          <MetricsCard
            title="Rentabilidad del Negocio"
            value={formatPercentage(resumen?.balance?.rentabilidad || 0)}
            color="green"
            size="small"
            loading={isAnyLoading}
            subtitle="Ganancia vs Ingresos"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          
          <MetricsCard
            title="Cobertura de Costos"
            value={formatPercentage(
              resumen?.balance?.ingresos_totales > 0 ? 
                (resumen?.balance?.egresos_totales / resumen?.balance?.ingresos_totales * 100) : 0
            )}
            color="yellow"
            size="small"
            loading={isAnyLoading}
            subtitle="Egresos vs Ingresos"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </MetricsGrid>
      </PanelCard>

      
      
    </div>
  );
}