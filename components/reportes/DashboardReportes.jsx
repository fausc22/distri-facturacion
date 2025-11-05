import { useEffect, useState } from 'react';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';

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

  const [topProductosTabla, setTopProductosTabla] = useState(null);
  const [loadingTopProductos, setLoadingTopProductos] = useState(false);
  const [evolucionVentas, setEvolucionVentas] = useState(null);
  const [loadingEvolucion, setLoadingEvolucion] = useState(false);

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

  // ✅ FUNCIÓN PARA MOSTRAR TOAST
  const mostrarToast = (mensaje) => {
    // Si tienes una librería de toast como react-hot-toast, react-toastify, etc.
    // toast.info(mensaje);
    
    // Si no tienes una librería, puedes usar alert temporalmente
    alert(mensaje);
    
    // O crear un toast personalizado simple
    console.log('Toast:', mensaje);
  };

  // ✅ FUNCIÓN PARA GENERAR REPORTE PDF
  const generarReportePDF = () => {
    mostrarToast("Funcionalidad en proceso..");
  };

  if (error && !dashboardData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error cargando dashboard</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => cargarDashboard()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const resumen = dashboardData?.resumen?.data;
  const empleados = dashboardData?.empleados?.data;

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h2>
          <p className="text-sm text-gray-500 mt-1">
            Última actualización: {lastUpdateFormatted}
          </p>
        </div>
        
        {/* ✅ BOTONES DE ACCIÓN */}
        <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => cargarDashboard()}
            disabled={isAnyLoading}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg 
              className={`w-4 h-4 ${isAnyLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isAnyLoading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          <button
            onClick={generarReportePDF}
            disabled={isAnyLoading}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>GENERAR REPORTE PDF</span>
          </button>
        </div>
      </div>

      {/* ✅ KPIs Principales */}
      <MetricsGrid columns={4}>
        <FinancialMetricsCard
          title="Ingresos Totales"
          value={resumen?.ventas?.ingresos_totales || 0}
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
          title="Ganancia Estimada"
          value={resumen?.ganancias?.ganancia_estimada || 0}
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

      {/* ✅ RESUMEN DEL PERÍODO - REEMPLAZA EVOLUCIÓN */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen del Período</h3>
        
        {loadingEvolucion ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : evolucionVentas && evolucionVentas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Factura Prom.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evolucionVentas.slice(0, 10).map((periodo, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {periodo.periodo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {periodo.total_ventas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                      {formatCurrency(periodo.ingresos_totales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                      {formatCurrency(periodo.ganancia_estimada)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(periodo.factura_promedio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No hay datos del período para mostrar</p>
          </div>
        )}
      </div>

      {/* ✅ TOP 5 PRODUCTOS - TABLA INFORMATIVA */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top 5 Productos por Ganancia</h3>
        
        {loadingTopProductos ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : topProductosTabla && topProductosTabla.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Promedio</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProductosTabla.slice(0, 5).map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {producto.producto_nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {producto.categoria || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(producto.precio_promedio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {parseInt(producto.cantidad_vendida || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                      {formatCurrency(producto.ingresos_producto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                      {formatCurrency(producto.ganancia_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No hay productos vendidos en el período seleccionado</p>
          </div>
        )}
      </div>

      {/* ✅ PERFORMANCE DE EMPLEADOS - TABLA DETALLADA */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance de Empleados</h3>
        
        {empleados && empleados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas Realizadas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Vendido</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia Generada</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Factura Promedio</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes Atendidos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Eficiencia %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empleados.map((empleado, index) => {
                  const eficiencia = empleado.clientes_atendidos > 0 ? 
                    (empleado.total_ventas / empleado.clientes_atendidos * 100) : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {empleado.empleado_nombre}
                          </div>
                          <div className="text-xs text-blue-600">
                            ID: {empleado.empleado_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {empleado.total_ventas} ventas
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        {formatCurrency(empleado.ingresos_generados)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                        {formatCurrency(empleado.ganancia_generada)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(empleado.factura_promedio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {empleado.clientes_atendidos || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          eficiencia >= 150 
                            ? 'bg-green-100 text-green-800'
                            : eficiencia >= 100
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {eficiencia.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ✅ INFORMACIÓN PARA BONOS Y COMISIONES */}
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-2">📊 Información para Bonos y Comisiones</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-gray-600">Total Ganancia Generada</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(empleados.reduce((sum, emp) => sum + parseFloat(emp.ganancia_generada || 0), 0))}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-gray-600">Promedio por Venta</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(empleados.reduce((sum, emp) => sum + parseFloat(emp.factura_promedio || 0), 0) / empleados.length)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-gray-600">Eficiencia Promedio</div>
                  <div className="text-lg font-bold text-purple-600">
                    {(empleados.reduce((sum, emp) => {
                      const eff = emp.clientes_atendidos > 0 ? (emp.total_ventas / emp.clientes_atendidos * 100) : 0;
                      return sum + eff;
                    }, 0) / empleados.length).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No hay datos de empleados en el período seleccionado</p>
          </div>
        )}
      </div>

      {/* ✅ MÉTRICAS OPERATIVAS ÚTILES - REEMPLAZA MÉTRICAS ADICIONALES */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas Operativas del Negocio</h3>
        
        <MetricsGrid columns={4}>
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
      </div>

      
      
    </div>
  );
}