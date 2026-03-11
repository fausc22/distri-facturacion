import { useState, useEffect, useRef, useCallback } from 'react';
import { MdFilterList, MdClear, MdExpandMore, MdExpandLess, MdSearch } from 'react-icons/md';
import ModalBase from '../common/ModalBase';
import { axiosAuth } from '../../utils/apiClient';

const DEBOUNCE_MS = 350;

/** Autocomplete que busca en TODAS las ventas vía API (sugerencias-filtros). */
function AutocompleteFiltro({ tipo, value, onChange, placeholder, ariaLabel }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);

  const buscar = useCallback(async (q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tipo, q: (q || '').trim() });
      const res = await axiosAuth.get(`/ventas/sugerencias-filtros?${params.toString()}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSugerencias(res.data.data);
        setAbierto(true);
      } else {
        setSugerencias([]);
      }
    } catch (err) {
      console.error('Error sugerencias filtros:', err);
      setSugerencias([]);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim() === '') {
      setSugerencias([]);
      setAbierto(false);
      return;
    }
    debounceRef.current = setTimeout(() => buscar(v), DEBOUNCE_MS);
  };

  const handleFocus = () => {
    if (value?.trim()) buscar(value);
    else buscar('');
  };

  const handleBlur = () => {
    setTimeout(() => setAbierto(false), 180);
  };

  const handleSelect = (item) => {
    onChange(item);
    setAbierto(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={abierto}
          className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
        />
        <MdSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
      </div>
      {abierto && (
        <div
          className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          role="listbox"
        >
          {loading ? (
            <div className="p-3 text-sm text-gray-500">Buscando...</div>
          ) : sugerencias.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">Sin resultados. Escribí y aplicá filtro.</div>
          ) : (
            sugerencias.map((item, i) => (
              <button
                key={i}
                type="button"
                role="option"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
              >
                {item}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [avanzadosExpandido, setAvanzadosExpandido] = useState(false);

  const [localFiltros, setLocalFiltros] = useState(() => ({ ...filtros }));

  const [empleadosUnicos, setEmpleadosUnicos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const datosCargadosRef = useRef(false);

  const esGerente = user?.rol === 'GERENTE';

  useEffect(() => {
    setLocalFiltros({ ...filtros });
  }, [filtros]);

  const necesitaCargarDatos = modalAbierto;
  useEffect(() => {
    if (!necesitaCargarDatos) {
      datosCargadosRef.current = false;
      return;
    }
    if (datosCargadosRef.current) return;
    datosCargadosRef.current = true;
    setLoadingDatos(true);
    axiosAuth.get('/ventas/datos-filtros')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const { empleados = [] } = res.data.data;
          setEmpleadosUnicos(empleados);
        }
      })
      .catch((err) => console.error('Error cargando datos filtros ventas:', err))
      .finally(() => setLoadingDatos(false));
  }, [necesitaCargarDatos]);

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

  const limpiarYCerrarModal = (e) => {
    e?.stopPropagation();
    onLimpiarFiltros();
    setModalAbierto(false);
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
      <p className="text-xs text-amber-700/90 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="note">
        Al aplicar o limpiar filtros, la selección de ventas se reinicia.
      </p>

      {/* Principales: Cliente (busca en todas las ventas), Empleado, Tipo fiscal, Fecha, Tipo documento */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <AutocompleteFiltro
            tipo="cliente"
            value={localFiltros.cliente || ''}
            onChange={(v) => handleFiltroChange('cliente', v)}
            placeholder="Buscar cliente (en todo el historial)..."
            ariaLabel="Cliente"
          />
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

      {/* Filtros avanzados: Ciudad (busca en todas las ventas) */}
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
            <AutocompleteFiltro
              tipo="ciudad"
              value={localFiltros.ciudad || ''}
              onChange={(v) => handleFiltroChange('ciudad', v)}
              placeholder="Buscar ciudad (en todo el historial)..."
              ariaLabel="Ciudad"
            />
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

      {/* Botones: siempre en modal (Filtrar aplica y cierra, Limpiar limpia y cierra, Cerrar solo cierra) */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:justify-end flex-wrap">
        <button
          type="button"
          onClick={aplicarYCerrarModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] min-w-[44px]"
          title="Aplicar los filtros y buscar ventas"
          aria-label="Filtrar"
        >
          <MdSearch size={18} />
          Filtrar
        </button>
        {hayFiltrosActivos() && (
          <button
            type="button"
            onClick={limpiarYCerrarModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium min-h-[44px] min-w-[44px]"
            title="Quitar todos los filtros y recargar"
            aria-label="Limpiar filtros"
          >
            <MdClear size={16} />
            Limpiar Filtros
          </button>
        )}
        <button
          type="button"
          onClick={() => setModalAbierto(false)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium min-h-[44px] min-w-[44px]"
          aria-label="Cerrar filtros sin aplicar"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm mb-4">
        {/* Barra única (desktop y móvil): abre modal al hacer clic */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
          onClick={() => setModalAbierto(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setModalAbierto(true);
            }
          }}
          aria-expanded={modalAbierto}
          aria-haspopup="dialog"
          aria-label="Abrir filtros de búsqueda"
        >
          <div className="flex items-center gap-3 min-w-0">
            <MdFilterList className="text-blue-600 shrink-0" size={24} />
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800">Filtros de Búsqueda</h3>
              <div className="flex items-center gap-2 sm:gap-4 text-sm text-gray-600 flex-wrap">
                <span>Mostrando {ventasFiltradas} de {totalVentas} ventas</span>
                {hayFiltrosActivos() && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium shrink-0">
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
              <MdExpandMore size={24} />
            </span>
          </div>
        </div>
      </div>

      <ModalBase
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Filtros de Búsqueda"
        size="md"
        closeOnOverlay={false}
        closeOnEscape={true}
        showHeader
        panelClassName="max-h-[90vh] flex flex-col"
        contentClassName="overflow-y-auto flex-1 min-h-0"
      >
        {contenidoFiltros(true)}
      </ModalBase>
    </>
  );
}
