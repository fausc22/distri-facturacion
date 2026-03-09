import { useState, useEffect, useRef, useId } from 'react';
import { MdFilterList, MdClear, MdExpandMore, MdExpandLess, MdSearch } from 'react-icons/md';
import ModalBase from '../common/ModalBase';

export default function FiltrosHistorialVentas({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  onBusquedaCliente,
  user,
  totalVentas = 0,
  ventasFiltradas = 0,
  ventasOriginales = []
}) {
  const [expandido, setExpandido] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [avanzadosExpandido, setAvanzadosExpandido] = useState(false);

  const [localFiltros, setLocalFiltros] = useState(() => ({ ...filtros }));

  const [ciudadesUnicas, setCiudadesUnicas] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [empleadosUnicos, setEmpleadosUnicos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const ultimaLongitudProcesada = useRef(0);

  const esGerente = user?.rol === 'GERENTE';
  const clientesListId = useId();
  const ciudadesListId = useId();

  useEffect(() => {
    setLocalFiltros({ ...filtros });
  }, [filtros]);

  const necesitaCargarDatos = expandido || modalAbierto;
  useEffect(() => {
    if (!necesitaCargarDatos) return;
    const len = ventasOriginales?.length ?? 0;
    const yaProcesado = ultimaLongitudProcesada.current === len && len > 0;
    if (yaProcesado) return;
    ultimaLongitudProcesada.current = len;
    if (len > 0) {
      setLoadingDatos(true);
      extraerDatosDeLocal();
      if (esGerente) extraerEmpleadosUnicos();
      setLoadingDatos(false);
    }
  }, [necesitaCargarDatos, ventasOriginales?.length, esGerente]);

  const extraerEmpleadosUnicos = () => {
    if (!ventasOriginales?.length) return;
    const empleados = [...new Set(
      ventasOriginales
        .map((v) => v.empleado_nombre)
        .filter((n) => n && n.trim() !== '' && n !== 'No especificado')
    )].sort();
    setEmpleadosUnicos(empleados);
  };

  const extraerDatosDeLocal = () => {
    if (!ventasOriginales?.length) return;
    const ciudades = [...new Set(
      ventasOriginales
        .map((v) => v.cliente_ciudad)
        .filter((c) => c && c.trim() !== '' && c !== 'No especificada')
    )].sort();
    const clientes = [...new Set(
      ventasOriginales
        .map((v) => v.cliente_nombre)
        .filter((c) => c && c.trim() !== '' && c !== 'Cliente no especificado')
    )].sort();
    setCiudadesUnicas(ciudades);
    setClientesUnicos(clientes);
  };

  const handleFiltroChange = (campo, valor) => {
    setLocalFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = (e) => {
    e?.stopPropagation();
    onFiltrosChange({ ...localFiltros });
  };

  const aplicarYCerrarModal = (e) => {
    aplicarFiltros(e);
    setModalAbierto(false);
  };

  const limpiarTodosFiltros = () => {
    onLimpiarFiltros();
  };

  const hayFiltrosActivos = () => {
    return Object.values(localFiltros).some((v) => v && v !== '');
  };

  const contarFiltrosActivos = () => {
    return Object.values(localFiltros).filter((v) => v && v !== '').length;
  };

  const etiquetaFiltro = (campo) => {
    const map = {
      fechaDesde: 'Desde',
      fechaHasta: 'Hasta',
      cliente: 'Cliente',
      ciudad: 'Ciudad',
      tipoDocumento: 'Tipo Doc',
      tipoFiscal: 'Tipo Fiscal',
      empleado: 'Empleado'
    };
    return map[campo] || campo;
  };

  const contenidoFiltros = (esEnModal = false) => (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Completa los criterios y haz clic en <strong>Filtrar</strong> para buscar.
      </p>

      {/* Principales: Cliente, Empleado, Tipo fiscal, Fecha, Tipo documento */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <div className="relative">
            <input
              type="text"
              value={localFiltros.cliente || ''}
              onChange={(e) => handleFiltroChange('cliente', e.target.value)}
              placeholder="Buscar cliente..."
              list={clientesListId}
              className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              aria-label="Cliente"
            />
            <MdSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
          <datalist id={clientesListId}>
            {clientesUnicos.map((c, i) => (
              <option key={i} value={c} />
            ))}
          </datalist>
        </div>

        {esGerente && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
            <select
              value={localFiltros.empleado || ''}
              onChange={(e) => handleFiltroChange('empleado', e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              aria-label="Empleado"
            >
              <option value="">Todos los empleados</option>
              {empleadosUnicos.map((emp, i) => (
                <option key={i} value={emp}>{emp}</option>
              ))}
            </select>
            {loadingDatos && (
              <div className="text-xs text-gray-500 mt-1">Cargando empleados...</div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Fiscal</label>
          <select
            value={localFiltros.tipoFiscal || ''}
            onChange={(e) => handleFiltroChange('tipoFiscal', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            aria-label="Tipo fiscal"
          >
            <option value="">Todos los tipos</option>
            <option value="A">Tipo A</option>
            <option value="B">Tipo B</option>
            <option value="X">Tipo X</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <div className="space-y-2">
            <input
              type="date"
              value={localFiltros.fechaDesde || ''}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              title="Desde"
              aria-label="Fecha desde"
            />
            <input
              type="date"
              value={localFiltros.fechaHasta || ''}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              title="Hasta"
              aria-label="Fecha hasta"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
          <select
            value={localFiltros.tipoDocumento || ''}
            onChange={(e) => handleFiltroChange('tipoDocumento', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            aria-label="Tipo de documento"
          >
            <option value="">Todos los tipos</option>
            <option value="FACTURA">Factura</option>
            <option value="NOTA_DEBITO">Nota de Débito</option>
            <option value="NOTA_CREDITO">Nota de Crédito</option>
          </select>
        </div>
      </div>

      {/* Filtros avanzados: Ciudad (no enviado al backend actualmente) */}
      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAvanzadosExpandido((prev) => !prev);
          }}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 min-h-[44px] items-center"
          aria-expanded={avanzadosExpandido}
        >
          {avanzadosExpandido ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
          Filtros avanzados
        </button>
        <div className={`overflow-hidden transition-all duration-200 ${avanzadosExpandido ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              value={localFiltros.ciudad || ''}
              onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
              placeholder="Buscar ciudad..."
              list={ciudadesListId}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              aria-label="Ciudad"
            />
            <datalist id={ciudadesListId}>
              {ciudadesUnicas.map((c, i) => (
                <option key={i} value={c} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Resumen filtros activos */}
      {hayFiltrosActivos() && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm">
            <span className="font-medium text-blue-800">Filtros activos:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(localFiltros).map(([campo, valor]) => {
                if (!valor) return null;
                return (
                  <span
                    key={campo}
                    className="inline-flex items-center gap-1 bg-white text-blue-800 px-2 py-1 rounded text-xs border border-blue-300"
                  >
                    <strong>{etiquetaFiltro(campo)}:</strong> {valor}
                    <button
                      type="button"
                      onClick={() => handleFiltroChange(campo, '')}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                      title={`Quitar ${etiquetaFiltro(campo)}`}
                      aria-label={`Quitar filtro ${etiquetaFiltro(campo)}`}
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
      <div className={`flex flex-col sm:flex-row gap-2 ${esEnModal ? 'pt-2' : 'pt-2 sm:justify-end'} flex-wrap`}>
        <button
          type="button"
          onClick={esEnModal ? aplicarYCerrarModal : aplicarFiltros}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] min-w-[44px]"
          title="Aplicar los filtros y buscar ventas"
          aria-label="Filtrar"
        >
          <MdSearch size={18} />
          {esEnModal ? 'Aplicar' : 'Filtrar'}
        </button>
        {hayFiltrosActivos() && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              limpiarTodosFiltros();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium min-h-[44px] min-w-[44px]"
            title="Quitar todos los filtros y recargar"
            aria-label="Limpiar filtros"
          >
            <MdClear size={16} />
            Limpiar Filtros
          </button>
        )}
        {!esEnModal && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpandido(false);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium min-h-[44px] min-w-[44px]"
            aria-label="Cerrar filtros"
          >
            Cerrar Filtros
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm mb-4">
        {/* Móvil: barra con contador + botón Filtros que abre modal */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-700 truncate">
              {ventasFiltradas} de {totalVentas} ventas
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

        {/* Desktop: acordeón con panel scrolleable */}
        <div className="hidden md:block">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandido(!expandido)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpandido((prev) => !prev);
              }
            }}
            aria-expanded={expandido}
            aria-label={expandido ? 'Cerrar filtros' : 'Abrir filtros'}
          >
            <div className="flex items-center gap-3">
              <MdFilterList className="text-blue-600 shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Filtros de Búsqueda</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Mostrando {ventasFiltradas} de {totalVentas} ventas</span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    limpiarTodosFiltros();
                  }}
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

      <ModalBase
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Filtros"
        size="md"
        closeOnOverlay
        closeOnEscape
        showHeader
        panelClassName="max-h-[90vh] flex flex-col"
        contentClassName="overflow-y-auto flex-1 min-h-0"
      >
        {contenidoFiltros(true)}
      </ModalBase>
    </>
  );
}
