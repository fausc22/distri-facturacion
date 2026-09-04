// FiltrosProductos.jsx - borrador en móvil + debounce 300ms en desktop
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdFilterList, MdClear, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { axiosAuth } from '../../utils/apiClient';
import ModalBase from '../common/ModalBase';
import { STOCK_THRESHOLDS } from '../../constants/stockThresholds';

const UNIDADES_OPCIONES = [
  { value: '', label: 'Todas las unidades' },
  { value: 'Kilos', label: 'Kilos' },
  { value: 'Litros', label: 'Litros' },
  { value: 'Unidades', label: 'Unidades' }
];

const STOCK_OPCIONES = [
  { value: '', label: 'Todos' },
  { value: 'bajo', label: `Solo stock bajo (<${STOCK_THRESHOLDS.BAJO_LISTADO})` },
  { value: 'cero', label: 'Sin stock (0)' }
];

function FiltrosProductos({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  totalProductos = 0
}) {
  const [expandido, setExpandido] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [borrador, setBorrador] = useState({
    categoria_id: '',
    unidad_medida: '',
    stock: ''
  });
  // Estado local desktop para feedback inmediato mientras corre el debounce
  const [desktopLocal, setDesktopLocal] = useState({
    categoria_id: filtros.categoria_id || '',
    unidad_medida: filtros.unidad_medida || '',
    stock: filtros.stock || ''
  });
  const debounceRef = useRef(null);

  useEffect(() => {
    setDesktopLocal({
      categoria_id: filtros.categoria_id || '',
      unidad_medida: filtros.unidad_medida || '',
      stock: filtros.stock || ''
    });
  }, [filtros.categoria_id, filtros.unidad_medida, filtros.stock]);

  useEffect(() => {
    if (!expandido && !modalAbierto) return;
    setLoadingCategorias(true);
    axiosAuth
      .get('/productos/categorias')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCategorias(res.data.data);
        }
      })
      .catch(() => setCategorias([]))
      .finally(() => setLoadingCategorias(false));
  }, [expandido, modalAbierto]);

  useEffect(() => {
    if (modalAbierto) {
      setBorrador({
        categoria_id: filtros.categoria_id || '',
        unidad_medida: filtros.unidad_medida || '',
        stock: filtros.stock || ''
      });
    }
  }, [modalAbierto, filtros.categoria_id, filtros.unidad_medida, filtros.stock]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleDesktopChange = useCallback((campo, valor) => {
    setDesktopLocal((prev) => {
      const next = { ...prev, [campo]: valor };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onFiltrosChange({
          ...filtros,
          categoria_id: next.categoria_id,
          unidad_medida: next.unidad_medida,
          stock: next.stock
        });
      }, 300);
      return next;
    });
  }, [filtros, onFiltrosChange]);

  const handleBorradorChange = (campo, valor) => {
    setBorrador((prev) => ({ ...prev, [campo]: valor }));
  };

  const hayFiltrosActivos = (fuente) => {
    return ['categoria_id', 'unidad_medida', 'stock'].some(
      (k) => fuente[k] != null && String(fuente[k]).trim() !== ''
    );
  };

  const contarFiltrosActivos = () => {
    return ['categoria_id', 'unidad_medida', 'stock'].filter(
      (k) => filtros[k] != null && String(filtros[k]).trim() !== ''
    ).length;
  };

  const aplicarYCerrarModal = () => {
    onFiltrosChange({
      ...filtros,
      categoria_id: borrador.categoria_id || '',
      unidad_medida: borrador.unidad_medida || '',
      stock: borrador.stock || ''
    });
    setModalAbierto(false);
  };

  const renderChips = (valores, onChange) => (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="text-sm">
        <span className="font-medium text-blue-800">Filtros activos:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {valores.categoria_id && (
            <span className="inline-flex items-center gap-1 bg-white text-blue-800 px-2 py-1 rounded text-xs border border-blue-300">
              Categoría:{' '}
              {categorias.find((c) => String(c.id) === String(valores.categoria_id))?.nombre ||
                valores.categoria_id}
              <button
                type="button"
                onClick={() => onChange('categoria_id', '')}
                className="text-blue-600 hover:text-blue-800 ml-1"
                aria-label="Quitar filtro categoría"
              >
                ×
              </button>
            </span>
          )}
          {valores.unidad_medida && (
            <span className="inline-flex items-center gap-1 bg-white text-blue-800 px-2 py-1 rounded text-xs border border-blue-300">
              U.M.: {valores.unidad_medida}
              <button
                type="button"
                onClick={() => onChange('unidad_medida', '')}
                className="text-blue-600 hover:text-blue-800 ml-1"
                aria-label="Quitar filtro unidad"
              >
                ×
              </button>
            </span>
          )}
          {valores.stock && (
            <span className="inline-flex items-center gap-1 bg-white text-blue-800 px-2 py-1 rounded text-xs border border-blue-300">
              Stock: {valores.stock === 'bajo' ? 'Bajo' : 'Cero'}
              <button
                type="button"
                onClick={() => onChange('stock', '')}
                className="text-blue-600 hover:text-blue-800 ml-1"
                aria-label="Quitar filtro stock"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const contenidoFiltros = (esEnModal = false) => {
    const valores = esEnModal ? borrador : desktopLocal;
    const onChange = esEnModal ? handleBorradorChange : handleDesktopChange;
    const activos = hayFiltrosActivos(valores);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={valores.categoria_id || ''}
            onChange={(e) => onChange('categoria_id', e.target.value)}
            className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
            {loadingCategorias && <option disabled>Cargando...</option>}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
          <select
            value={valores.unidad_medida || ''}
            onChange={(e) => onChange('unidad_medida', e.target.value)}
            className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            aria-label="Filtrar por unidad de medida"
          >
            {UNIDADES_OPCIONES.map((opt) => (
              <option key={opt.value || 'todas'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
          <select
            value={valores.stock || ''}
            onChange={(e) => onChange('stock', e.target.value)}
            className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            aria-label="Filtrar por stock"
          >
            {STOCK_OPCIONES.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {activos && renderChips(valores, onChange)}

        <div className={`flex flex-col sm:flex-row gap-2 ${esEnModal ? 'pt-2' : 'pt-2 sm:justify-end'}`}>
          {activos && (
            <button
              type="button"
              onClick={() => {
                if (esEnModal) {
                  setBorrador({ categoria_id: '', unidad_medida: '', stock: '' });
                } else {
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  setDesktopLocal({ categoria_id: '', unidad_medida: '', stock: '' });
                  onLimpiarFiltros();
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors text-sm font-medium min-h-[44px] touch-manipulation"
            >
              <MdClear size={18} />
              Limpiar filtros
            </button>
          )}
          {esEnModal ? (
            <button
              type="button"
              onClick={aplicarYCerrarModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium min-h-[44px] touch-manipulation"
            >
              Aplicar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExpandido(false)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors text-sm font-medium min-h-[44px] touch-manipulation"
            >
              Cerrar filtros
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm mb-4">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-700 truncate">
              {totalProductos} productos
            </span>
            {hayFiltrosActivos(filtros) && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">
                {contarFiltrosActivos()} activo{contarFiltrosActivos() !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-semibold min-h-[44px] min-w-[44px] shrink-0 touch-manipulation"
            aria-label="Abrir filtros"
          >
            <MdFilterList size={22} />
            <span>Filtros</span>
          </button>
        </div>

        <div className="hidden md:block">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors min-h-[44px]"
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
                <h3 className="font-semibold text-gray-800">Filtros</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{totalProductos} productos</span>
                  {hayFiltrosActivos(filtros) && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {contarFiltrosActivos()} filtro{contarFiltrosActivos() !== 1 ? 's' : ''} activo
                      {contarFiltrosActivos() !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hayFiltrosActivos(filtros) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    setDesktopLocal({ categoria_id: '', unidad_medida: '', stock: '' });
                    onLimpiarFiltros();
                  }}
                  className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
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
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              expandido ? 'max-h-[75vh] opacity-100' : 'max-h-0 opacity-0'
            }`}
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
        showHeader={true}
        panelClassName="max-h-[90vh] flex flex-col"
        contentClassName="overflow-y-auto flex-1 min-h-0"
      >
        {contenidoFiltros(true)}
      </ModalBase>
    </>
  );
}

export default React.memo(FiltrosProductos);
