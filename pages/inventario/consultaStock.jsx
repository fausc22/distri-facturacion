import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import useAuth from '../../hooks/useAuth';
import { axiosAuth } from '../../utils/apiClient';
import { useProductosListado } from '../../hooks/useProductosListado';
import FiltrosProductos from '../../components/productos/FiltrosProductos';
import ModalEditarProductoStock from '../../components/productos/ModalEditarProductoStock';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import { formatearMoneda } from '../../utils/formatearMoneda';
import { formatearCantidad } from '../../utils/formatearCantidad';
import { getStockStatus, STOCK_THRESHOLDS } from '../../constants/stockThresholds';

export default function ConsultaStock() {
  useAuth();

  const [categorias, setCategorias] = useState([]);
  const [searchTermInput, setSearchTermInput] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(30);
  const [sortBy, setSortBy] = useState('stock_actual');
  const [sortOrder, setSortOrder] = useState('asc');

  const { productos, total, loading, paginaActual, porPagina, filtros, setFiltros, cargarProductos } =
    useProductosListado();

  const cargarCategorias = async () => {
    try {
      const response = await axiosAuth.get('/productos/categorias');
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      toast.error('Error al cargar categorías');
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleRefetch = useCallback((opciones = {}) => {
    cargarProductos(opciones);
  }, [cargarProductos]);

  useEffect(() => {
    if (!autoRefreshEnabled || modalAbierto) return undefined;
    const intervalId = setInterval(() => {
      handleRefetch({ fresh: true });
    }, autoRefreshSeconds * 1000);
    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, autoRefreshSeconds, handleRefetch, modalAbierto]);

  const handleBuscar = useCallback(() => {
    const nuevosFiltros = { ...filtros, search: searchTermInput.trim() };
    setFiltros(nuevosFiltros);
    cargarProductos({ filtros: nuevosFiltros, pagina: 1 });
  }, [cargarProductos, filtros, searchTermInput, setFiltros]);

  const handleLimpiarBusqueda = useCallback(() => {
    setSearchTermInput('');
    const nuevosFiltros = { ...filtros, search: '' };
    setFiltros(nuevosFiltros);
    cargarProductos({ filtros: nuevosFiltros, pagina: 1 });
  }, [cargarProductos, filtros, setFiltros]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleBuscar();
    },
    [handleBuscar]
  );

  const handleFiltrosChange = useCallback(
    (nuevosFiltros) => {
      setFiltros(nuevosFiltros);
      cargarProductos({ filtros: nuevosFiltros, pagina: 1 });
    },
    [cargarProductos, setFiltros]
  );

  const handleLimpiarFiltros = useCallback(() => {
    const sinFiltros = { ...filtros, categoria_id: '', unidad_medida: '', stock: '' };
    setFiltros(sinFiltros);
    cargarProductos({ filtros: sinFiltros, pagina: 1 });
  }, [cargarProductos, filtros, setFiltros]);

  const handlePageChange = useCallback(
    (newPage) => {
      cargarProductos({ pagina: newPage });
    },
    [cargarProductos]
  );

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

  const productosOrdenados = useMemo(() => {
    const list = [...productos];
    list.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      if (sortBy === 'precio' || sortBy === 'stock_actual' || sortBy === 'id') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      // Desempate estable por nombre para que el listado sea más predecible.
      const nameA = String(a.nombre || '').toLowerCase();
      const nameB = String(b.nombre || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    return list;
  }, [productos, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(total / porPagina));
  const startIndex = (paginaActual - 1) * porPagina;

  const handleEditarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setModalAbierto(true);
  };

  const handleProductoActualizado = () => {
    handleRefetch();
  };

  const getStockColor = (stock) => getStockStatus(stock).color;

  const getStockText = (stock) => getStockStatus(stock).label;

  const formatearStock = (stock) => {
    const numero = parseFloat(stock || 0);
    if (numero % 1 === 0) return numero.toString();
    return numero.toFixed(1);
  };

  const columnas = [
    { key: 'nombre', label: 'Producto', sortable: true },
    { key: 'categoria_nombre', label: 'Categoría', sortable: true },
    { key: 'stock_actual', label: 'Stock Actual', sortable: true, className: 'px-3' },
    { key: 'estado_stock', label: 'Estado Stock', sortable: false, className: 'px-3' },
    { key: 'stock_reservado', label: 'Reservado', sortable: false, className: 'px-3' },
    { key: 'stock_libre', label: 'Libre', sortable: false, className: 'px-3' },
    { key: 'precio', label: 'Precio', sortable: true, className: 'px-3' },
    {
      key: 'acciones',
      label: 'Acciones',
      sortable: false,
      className: 'sticky right-0 bg-gray-50 z-10 text-right min-w-[100px]',
    },
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
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>VERTIMAR | Consulta de Stock</title>
        <meta name="description" content="Consulta de stock de productos" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Consulta de Stock</h1>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  value={searchTermInput}
                  onChange={(e) => setSearchTermInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleBuscar}
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={handleLimpiarBusqueda}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefetch}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Actualizar
            </button>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              />
              Auto-refresh
            </label>
            <select
              value={autoRefreshSeconds}
              onChange={(e) => setAutoRefreshSeconds(Number(e.target.value))}
              disabled={!autoRefreshEnabled}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm disabled:opacity-60"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
            <span className="text-xs text-gray-500">
              {modalAbierto && autoRefreshEnabled ? 'Auto-refresh pausado mientras editás.' : ''}
            </span>
          </div>
        </div>

        <FiltrosProductos
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          onLimpiarFiltros={handleLimpiarFiltros}
          totalProductos={total}
        />

        <div className="bg-white rounded-lg shadow-md">
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader columns={columnas} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <tbody className="bg-white divide-y divide-gray-200">
                {productosOrdenados.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-gray-500 font-medium">No se encontraron productos</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Probá ajustando la búsqueda o los filtros.
                      </p>
                    </td>
                  </tr>
                ) : (
                  productosOrdenados.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{producto.nombre || '-'}</div>
                      <div className="text-sm text-gray-500">{producto.unidad_medida || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.categoria_nombre || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                          producto.stock_actual === 0
                            ? 'text-red-600'
                            : producto.stock_actual <= STOCK_THRESHOLDS.CRITICO
                              ? 'text-orange-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {formatearStock(producto.stock_actual)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockColor(
                          producto.stock_actual
                        )}`}
                      >
                        {getStockText(producto.stock_actual)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {formatearCantidad(producto.stock_reservado || 0)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {formatearCantidad(
                        producto.stock_libre ??
                          (producto.stock_actual - (producto.stock_reservado || 0))
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearMoneda(producto.precio || 0)}
                    </td>
                    <td className="sticky right-0 bg-white group-hover:bg-gray-50 z-10 px-4 py-4 whitespace-nowrap text-sm font-medium text-right shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                      <button
                        onClick={() => handleEditarProducto(producto)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden">
            {productosOrdenados.length === 0 && !loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 font-medium">No se encontraron productos</p>
                <p className="text-sm text-gray-400 mt-1">
                  Probá ajustando la búsqueda o los filtros.
                </p>
              </div>
            ) : (
              productosOrdenados.map((producto) => (
              <div key={producto.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{producto.nombre || '-'}</h3>
                    <p className="text-sm text-gray-500">
                      {producto.categoria_nombre || '-'} • {producto.unidad_medida || '-'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditarProducto(producto)}
                    className="ml-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex-shrink-0"
                  >
                    Editar
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Stock</p>
                      <span
                        className={`text-sm font-bold ${
                          producto.stock_actual === 0
                            ? 'text-red-600'
                            : producto.stock_actual <= STOCK_THRESHOLDS.CRITICO
                              ? 'text-orange-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {formatearStock(producto.stock_actual)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-900">
                        Libre:{' '}
                        {formatearCantidad(
                          producto.stock_libre ??
                            (producto.stock_actual - (producto.stock_reservado || 0))
                        )}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Precio</p>
                      <span className="text-sm font-medium text-gray-900">{formatearMoneda(producto.precio || 0)}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockColor(producto.stock_actual)}`}>
                    {getStockText(producto.stock_actual)}
                  </span>
                </div>
              </div>
            ))
            )}
          </div>

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

      <ModalEditarProductoStock
        producto={productoSeleccionado}
        categorias={categorias}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setProductoSeleccionado(null);
        }}
        onProductoActualizado={handleProductoActualizado}
      />
    </div>
  );
}
