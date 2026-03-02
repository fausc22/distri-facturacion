import { useState, useEffect } from 'react';
import { MdFilterList, MdClear, MdExpandMore, MdExpandLess, MdSearch } from 'react-icons/md';

export default function FiltrosHistorialVentas({ 
  filtros, 
  onFiltrosChange, 
  onLimpiarFiltros,
  onBusquedaCliente, // se mantiene por compatibilidad; el flujo usa onFiltrosChange al hacer clic en Filtrar
  user,
  totalVentas = 0,
  ventasFiltradas = 0,
  ventasOriginales = []
}) {
  const [expandido, setExpandido] = useState(false);
  const [avanzadosExpandido, setAvanzadosExpandido] = useState(false);

  // Estado local: los inputs solo actualizan esto. La API se llama solo al hacer clic en "Filtrar".
  const [localFiltros, setLocalFiltros] = useState(() => ({ ...filtros }));

  // Estados únicos extraídos de las ventas (para datalists)
  const [ciudadesUnicas, setCiudadesUnicas] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [empleadosUnicos, setEmpleadosUnicos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);

  const esGerente = user?.rol === 'GERENTE';

  // Sincronizar localFiltros cuando el padre actualiza (ej. después de "Limpiar filtros")
  useEffect(() => {
    setLocalFiltros({ ...filtros });
  }, [filtros]);

  // Cargar datos únicos solo al abrir el panel (no en cada cambio de ventas/paginación)
  useEffect(() => {
    if (expandido) {
      cargarDatosUnicos();
      if (esGerente && ventasOriginales.length > 0) {
        extraerEmpleadosUnicos();
      }
    }
  }, [expandido, esGerente]);

  const cargarDatosUnicos = async () => {
    setLoadingDatos(true);
    try {
      if (ventasOriginales.length > 0) {
        extraerDatosDeLocal();
      }
    } catch (error) {
      console.error('Error cargando datos para filtros:', error);
      if (ventasOriginales.length > 0) {
        extraerDatosDeLocal();
      }
    } finally {
      setLoadingDatos(false);
    }
  };

  const extraerEmpleadosUnicos = () => {
    if (!ventasOriginales || ventasOriginales.length === 0) return;

    const empleados = [...new Set(
      ventasOriginales
        .map(venta => venta.empleado_nombre)
        .filter(nombre => nombre && nombre.trim() !== '' && nombre !== 'No especificado')
    )].sort();

    setEmpleadosUnicos(empleados);
    console.log('👥 Empleados únicos extraídos:', empleados);
  };

  const extraerDatosDeLocal = () => {
    const ciudades = [...new Set(
      ventasOriginales
        .map(venta => venta.cliente_ciudad)
        .filter(ciudad => ciudad && ciudad.trim() !== '' && ciudad !== 'No especificada')
    )].sort();

    const clientes = [...new Set(
      ventasOriginales
        .map(venta => venta.cliente_nombre)
        .filter(cliente => cliente && cliente.trim() !== '' && cliente !== 'Cliente no especificado')
    )].sort();

    setCiudadesUnicas(ciudades);
    setClientesUnicos(clientes);
    console.log('📊 Datos extraídos:', { ciudades: ciudades.length, clientes: clientes.length });
  };

  const handleFiltroChange = (campo, valor) => {
    setLocalFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  /** Aplicar filtros al servidor solo cuando el usuario hace clic en "Filtrar". */
  const aplicarFiltros = (e) => {
    e?.stopPropagation();
    onFiltrosChange({ ...localFiltros });
  };

  const limpiarTodosFiltros = () => {
    onLimpiarFiltros();
  };

  const hayFiltrosActivos = () => {
    return Object.values(localFiltros).some(valor => valor && valor !== '');
  };

  const contarFiltrosActivos = () => {
    return Object.values(localFiltros).filter(valor => valor && valor !== '').length;
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
                Mostrando {ventasFiltradas} de {totalVentas} ventas
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
        expandido ? 'max-h-[36rem] opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="px-4 pb-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mt-2 mb-1">
            Completa los criterios y haz clic en <strong>Filtrar</strong> para buscar.
          </p>

          {/* Filtros principales: Cliente, Tipo documento, Fecha */}
          <div className="grid gap-4 mt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <div className="relative">
                <input
                  type="text"
                  value={localFiltros.cliente || ''}
                  onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                  placeholder="Buscar cliente..."
                  list="clientes-list"
                  className="w-full p-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <MdSearch className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <datalist id="clientes-list">
                {clientesUnicos.map((cliente, index) => (
                  <option key={index} value={cliente} />
                ))}
              </datalist>
              {localFiltros.cliente && localFiltros.cliente.length < 2 && (
                <p className="text-xs text-gray-500 mt-1">Escribe al menos 2 caracteres para buscar</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
              <select
                value={localFiltros.tipoDocumento || ''}
                onChange={(e) => handleFiltroChange('tipoDocumento', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="FACTURA">📄 Factura</option>
                <option value="NOTA_DEBITO">📝 Nota de Débito</option>
                <option value="NOTA_CREDITO">📋 Nota de Crédito</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={localFiltros.fechaDesde || ''}
                  onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Fecha desde"
                />
                <input
                  type="date"
                  value={localFiltros.fechaHasta || ''}
                  onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Fecha hasta"
                />
              </div>
            </div>
          </div>

          {/* Filtros avanzados (colapsable) */}
          <div className="mt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAvanzadosExpandido((prev) => !prev);
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              {avanzadosExpandido ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
              Filtros avanzados
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${avanzadosExpandido ? 'max-h-80 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className={`grid gap-4 ${esGerente ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={localFiltros.ciudad || ''}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Fiscal</label>
                  <select
                    value={localFiltros.tipoFiscal || ''}
                    onChange={(e) => handleFiltroChange('tipoFiscal', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="A">🅰️ Tipo A</option>
                    <option value="B">🅱️ Tipo B</option>
                    <option value="C">🅲 Tipo C</option>
                  </select>
                </div>

                {esGerente && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                    <select
                      value={localFiltros.empleado || ''}
                      onChange={(e) => handleFiltroChange('empleado', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos los empleados</option>
                      {empleadosUnicos.map((empleado, index) => (
                        <option key={index} value={empleado}>{empleado}</option>
                      ))}
                    </select>
                    {loadingDatos && (
                      <div className="text-xs text-gray-500 mt-1">Cargando empleados...</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción: Filtrar aplica al servidor; el resto solo afecta la UI local */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end flex-wrap">
            <button
              type="button"
              onClick={aplicarFiltros}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title="Aplicar los filtros y buscar ventas"
            >
              <MdSearch size={18} />
              Filtrar
            </button>
            {hayFiltrosActivos() && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  limpiarTodosFiltros();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                title="Quitar todos los filtros y recargar"
              >
                <MdClear size={16} />
                Limpiar Filtros
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandido(false);
              }}
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
                  {Object.entries(localFiltros).map(([campo, valor]) => {
                    if (!valor) return null;
                    
                    let etiqueta = campo;
                    switch (campo) {
                      case 'fechaDesde': etiqueta = 'Desde'; break;
                      case 'fechaHasta': etiqueta = 'Hasta'; break;
                      case 'cliente': etiqueta = 'Cliente'; break;
                      case 'ciudad': etiqueta = 'Ciudad'; break;
                      case 'tipoDocumento': etiqueta = 'Tipo Doc'; break;
                      case 'tipoFiscal': etiqueta = 'Tipo Fiscal'; break;
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