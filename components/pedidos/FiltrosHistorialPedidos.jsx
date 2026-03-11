import { useState, useEffect, useRef, useCallback } from 'react';
import { MdFilterList, MdClear, MdExpandMore, MdSearch } from 'react-icons/md';
import { axiosAuth } from '../../utils/apiClient';
import ModalBase from '../common/ModalBase';

const DEBOUNCE_MS = 350;

/** Autocomplete que busca en TODOS los pedidos vía API (sugerencias-filtros). */
function AutocompleteFiltroPedidos({ tipo, value, onChange, placeholder, ariaLabel }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);

  const buscar = useCallback(async (q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tipo, q: (q || '').trim() });
      const res = await axiosAuth.get(`/pedidos/sugerencias-filtros?${params.toString()}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSugerencias(res.data.data);
        setAbierto(true);
      } else {
        setSugerencias([]);
      }
    } catch (err) {
      console.error('Error sugerencias filtros pedidos:', err);
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
          className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
        />
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
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

export default function FiltrosHistorialPedidos({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  user,
  totalPedidos = 0,
  pedidosFiltrados = 0,
  pedidosOriginales = []
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadosUnicos, setEmpleadosUnicos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const datosCargadosRef = useRef(false);

  const esGerente = user?.rol === 'GERENTE';

  const necesitaCargarDatos = modalAbierto;
  useEffect(() => {
    if (!necesitaCargarDatos) {
      datosCargadosRef.current = false;
      return;
    }
    if (datosCargadosRef.current) return;
    datosCargadosRef.current = true;
    setLoadingDatos(true);
    axiosAuth.get('/pedidos/datos-filtros')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const { empleados = [] } = res.data.data;
          setEmpleadosUnicos(empleados);
        }
      })
      .catch((err) => console.error('Error cargando datos filtros pedidos:', err))
      .finally(() => setLoadingDatos(false));
  }, [necesitaCargarDatos]);

  const handleFiltroChange = (campo, valor) => {
    onFiltrosChange({ ...filtros, [campo]: valor });
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
    return Object.values(filtros).some(valor => valor && valor !== '');
  };

  const contarFiltrosActivos = () => {
    return Object.values(filtros).filter(valor => valor && valor !== '').length;
  };

  const contenidoFiltros = () => (
    <div className="space-y-4">
      {/* Cliente: busca en todo el historial de pedidos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <AutocompleteFiltroPedidos
          tipo="cliente"
          value={filtros.cliente || ''}
          onChange={(v) => handleFiltroChange('cliente', v)}
          placeholder="Buscar cliente (en todo el historial)..."
          ariaLabel="Cliente"
        />
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

      {/* Ciudad: busca en todo el historial de pedidos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
        <AutocompleteFiltroPedidos
          tipo="ciudad"
          value={filtros.ciudad || ''}
          onChange={(v) => handleFiltroChange('ciudad', v)}
          placeholder="Buscar ciudad (en todo el historial)..."
          ariaLabel="Ciudad"
        />
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

      {/* Botones: Filtrar cierra modal, Limpiar limpia y cierra, Cerrar solo cierra */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:justify-end flex-wrap">
        <button
          type="button"
          onClick={() => setModalAbierto(false)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] min-w-[44px]"
          title="Aplicar filtros y cerrar"
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
                <span>Mostrando {pedidosFiltrados} de {totalPedidos} pedidos</span>
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
        {contenidoFiltros()}
      </ModalBase>
    </>
  );
}
