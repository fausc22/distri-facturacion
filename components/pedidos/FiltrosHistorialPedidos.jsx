import { useState, useEffect, useRef, useId } from 'react';
import { MdFilterList, MdClear, MdExpandMore, MdExpandLess, MdSearch } from 'react-icons/md';
import { axiosAuth } from '../../utils/apiClient';
import ModalBase from '../common/ModalBase';

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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ciudadesUnicas, setCiudadesUnicas] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [empleadosUnicos, setEmpleadosUnicos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const ultimaLongitudProcesada = useRef(0);

  const esGerente = user?.rol === 'GERENTE';
  const clientesListId = useId();
  const ciudadesListId = useId();

  const cargarDatosUnicos = async (len) => {
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

  const necesitaCargarDatos = expandido || modalAbierto;
  useEffect(() => {
    if (!necesitaCargarDatos) return;
    const len = pedidosOriginales?.length ?? 0;
    const yaProcesado = ultimaLongitudProcesada.current === len && len > 0;
    if (yaProcesado) return;
    ultimaLongitudProcesada.current = len;
    cargarDatosUnicos(len);
    if (esGerente && len > 0) extraerEmpleadosUnicos();
  }, [necesitaCargarDatos, pedidosOriginales?.length, esGerente]);

  const handleFiltroChange = (campo, valor) => {
    onFiltrosChange({ ...filtros, [campo]: valor });
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

  const handleAplicarModal = () => {
    setModalAbierto(false);
  };

  const contenidoFiltros = (esEnModal = false) => (
    <div className="space-y-4">
      {/* Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <div className="relative">
          <input
            type="text"
            value={filtros.cliente || ''}
            onChange={(e) => handleFiltroChange('cliente', e.target.value)}
            placeholder="Buscar por cliente..."
            list={clientesListId}
            className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          {filtros.cliente && (
            <button
              type="button"
              onClick={() => handleFiltroChange('cliente', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Limpiar"
              aria-label="Limpiar cliente"
            >
              <MdClear size={16} />
            </button>
          )}
        </div>
        <datalist id={clientesListId}>
          {clientesUnicos.map((c, i) => (
            <option key={i} value={c} />
          ))}
        </datalist>
      </div>

      {/* Estado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select
          value={filtros.estado || ''}
          onChange={(e) => handleFiltroChange('estado', e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Todos los estados</option>
          <option value="Exportado">Exportado</option>
          <option value="Facturado">Facturado</option>
          <option value="Anulado">Anulado</option>
        </select>
      </div>

      {/* Ciudad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
        <input
          type="text"
          value={filtros.ciudad || ''}
          onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
          placeholder="Buscar ciudad..."
          list={ciudadesListId}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <datalist id={ciudadesListId}>
          {ciudadesUnicas.map((ciudad, i) => (
            <option key={i} value={ciudad} />
          ))}
        </datalist>
      </div>

      {/* Empleado (solo gerente) */}
      {esGerente && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
          <select
            value={filtros.empleado || ''}
            onChange={(e) => handleFiltroChange('empleado', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
          >
            <option value="">Todos los empleados</option>
            {empleadosUnicos.map((empleado, i) => (
              <option key={i} value={empleado}>{empleado}</option>
            ))}
          </select>
          {loadingDatos && (
            <div className="text-xs text-gray-500 mt-1">Cargando empleados...</div>
          )}
        </div>
      )}

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
        <div className="space-y-2">
          <input
            type="date"
            value={filtros.fechaDesde || ''}
            onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            title="Desde"
          />
          <input
            type="date"
            value={filtros.fechaHasta || ''}
            onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            title="Hasta"
          />
        </div>
      </div>

      {/* Resumen filtros activos */}
      {hayFiltrosActivos() && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm">
            <span className="font-medium text-blue-800">Filtros activos:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(filtros).map(([campo, valor]) => {
                if (!valor) return null;
                const etiquetas = { fechaDesde: 'Desde', fechaHasta: 'Hasta', cliente: 'Cliente', ciudad: 'Ciudad', estado: 'Estado', empleado: 'Empleado' };
                const etiqueta = etiquetas[campo] || campo;
                return (
                  <span
                    key={campo}
                    className="inline-flex items-center gap-1 bg-white text-blue-800 px-2 py-1 rounded text-xs border border-blue-300"
                  >
                    <strong>{etiqueta}:</strong> {valor}
                    <button
                      type="button"
                      onClick={() => handleFiltroChange(campo, '')}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                      title={`Quitar ${etiqueta}`}
                      aria-label={`Quitar filtro ${etiqueta}`}
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

      {/* Botones */}
      <div className={`flex flex-col sm:flex-row gap-2 ${esEnModal ? 'pt-2' : 'pt-2 sm:justify-end'}`}>
        {hayFiltrosActivos() && (
          <button
            type="button"
            onClick={limpiarTodosFiltros}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium min-h-[44px]"
          >
            <MdClear size={18} />
            Limpiar filtros
          </button>
        )}
        {esEnModal ? (
          <button
            type="button"
            onClick={handleAplicarModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px]"
          >
            Aplicar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setExpandido(false)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium min-h-[44px]"
          >
            Cerrar filtros
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm mb-4">
        {/* Mobile: botón para abrir modal */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-700 truncate">
              {pedidosFiltrados} de {totalPedidos} pedidos
            </span>
            {hayFiltrosActivos() && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">
                {contarFiltrosActivos()} activo{contarFiltrosActivos() !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold min-h-[44px] min-w-[44px] shrink-0"
            aria-label="Abrir filtros"
          >
            <MdFilterList size={22} />
            <span>Filtros</span>
          </button>
        </div>

        {/* Desktop: acordeón */}
        <div className="hidden md:block">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandido(!expandido)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandido(prev => !prev); } }}
            aria-expanded={expandido}
            aria-label={expandido ? 'Cerrar filtros' : 'Abrir filtros'}
          >
            <div className="flex items-center gap-3">
              <MdFilterList className="text-blue-600 shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Filtros de búsqueda</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Mostrando {pedidosFiltrados} de {totalPedidos} pedidos</span>
                  {hayFiltrosActivos() && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {contarFiltrosActivos()} filtro{contarFiltrosActivos() !== 1 ? 's' : ''} activo{contarFiltrosActivos() !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hayFiltrosActivos() && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); limpiarTodosFiltros(); }}
                  className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Limpiar todos los filtros"
                  aria-label="Limpiar filtros"
                >
                  <MdClear size={20} />
                </button>
              )}
              <span className="text-gray-400" aria-hidden>
                {expandido ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
              </span>
            </div>
          </div>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${expandido ? 'max-h-[75vh] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="border-t border-gray-200 px-4 pb-4 pt-4 max-h-[70vh] overflow-y-auto">
              {contenidoFiltros(false)}
            </div>
          </div>
        </div>
      </div>

      {/* Modal filtros (solo móvil) */}
      <ModalBase
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Filtros"
        size="md"
        closeOnOverlay
        closeOnEscape
        showHeader={true}
        panelClassName="max-h-[90vh] flex flex-col"
        contentClassName="overflow-y-auto flex-1 min-h-0"
      >
        {contenidoFiltros(true)}
      </ModalBase>
    </>
  );
}
