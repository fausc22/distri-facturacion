import { useState, useCallback } from 'react';
import Head from 'next/head';
import useAuth from '../../hooks/useAuth';
import { useProductos } from '../../hooks/useProductos';
import { useProductosListado } from '../../hooks/useProductosListado';
import FiltrosProductos from '../../components/productos/FiltrosProductos';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import ModalProducto from '../../components/productos/ModalProducto';
import ModalBase from '../../components/common/ModalBase';
import { formatearCantidad } from '../../utils/formatearCantidad';

export default function GestionProductos() {
  useAuth();

  const { eliminarProducto } = useProductos();
  const {
    productos,
    total,
    loading,
    paginaActual,
    porPagina,
    filtros,
    setFiltros,
    cargarProductos
  } = useProductosListado();

  const [searchTermInput, setSearchTermInput] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminandoProducto, setEliminandoProducto] = useState(false);

  // Ordenamiento (solo sobre la página actual)
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fase 6: callbacks estables para evitar re-renders en hijos
  const handleBuscar = useCallback(() => {
    cargarProductos({
      filtros: { ...filtros, search: searchTermInput.trim() },
      pagina: 1
    });
  }, [cargarProductos, filtros, searchTermInput]);

  const handleLimpiar = useCallback(() => {
    setSearchTermInput('');
    cargarProductos({
      filtros: { ...filtros, search: '' },
      pagina: 1
    });
  }, [cargarProductos, filtros]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') handleBuscar();
  }, [handleBuscar]);

  const handleSort = useCallback((key) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('asc');
      return key;
    });
  }, []);

  const handleNuevoProducto = useCallback(() => {
    setProductoSeleccionado(null);
    setModoModal('crear');
    setModalAbierto(true);
  }, []);

  const handleEditarProducto = useCallback((producto) => {
    setProductoSeleccionado(producto);
    setModoModal('editar');
    setModalAbierto(true);
  }, []);

  const handleProductoGuardado = useCallback(() => {
    cargarProductos({});
  }, [cargarProductos]);

  const handleEliminarProducto = useCallback((producto) => {
    setProductoAEliminar(producto);
    setModalEliminarAbierto(true);
  }, []);

  const handleConfirmarEliminar = useCallback(async () => {
    if (!productoAEliminar?.id) return;
    setEliminandoProducto(true);
    try {
      const resultado = await eliminarProducto(productoAEliminar.id);
      if (resultado.success) {
        setModalEliminarAbierto(false);
        setProductoAEliminar(null);
        cargarProductos({});
      }
    } finally {
      setEliminandoProducto(false);
    }
  }, [productoAEliminar, eliminarProducto, cargarProductos]);

  const handleCloseModal = useCallback(() => {
    setModalAbierto(false);
    setProductoSeleccionado(null);
  }, []);

  const handleCloseModalEliminar = useCallback(() => {
    if (!eliminandoProducto) {
      setModalEliminarAbierto(false);
      setProductoAEliminar(null);
    }
  }, [eliminandoProducto]);

  const handleFiltrosChange = useCallback((nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    cargarProductos({ filtros: nuevosFiltros, pagina: 1 });
  }, [setFiltros, cargarProductos]);

  const handleLimpiarFiltros = useCallback(() => {
    const sinFiltros = { ...filtros, categoria_id: '', unidad_medida: '', stock: '' };
    setFiltros(sinFiltros);
    cargarProductos({ filtros: sinFiltros, pagina: 1 });
  }, [filtros, setFiltros, cargarProductos]);

  const handlePageChange = useCallback((nuevaPagina) => {
    cargarProductos({ pagina: nuevaPagina });
  }, [cargarProductos]);

  const productosOrdenados = [...productos].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';

    // Para números
    if (sortBy === 'precio' || sortBy === 'costo' || sortBy === 'stock_actual' || sortBy === 'id') {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = typeof bVal === 'string' ? bVal.toLowerCase() : '';
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación en servidor (Fase 2): una página ya viene en productos; ordenamos en cliente solo esta página
  const totalPages = Math.max(1, Math.ceil(total / porPagina));
  const startIndex = (paginaActual - 1) * porPagina;
  const productosPaginados = productosOrdenados;

  const columnas = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'categoria_nombre', label: 'Categoría', sortable: true },
    { key: 'unidad_medida', label: 'U.M.', sortable: true },
    { key: 'precio', label: 'Precio', sortable: true },
    { key: 'stock_actual', label: 'Stock', sortable: true },
    { key: 'acciones', label: 'Acciones', sortable: false }
  ];

  if (loading && productos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>VERTIMAR | Gestión de Productos</title>
        <meta name="description" content="Gestión de productos e inventario" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="flex-1 overflow-y-auto overflow-x-auto p-4 pb-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header — Fase 4: padding responsive */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            Gestión de Productos
          </h1>

          {/* Barra de búsqueda con botón */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTermInput}
                  onChange={(e) => setSearchTermInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Buscar por nombre, categoría, ID..."
                  className="w-full min-h-[44px] py-2.5 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation"
                  disabled={loading}
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="button"
                onClick={handleBuscar}
                disabled={loading}
                className="min-h-[44px] min-w-[44px] px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium whitespace-nowrap touch-manipulation"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Buscando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Buscar</span>
                  </>
                )}
              </button>
              {(searchTermInput || filtros.search) && (
                <button
                  type="button"
                  onClick={handleLimpiar}
                  disabled={loading}
                  className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 active:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm sm:text-base whitespace-nowrap touch-manipulation"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Limpiar</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleNuevoProducto}
              className="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium whitespace-nowrap touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nuevo Producto</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>

          {/* Contador — Fase 2: total desde servidor */}
          <div className="mt-4 text-sm text-gray-600">
            Total de productos: <span className="font-semibold">{total}</span>
            </div>
          </div>

          {/* Filtros — Fase 3: categoría, unidad de medida, stock */}
          <FiltrosProductos
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            onLimpiarFiltros={handleLimpiarFiltros}
            totalProductos={total}
          />

          {/* Tabla desktop: 100% ancho, columnas en proporción, todas visibles sin scroll */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
          <div className="hidden lg:block w-full">
            <table className="w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '26%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <TableHeader
                columns={columnas}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <tbody className="bg-white divide-y divide-gray-200">
                {productosPaginados.map((producto) => {
                  const stockBajo = producto.stock_actual < 10;

                  return (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 truncate" title={producto.nombre}>
                          {producto.nombre || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {producto.categoria_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {producto.unidad_medida || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${parseFloat(producto.precio || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stockBajo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {formatearCantidad(producto.stock_actual)} unid.
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center gap-2 flex-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEditarProducto(producto)}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-3 py-2 rounded-md transition-colors flex-1 touch-manipulation"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarProducto(producto)}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 active:bg-red-200 px-3 py-2 rounded-md transition-colors flex-1 touch-manipulation"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista móvil — Fase 5: touch targets */}
          <div className="lg:hidden touch-manipulation">
            {productosPaginados.map((producto) => {
              const stockBajo = producto.stock_actual < 10;

              return (
                <div key={producto.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 active:bg-gray-100">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">
                        {producto.nombre}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {producto.categoria_nombre || 'Sin categoría'}
                      </p>
                    </div>
                    <div className="ml-2 flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditarProducto(producto)}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-4 py-2 rounded-md text-sm transition-colors touch-manipulation"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarProducto(producto)}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 active:bg-red-200 px-4 py-2 rounded-md text-sm transition-colors touch-manipulation"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">U.M.:</span>
                      <div className="font-medium text-gray-900">{producto.unidad_medida || '-'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Precio:</span>
                      <div className="font-semibold text-green-600">${parseFloat(producto.precio || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Stock:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stockBajo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {formatearCantidad(producto.stock_actual)} unid.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación — Fase 2: startIndex para evitar NaN; paginación en servidor */}
          <Pagination
            currentPage={paginaActual}
            totalPages={totalPages}
            startIndex={startIndex}
            totalItems={total}
            itemsPerPage={porPagina}
            onPageChange={handlePageChange}
          />
          </div>
        </div>
      </main>

      {/* Modal */}
      <ModalProducto
        isOpen={modalAbierto}
        onClose={handleCloseModal}
        producto={productoSeleccionado}
        modo={modoModal}
        onProductoGuardado={handleProductoGuardado}
      />

      <ModalBase
        isOpen={modalEliminarAbierto}
        onClose={handleCloseModalEliminar}
        title="Confirmar eliminación"
        loading={eliminandoProducto}
        size="sm"
        closeOnEscape
        closeOnOverlay
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            ¿Seguro que querés eliminar el producto{' '}
            <span className="font-semibold">{productoAEliminar?.nombre || ''}</span>?
          </p>
          <p className="text-xs text-gray-500">
            Esta acción es permanente y puede afectar registros relacionados según configuración de base de datos.
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCloseModalEliminar}
              className="min-h-[44px] min-w-[44px] px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
              disabled={eliminandoProducto}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarEliminar}
              disabled={eliminandoProducto}
              className={`min-h-[44px] min-w-[44px] px-4 py-2 text-white rounded-md touch-manipulation ${
                eliminandoProducto ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
              }`}
            >
              {eliminandoProducto ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
