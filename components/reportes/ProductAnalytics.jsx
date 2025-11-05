import { useEffect, useState } from 'react';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function ProductAnalytics() {
  const {
    cargarDatos,
    isLoading,
    formatCurrency,
    formatPercentage,
    filtros
  } = useReportesContext();

  const [datosProductos, setDatosProductos] = useState({
    productosMasRentables: null,
    productosMasVendidos: null,
    gananciasPorProducto: null
  });

  // Estados para tabla filtrable
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [displayData, setDisplayData] = useState([]);

  // Cargar datos cuando cambie el componente o filtros
  useEffect(() => {
    cargarDatosProductos();
  }, [filtros]);

  const cargarDatosProductos = async () => {
    try {
      const [rentables, vendidos, ganancias] = await Promise.all([
        cargarDatos('productosMasRentables'),
        cargarDatos('productosMasVendidos'),
        cargarDatos('gananciasPorProducto')
      ]);

      setDatosProductos({
        productosMasRentables: rentables.success ? rentables.data : null,
        productosMasVendidos: vendidos.success ? vendidos.data : null,
        gananciasPorProducto: ganancias.success ? ganancias.data : null
      });
    } catch (error) {
      console.error('Error cargando datos de productos:', error);
    }
  };

  const { 
    productosMasRentables, 
    productosMasVendidos, 
    gananciasPorProducto 
  } = datosProductos;

  const isLoadingAny = isLoading('productosMasRentables') || 
                      isLoading('productosMasVendidos') || 
                      isLoading('gananciasPorProducto');

  // ✅ FUNCIONALIDAD DE ORDENAMIENTO
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // ✅ ORDENAR DATOS
  useEffect(() => {
    if (gananciasPorProducto && gananciasPorProducto.length > 0) {
      let sortedData = [...gananciasPorProducto];
      
      if (sortConfig.key) {
        sortedData.sort((a, b) => {
          let aValue = a[sortConfig.key];
          let bValue = b[sortConfig.key];
          
          // Convertir a números si es necesario
          if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
          }
          
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
      
      // ✅ TOP 20 PRODUCTOS
      setDisplayData(sortedData.slice(0, 20));
    }
  }, [gananciasPorProducto, sortConfig]);

  // Calcular métricas generales
  const totalProductosVendidos = gananciasPorProducto?.length || 0;
  const totalCantidadVendida = gananciasPorProducto?.reduce((acc, item) => 
    acc + (parseInt(item.cantidad_total_vendida) || 0), 0) || 0;
  const totalIngresosPorProductos = gananciasPorProducto?.reduce((acc, item) => 
    acc + (parseFloat(item.ingresos_producto) || 0), 0) || 0;
  const totalGananciaPorProductos = gananciasPorProducto?.reduce((acc, item) => 
  acc + (parseFloat(item.ganancia_estimada) || 0), 0) || 0;

  // Calcular precio promedio general
  const precioPromedioGeneral = totalCantidadVendida > 0 ? 
    totalIngresosPorProductos / totalCantidadVendida : 0;

  // ✅ DATOS PARA GRÁFICO DE DISTRIBUCIÓN DE GANANCIAS
  const prepararDatosGrafico = () => {
    if (!gananciasPorProducto || gananciasPorProducto.length === 0) return [];
    
    // Top 10 para el gráfico de barras
    return gananciasPorProducto
      .slice(0, 10)
      .map(producto => ({
        nombre: producto.producto_nombre.length > 15 ? 
          producto.producto_nombre.substring(0, 15) + '...' : 
          producto.producto_nombre,
        ganancia: parseFloat(producto.ganancia_estimada || 0),
        ingresos: parseFloat(producto.ingresos_producto || 0),
        cantidad: parseInt(producto.cantidad_total_vendida || 0)
      }));
  };

  // ✅ DATOS PARA GRÁFICO DE CATEGORÍAS DE RENTABILIDAD
  const prepararDatosPie = () => {
    if (!gananciasPorProducto || gananciasPorProducto.length === 0) return [];
    
    const categorias = {
      excelente: 0,
      bueno: 0,
      regular: 0,
      revisar: 0
    };
    
    gananciasPorProducto.forEach(producto => {
      const gananciaUnitaria = producto.cantidad_total_vendida > 0 ? 
        producto.ganancia_estimada / producto.cantidad_total_vendida : 0;
      
      if (gananciaUnitaria > 50000) categorias.excelente++;
      else if (gananciaUnitaria > 20000) categorias.bueno++;
      else if (gananciaUnitaria > 0) categorias.regular++;
      else categorias.revisar++;
    });
    
    return [
      { name: 'Excelente', value: categorias.excelente, color: '#10B981' },
      { name: 'Bueno', value: categorias.bueno, color: '#F59E0B' },
      { name: 'Regular', value: categorias.regular, color: '#3B82F6' },
      { name: 'Revisar', value: categorias.revisar, color: '#EF4444' }
    ].filter(item => item.value > 0);
  };

  const datosGrafico = prepararDatosGrafico();
  const datosPie = prepararDatosPie();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análisis de Productos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Performance detallado de productos por rentabilidad y ventas
          </p>
        </div>
        
        <button
          onClick={cargarDatosProductos}
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

      {/* ✅ KPIs de Productos SIMPLIFICADOS */}
      <MetricsGrid columns={4}>
        <MetricsCard
          title="Productos Analizados"
          value={totalProductosVendidos}
          color="blue"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <MetricsCard
          title="Unidades Vendidas"
          value={totalCantidadVendida.toLocaleString()}
          color="green"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />

        <FinancialMetricsCard
          title="Ingresos Totales"
          value={totalIngresosPorProductos}
          formatCurrency={formatCurrency}
          color="purple"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />

        <FinancialMetricsCard
          title="Precio Promedio"
          value={precioPromedioGeneral}
          formatCurrency={formatCurrency}
          color="yellow"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
      </MetricsGrid>

      {/* ✅ GRÁFICOS RELEVANTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Top 10 por Ganancia */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top 10 Productos por Ganancia
          </h3>
          
          {isLoadingAny ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ) : datosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value), 
                    name === 'ganancia' ? 'Ganancia' : 'Ingresos'
                  ]}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="ganancia" fill="#8B5CF6" name="ganancia" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No hay datos suficientes para el gráfico
            </div>
          )}
        </div>

        {/* Gráfico de Pie - Distribución por Rentabilidad */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribución por Nivel de Rentabilidad
          </h3>
          
          {isLoadingAny ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ) : datosPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {datosPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No hay datos suficientes para el gráfico
            </div>
          )}
          
          {/* Leyenda personalizada */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {datosPie.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span>{item.name}: {item.value} productos</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ ANÁLISIS DETALLADO - TOP 20 CON COLUMNAS FILTRABLES */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Top 20 Productos - Análisis Detallado
          </h3>
          <div className="text-sm text-gray-500">
            Haz clic en las columnas para ordenar ↕️
          </div>
        </div>
        
        {isLoadingAny ? (
          <div className="animate-pulse space-y-4">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : displayData && displayData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('producto_nombre')}
                  >
                    <div className="flex items-center">
                      Producto
                      {getSortIcon('producto_nombre')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('precio_promedio')}
                  >
                    <div className="flex items-center justify-end">
                      Precio
                      {getSortIcon('precio_promedio')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('cantidad_total_vendida')}
                  >
                    <div className="flex items-center justify-end">
                      Cantidad
                      {getSortIcon('cantidad_total_vendida')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('veces_vendido')}
                  >
                    <div className="flex items-center justify-end">
                      Veces Vendido
                      {getSortIcon('veces_vendido')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ingresos_producto')}
                  >
                    <div className="flex items-center justify-end">
                      Ingresos
                      {getSortIcon('ingresos_producto')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ganancia_estimada')}
                  >
                    <div className="flex items-center justify-end">
                      Ganancia
                      {getSortIcon('ganancia_estimada')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.map((producto, index) => {
                  const gananciaUnitaria = producto.cantidad_total_vendida > 0 ? 
                    producto.ganancia_estimada / producto.cantidad_total_vendida : 0;
                  
                  return (
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                        {formatCurrency(producto.precio_promedio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {producto.cantidad_total_vendida}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {producto.veces_vendido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        {formatCurrency(producto.ingresos_producto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                        {formatCurrency(producto.ganancia_estimada)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          gananciaUnitaria > 50000 
                            ? 'bg-green-100 text-green-800'
                            : gananciaUnitaria > 20000
                            ? 'bg-yellow-100 text-yellow-800'
                            : gananciaUnitaria > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {gananciaUnitaria > 50000 ? 'Excelente' : 
                           gananciaUnitaria > 20000 ? 'Bueno' : 
                           gananciaUnitaria > 0 ? 'Regular' : 'Revisar'}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No hay datos detallados de productos</p>
          </div>
        )}
      </div>

      {/* ✅ RESUMEN OPERATIVO DE PRODUCTOS */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen Operativo de Productos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Producto Top</div>
                <div className="text-lg font-bold text-gray-900">
                  {gananciasPorProducto?.[0]?.producto_nombre?.substring(0, 15) || 'N/A'}...
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Más Vendido</div>
                <div className="text-lg font-bold text-gray-900">
                  {productosMasVendidos?.[0]?.producto_nombre?.substring(0, 15) || 'N/A'}...
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Ganancia Total</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalGananciaPorProductos)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Ganancia Unitaria Prom.</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalCantidadVendida > 0 ? totalGananciaPorProductos / totalCantidadVendida : 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </div>

      
    </div>
  );
}