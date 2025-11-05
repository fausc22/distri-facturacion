import { useEffect, useState } from 'react';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';

export function VentasAnalytics() {
  const {
    cargarDatos,
    isLoading,
    formatCurrency,
    formatPercentage,
    filtros
  } = useReportesContext();

  const [datosVentas, setDatosVentas] = useState({
    gananciasDetalladas: null,
    gananciasPorEmpleado: null,
    gananciasPorProducto: null,
    totales: null
  });

  // Cargar datos cuando cambie el componente o filtros
  useEffect(() => {
    cargarDatosVentas();
  }, [filtros]);

  const cargarDatosVentas = async () => {
    try {
      const [ganancias, empleados, productos] = await Promise.all([
        cargarDatos('gananciasDetalladas'),
        cargarDatos('gananciasPorEmpleado'),
        cargarDatos('gananciasPorProducto')
      ]);

      setDatosVentas({
        gananciasDetalladas: ganancias.success ? ganancias.data : null,
        gananciasPorEmpleado: empleados.success ? empleados.data : null,
        gananciasPorProducto: productos.success ? productos.data : null,
        totales: ganancias.success ? ganancias.totales : null
      });
    } catch (error) {
      console.error('Error cargando datos de ventas:', error);
    }
  };

  const { 
    gananciasDetalladas, 
    gananciasPorEmpleado, 
    gananciasPorProducto, 
    totales 
  } = datosVentas;

  const isLoadingAny = isLoading('gananciasDetalladas') || 
                      isLoading('gananciasPorEmpleado') || 
                      isLoading('gananciasPorProducto');

  // ✅ Calcular métricas corregidas
  const ticketPromedio = totales?.total_ventas > 0 ? 
    totales.ingresos_totales / totales.total_ventas : 0;

  const margenPromedio = totales?.ingresos_totales > 0 ? 
    (totales.ganancia_estimada / totales.ingresos_totales) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análisis de Ventas</h2>
          <p className="text-sm text-gray-500 mt-1">
            Performance detallado de ventas, empleados y productos
          </p>
        </div>
        
        <button
          onClick={cargarDatosVentas}
          disabled={isLoadingAny}
          className="mt-3 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg 
            className={`w-4 h-4 ${isLoadingAny ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isLoadingAny ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* ✅ KPIs de Ventas CORREGIDOS */}
      <MetricsGrid columns={4}>
        <FinancialMetricsCard
          title="Ingresos del Período"
          value={totales?.ingresos_totales || 0}
          formatCurrency={formatCurrency}
          color="green"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />

        <FinancialMetricsCard
          title="Ganancia Total"
          value={totales?.ganancia_estimada || 0}
          formatCurrency={formatCurrency}
          color="blue"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <MetricsCard
          title="Total de Ventas"
          value={totales?.total_ventas || 0}
          color="purple"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <FinancialMetricsCard
          title="Factura Promedio"
          value={ticketPromedio}
          formatCurrency={formatCurrency}
          color="yellow"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
      </MetricsGrid>

      {/* ✅ EVOLUCIÓN TEMPORAL - TABLA CRONOLÓGICA */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución de Ventas - Cronológico</h3>
        
        {isLoadingAny ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : gananciasDetalladas && gananciasDetalladas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Factura Prom.</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rentabilidad</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gananciasDetalladas.map((periodo, index) => {
                  const rentabilidad = periodo.ingresos_totales > 0 ? 
                    (periodo.ganancia_estimada / periodo.ingresos_totales * 100) : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {periodo.periodo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {periodo.total_ventas}
                        </span>
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          rentabilidad >= 25 
                            ? 'bg-green-100 text-green-800'
                            : rentabilidad >= 15
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(rentabilidad)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No hay datos de evolución temporal disponibles</p>
          </div>
        )}
      </div>

      {/* ✅ EMPLEADOS - TABLA CON MÉTRICAS DETALLADAS PARA COMISIONES */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Performance de Empleados 
        </h3>
        
        {gananciasPorEmpleado && gananciasPorEmpleado.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Vendido</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia Generada</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Factura Promedio</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión Sugerida</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gananciasPorEmpleado.map((empleado, index) => {
                  const comisionSugerida = parseFloat(empleado.ganancia_generada || 0) * 0.05; // 5% de la ganancia
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {empleado.empleado_nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {empleado.empleado_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {empleado.total_ventas}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                        {formatCurrency(comisionSugerida)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ✅ RESUMEN PARA COMISIONES */}
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-2">💰 Resumen para Comisiones y Bonos</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-gray-600">Total Comisiones (5%)</div>
                  <div className="text-lg font-bold text-purple-600">
                    {formatCurrency(gananciasPorEmpleado.reduce((sum, emp) => 
                      sum + (parseFloat(emp.ganancia_generada || 0) * 0.05), 0))}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-gray-600">Ganancia Neta Post-Comisión</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(gananciasPorEmpleado.reduce((sum, emp) => 
                      sum + (parseFloat(emp.ganancia_generada || 0) * 0.95), 0))}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-gray-600">Empleado Top</div>
                  <div className="text-lg font-bold text-blue-600">
                    {gananciasPorEmpleado[0]?.empleado_nombre?.split(' ')[0] || 'N/A'}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-gray-600">Productividad Promedio</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formatCurrency(gananciasPorEmpleado.reduce((sum, emp) => 
                      sum + parseFloat(emp.ingresos_generados || 0), 0) / gananciasPorEmpleado.length)}
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
            <p className="mt-2 text-sm text-gray-500">No hay datos de empleados</p>
          </div>
        )}
      </div>

      {/* ✅ TOP PRODUCTOS - TABLA MEJORADA CON PRECIO */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top Productos por Ganancia
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Vendida
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Promedio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ganancia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gananciasPorProducto?.slice(0, 10).map((producto, index) => (
                <tr key={producto.producto_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {producto.producto_nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {producto.producto_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {producto.cantidad_total_vendida}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                    {formatCurrency(producto.precio_promedio)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                    {formatCurrency(producto.ingresos_producto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                    {formatCurrency(producto.ganancia_estimada)}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {isLoadingAny ? 'Cargando productos...' : 'No hay datos de productos'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ RESUMEN DE MÉTRICAS OPERATIVAS */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen Operativo del Período</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Empleados Activos</div>
                <div className="text-2xl font-bold text-gray-900">
                  {gananciasPorEmpleado?.length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Productos Vendidos</div>
                <div className="text-2xl font-bold text-gray-900">
                  {gananciasPorProducto?.length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Períodos Analizados</div>
                <div className="text-2xl font-bold text-gray-900">
                  {gananciasDetalladas?.length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Rentabilidad Promedio</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercentage(margenPromedio)}
                </div>
              </div>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
}