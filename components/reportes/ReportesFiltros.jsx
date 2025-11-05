import { useState, useEffect } from 'react';
import { useReportesContext } from '../../context/ReportesContext';

export function ReportesFiltros({ onFiltrosChange, empleados = [], ciudades = [] }) {
  const { 
    filtros, 
    updateFiltros, 
    limpiarFiltros, 
    setPeriodoPredefinido,
    periodosPredefinidos,
    mostrarFiltros,
    setMostrarFiltros,
    validarFiltros,
    formatearPeriodo,
    diasEnPeriodo
  } = useReportesContext();

  const [filtrosLocales, setFiltrosLocales] = useState(filtros);

  // Sincronizar filtros locales con el context
  useEffect(() => {
    setFiltrosLocales(filtros);
  }, [filtros]);

  // Aplicar filtros
  const aplicarFiltros = () => {
    if (validarFiltros()) {
      updateFiltros(filtrosLocales);
      if (onFiltrosChange) {
        onFiltrosChange(filtrosLocales);
      }
    }
  };

  // Manejar cambio en filtros locales
  const handleFiltroChange = (key, value) => {
    const nuevosFiltros = { ...filtrosLocales, [key]: value };
    setFiltrosLocales(nuevosFiltros);
  };

  // Aplicar período predefinido
  const handlePeriodoPredefinido = (periodo) => {
    setPeriodoPredefinido(periodo);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header de filtros */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg 
                className={`w-5 h-5 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-medium">Filtros y Período</span>
            </button>
            
            {/* Información del período actual */}
            <div className="ml-4 hidden sm:block">
              <span className="text-sm text-gray-500">
                {formatearPeriodo} ({diasEnPeriodo} días)
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={limpiarFiltros}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={aplicarFiltros}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de filtros */}
      {mostrarFiltros && (
        <div className="p-4 space-y-4">
          {/* Períodos predefinidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Períodos Rápidos
            </label>
            <div className="flex flex-wrap gap-2">
              {periodosPredefinidos.map((periodo) => (
                <button
                  key={periodo.key}
                  onClick={() => handlePeriodoPredefinido(periodo.key)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  {periodo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros de fecha personalizados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtrosLocales.desde}
                onChange={(e) => handleFiltroChange('desde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtrosLocales.hasta}
                onChange={(e) => handleFiltroChange('hasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={filtrosLocales.periodo}
                onChange={(e) => handleFiltroChange('periodo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="diario">Diario</option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          {/* Filtros adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por empleado */}
            {empleados.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empleado
                </label>
                <select
                  value={filtrosLocales.empleado_id}
                  onChange={(e) => handleFiltroChange('empleado_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los empleados</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por ciudad */}
            {ciudades.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <select
                  value={filtrosLocales.ciudad}
                  onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las ciudades</option>
                  {ciudades.map((ciudad, index) => (
                    <option key={index} value={ciudad}>
                      {ciudad}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Límite de resultados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Límite de Resultados
              </label>
              <select
                value={filtrosLocales.limite}
                onChange={(e) => handleFiltroChange('limite', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10 resultados</option>
                <option value={20}>20 resultados</option>
                <option value={50}>50 resultados</option>
                <option value={100}>100 resultados</option>
              </select>
            </div>
          </div>

          {/* Información adicional del período móvil */}
          <div className="sm:hidden">
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <strong>Período seleccionado:</strong> {formatearPeriodo}
              <br />
              <strong>Duración:</strong> {diasEnPeriodo} días
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de filtros compacto para móvil
export function FiltrosCompactos({ onPeriodoChange }) {
  const { setPeriodoPredefinido, periodosPredefinidos } = useReportesContext();

  const handlePeriodoClick = (periodo) => {
    setPeriodoPredefinido(periodo);
    if (onPeriodoChange) {
      onPeriodoChange(periodo);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex items-center space-x-2 overflow-x-auto">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Período:
        </span>
        <div className="flex space-x-2">
          {periodosPredefinidos.slice(0, 4).map((periodo) => (
            <button
              key={periodo.key}
              onClick={() => handlePeriodoClick(periodo.key)}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              {periodo.label.replace('Último ', '').replace('Última ', '')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente de indicadores de filtros activos
export function IndicadoresFiltros() {
  const { filtros, limpiarFiltros, formatearPeriodo } = useReportesContext();

  const getFiltrosActivos = () => {
    const activos = [];
    
    if (filtros.empleado_id) {
      activos.push({ key: 'empleado', label: 'Empleado específico' });
    }
    
    if (filtros.ciudad) {
      activos.push({ key: 'ciudad', label: `Ciudad: ${filtros.ciudad}` });
    }
    
    return activos;
  };

  const filtrosActivos = getFiltrosActivos();

  if (filtrosActivos.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-blue-800">
        Filtros activos:
      </span>
      
      {filtrosActivos.map((filtro) => (
        <span
          key={filtro.key}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {filtro.label}
        </span>
      ))}
      
      <span className="text-xs text-blue-600">
        {formatearPeriodo}
      </span>
      
      <button
        onClick={limpiarFiltros}
        className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Limpiar todos
      </button>
    </div>
  );
}