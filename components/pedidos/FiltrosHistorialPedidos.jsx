import { useState, useEffect, useRef } from 'react';
import { MdFilterList, MdClear, MdExpandMore, MdExpandLess, MdSearch } from 'react-icons/md';
import { axiosAuth } from '../../utils/apiClient';

export default function FiltrosHistorialPedidos({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  user,
  totalPedidos = 0,
  pedidosFiltrados = 0,
  pedidosOriginales = []
}) {
  const [expandido, setExpandido] = useState(false);
  const [ciudadesUnicas, setCiudadesUnicas] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [empleadosUnicos, setEmpleadosUnicos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const ultimaLongitudProcesada = useRef(0);

  const esGerente = user?.rol === 'GERENTE';

  // Solo cargar/extraer cuando se abre el panel y cuando la cantidad de pedidos cambió (evita recalcular en cada render)
  useEffect(() => {
    if (!expandido) return;
    const len = pedidosOriginales?.length ?? 0;
    const yaProcesado = ultimaLongitudProcesada.current === len && len > 0;
    if (yaProcesado) return;
    ultimaLongitudProcesada.current = len;

    const cargarDatosUnicos = async () => {
      setLoadingDatos(true);
      try {
        const response = await axiosAuth.get('/pedidos/datos-filtros');
        if (response.data?.success) {
          setCiudadesUnicas(response.data.data?.ciudades || []);
          setClientesUnicos(response.data.data?.clientes || []);
        }
      } catch {
        if (len > 0) {
          const ciudades = [...new Set((pedidosOriginales || []).map(p => p.cliente_ciudad).filter(Boolean))].sort();
          const clientes = [...new Set((pedidosOriginales || []).map(p => p.cliente_nombre).filter(Boolean))].sort();
          setCiudadesUnicas(ciudades);
          setClientesUnicos(clientes);
        }
      } finally {
        setLoadingDatos(false);
      }
    };

    const extraerEmpleadosUnicos = () => {
      if (!pedidosOriginales?.length) return;
      const empleados = [...new Set(
        pedidosOriginales
          .map(p => p.empleado_nombre)
          .filter(n => n && n.trim() && n !== 'No especificado')
      )].sort();
      setEmpleadosUnicos(empleados);
    };

    cargarDatosUnicos();
    if (esGerente && len > 0) extraerEmpleadosUnicos();
  }, [expandido, pedidosOriginales?.length, esGerente]);

  const handleFiltroChange = (campo, valor) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const limpiarTodosFiltros = () => {
    onLimpiarFiltros();
  };

  const hayFiltrosActivos = () => {
    return Object.values(filtros).some(valor => valor && valor !== '');
  };

  const contarFiltrosActivos = () => {
    return Object.values(filtros).filter(valor => valor && valor !== '').length;
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm mb-4">
      {/* Header del filtro */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-3">
          <MdFilterList className="text-blue-600" size={24} />
          <div>
            <h3 className="font-semibold text-gray-800">Filtros de Búsqueda</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                Mostrando {pedidosFiltrados} de {totalPedidos} pedidos
              </span>
              {hayFiltrosActivos() && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {contarFiltrosActivos()} filtro{contarFiltrosActivos() !== 1 ? 's' : ''} activo{contarFiltrosActivos() !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hayFiltrosActivos() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                limpiarTodosFiltros();
              }}
              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Limpiar todos los filtros"
            >
              <MdClear size={20} />
            </button>
          )}
          <div className="text-gray-400">
            {expandido ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
          </div>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      <div className={`transition-all duration-300 ease-in-out ${
        expandido ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="px-4 pb-4 border-t border-gray-200">
          
          {/* ✅ NUEVA FILA: Búsqueda rápida por cliente */}
          <div className="mt-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Búsqueda rápida por cliente
            </label>
            <div className="relative">
              <input
                type="text"
                value={filtros.busquedaTexto || ''}
                onChange={(e) => handleFiltroChange('busquedaTexto', e.target.value)}
                placeholder="Escriba el nombre del cliente..."
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              {filtros.busquedaTexto && (
                <button
                  onClick={() => handleFiltroChange('busquedaTexto', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Limpiar búsqueda"
                >
                  <MdClear size={16} />
                </button>
              )}
            </div>
            {filtros.busquedaTexto && (
              <div className="text-xs text-blue-600 mt-1">
                Buscando: &quot;{filtros.busquedaTexto}&quot;
              </div>
            )}
          </div>

          <div className={`grid gap-4 ${
            esGerente 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            
            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.estado || ''}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="Exportado">📤 Exportado</option>
                <option value="Facturado">✅ Facturado</option>
                <option value="Anulado">❌ Anulado</option>
              </select>
            </div>

            {/* Filtro por Cliente (dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente (lista)
              </label>
              <input
                type="text"
                value={filtros.cliente || ''}
                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                placeholder="Buscar cliente..."
                list="clientes-list"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <datalist id="clientes-list">
                {clientesUnicos.map((cliente, index) => (
                  <option key={index} value={cliente} />
                ))}
              </datalist>
            </div>

            {/* Filtro por Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={filtros.ciudad || ''}
                onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
                placeholder="Buscar ciudad..."
                list="ciudades-list"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <datalist id="ciudades-list">
                {ciudadesUnicas.map((ciudad, index) => (
                  <option key={index} value={ciudad} />
                ))}
              </datalist>
            </div>

            {/* Filtro por Empleado (solo para gerente) */}
            {esGerente && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empleado
                </label>
                <select
                  value={filtros.empleado || ''}
                  onChange={(e) => handleFiltroChange('empleado', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los empleados</option>
                  {empleadosUnicos.map((empleado, index) => (
                    <option key={index} value={empleado}>
                      {empleado}
                    </option>
                  ))}
                </select>
                {loadingDatos && (
                  <div className="text-xs text-gray-500 mt-1">Cargando empleados...</div>
                )}
              </div>
            )}

            {/* Filtro por Fecha */}
            <div className={`${esGerente ? 'xl:col-span-1' : 'lg:col-span-1'}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filtros.fechaDesde || ''}
                  onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Fecha desde"
                />
                <input
                  type="date"
                  value={filtros.fechaHasta || ''}
                  onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Fecha hasta"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción para móvil */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
            {hayFiltrosActivos() && (
              <button
                onClick={limpiarTodosFiltros}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <MdClear size={16} />
                Limpiar Filtros
              </button>
            )}
            <button
              onClick={() => setExpandido(false)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Cerrar Filtros
            </button>
          </div>

          {/* Resumen de filtros activos */}
          {hayFiltrosActivos() && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm">
                <span className="font-medium text-blue-800">Filtros activos:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(filtros).map(([campo, valor]) => {
                    if (!valor) return null;
                    
                    let etiqueta = campo;
                    switch (campo) {
                      case 'busquedaTexto': etiqueta = 'Búsqueda'; break;
                      case 'fechaDesde': etiqueta = 'Desde'; break;
                      case 'fechaHasta': etiqueta = 'Hasta'; break;
                      case 'cliente': etiqueta = 'Cliente'; break;
                      case 'ciudad': etiqueta = 'Ciudad'; break;
                      case 'estado': etiqueta = 'Estado'; break;
                      case 'empleado': etiqueta = 'Empleado'; break;
                    }
                    
                    return (
                      <span 
                        key={campo}
                        className="inline-flex items-center gap-1 bg-white text-blue-800 px-2 py-1 rounded text-xs border border-blue-300"
                      >
                        <strong>{etiqueta}:</strong> {valor}
                        <button
                          onClick={() => handleFiltroChange(campo, '')}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                          title={`Quitar filtro ${etiqueta}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}