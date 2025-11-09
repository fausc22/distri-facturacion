import { useEffect, useState } from 'react';
import { useReportesContext } from '../../context/ReportesContext';

export function GeographicAnalytics() {
  const {
    finanzasApi,
    filtros,
    formatCurrency,
    formatPercentage,
    isLoading
  } = useReportesContext();

  const [datosGeograficos, setDatosGeograficos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topClientes, setTopClientes] = useState([]);

  // ✅ Cargar datos geográficos
  useEffect(() => {
    if (filtros?.desde && filtros?.hasta) {
      cargarDatosGeograficos();
    }
  }, [filtros]);

  const cargarDatosGeograficos = async () => {
    setLoading(true);
    try {
      // Cargar ventas por ciudad
      const resultado = await finanzasApi.obtenerGananciasPorCiudad(filtros);
      
      if (resultado.success && resultado.data) {
        // Ordenar por ingresos totales descendente
        const datosOrdenados = [...resultado.data].sort((a, b) => 
          parseFloat(b.ingresos_totales || 0) - parseFloat(a.ingresos_totales || 0)
        );
        setDatosGeograficos(datosOrdenados);

        // Cargar top clientes de las ciudades principales
        await cargarTopClientes(datosOrdenados.slice(0, 3));
      }
    } catch (error) {
      console.error('Error cargando datos geográficos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTopClientes = async (ciudadesPrincipales) => {
    // Por ahora solo simularemos esto, luego puedes agregar un endpoint específico
    // Para obtener los top clientes por ciudad
    setTopClientes([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!datosGeograficos || datosGeograficos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Sin datos geográficos</h3>
          <p className="mt-1 text-sm text-gray-500">
            No hay ventas registradas con datos de ciudad en el período seleccionado
          </p>
        </div>
      </div>
    );
  }

  // Encontrar General Pico
  const generalPico = datosGeograficos.find(d => 
    d.ciudad && d.ciudad.toLowerCase().includes('general pico')
  );

  // Calcular totales
  const totales = datosGeograficos.reduce((acc, item) => ({
    ventas: acc.ventas + (parseInt(item.total_ventas) || 0),
    clientes: acc.clientes + (parseInt(item.clientes_unicos) || 0),
    ingresos: acc.ingresos + (parseFloat(item.ingresos_totales) || 0),
    ganancia: acc.ganancia + (parseFloat(item.ganancia_estimada) || 0)
  }), { ventas: 0, clientes: 0, ingresos: 0, ganancia: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📍 Análisis Geográfico</h2>
          <p className="text-sm text-gray-500 mt-1">
            Análisis de ventas por ciudad y provincia
          </p>
        </div>
        
        <button
          onClick={cargarDatosGeograficos}
          disabled={loading}
          className="mt-3 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm font-medium text-gray-600 mb-1">Ciudades Activas</div>
          <div className="text-2xl font-bold text-blue-600">{datosGeograficos.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm font-medium text-gray-600 mb-1">Ventas Totales</div>
          <div className="text-2xl font-bold text-green-600">{totales.ventas}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm font-medium text-gray-600 mb-1">Clientes Únicos</div>
          <div className="text-2xl font-bold text-purple-600">{totales.clientes}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm font-medium text-gray-600 mb-1">Ingresos Totales</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totales.ingresos)}</div>
        </div>
      </div>

      {/* Destacar General Pico */}
      {generalPico && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏆</span>
                <h3 className="text-xl font-bold text-gray-900">General Pico - Ciudad Principal</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-600">Ventas</div>
                  <div className="text-lg font-bold text-blue-600">{generalPico.total_ventas}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Clientes</div>
                  <div className="text-lg font-bold text-blue-600">{generalPico.clientes_unicos}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ingresos</div>
                  <div className="text-lg font-bold text-blue-600">{formatCurrency(generalPico.ingresos_totales)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Participación</div>
                  <div className="text-lg font-bold text-blue-600">
                    {totales.ingresos > 0 ? ((parseFloat(generalPico.ingresos_totales) / totales.ingresos) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Ciudades */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Ventas por Ciudad</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provincia
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clientes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ganancia Est.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % del Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datosGeograficos.map((ciudad, index) => {
                const esGeneralPico = ciudad.ciudad && ciudad.ciudad.toLowerCase().includes('general pico');
                const participacion = totales.ingresos > 0 
                  ? ((parseFloat(ciudad.ingresos_totales) / totales.ingresos) * 100).toFixed(1) 
                  : 0;

                return (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 ${esGeneralPico ? 'bg-blue-50 font-semibold' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                      {esGeneralPico && <span className="ml-2">🏆</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ciudad.ciudad || 'Sin especificar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {ciudad.provincia || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {ciudad.total_ventas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {ciudad.clientes_unicos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(ciudad.ingresos_totales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(ciudad.ganancia_estimada)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        parseFloat(participacion) > 20 ? 'bg-green-100 text-green-800' :
                        parseFloat(participacion) > 10 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {participacion}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">{totales.ventas}</td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">{totales.clientes}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(totales.ingresos)}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(totales.ganancia)}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}