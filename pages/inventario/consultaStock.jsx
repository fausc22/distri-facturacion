import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import useAuth from '../../hooks/useAuth';
import { axiosAuth } from '../../utils/apiClient';
import { useProductosListado } from '../../hooks/useProductosListado';
import FiltrosProductos from '../../components/productos/FiltrosProductos';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import { formatearMoneda } from '../../utils/formatearMoneda';

function ModalEditarProducto({ producto, isOpen, onClose, onProductoActualizado, categorias }) {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria_id: '',
    stock_actual: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        categoria_id: producto.categoria_id || '',
        stock_actual: producto.stock_actual || ''
      });
    }
  }, [producto]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!formData.categoria_id) {
      toast.error('La categoría es obligatoria');
      return;
    }
    if (formData.stock_actual === '' || isNaN(formData.stock_actual)) {
      toast.error('El stock debe ser un número válido');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosAuth.put(`/productos/actualizar-producto-basico/${producto.id}`, {
        ...formData,
        stock_actual: parseFloat(formData.stock_actual)
      });
      if (response.data.success) {
        toast.success('Producto actualizado correctamente');
        onProductoActualizado();
        onClose();
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Editar Producto: {producto?.nombre}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual *</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newValue = Math.max(0, parseFloat(formData.stock_actual || 0) - 0.5);
                  setFormData((prev) => ({ ...prev, stock_actual: newValue.toString() }));
                }}
                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300"
                disabled={loading || parseFloat(formData.stock_actual || 0) <= 0}
              >
                -0.5
              </button>
              <input
                type="number"
                name="stock_actual"
                value={formData.stock_actual}
                onChange={handleInputChange}
                className="flex-1 p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                min="0"
                step="0.5"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => {
                  const newValue = parseFloat(formData.stock_actual || 0) + 0.5;
                  setFormData((prev) => ({ ...prev, stock_actual: newValue.toString() }));
                }}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300"
                disabled={loading}
              >
                +0.5
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleSubmit}
              className={`px-6 py-2 text-white rounded-md ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar Producto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GestionProductos() {
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

  const handleRefetch = useCallback(() => {
    cargarProductos({});
  }, [cargarProductos]);

  useEffect(() => {
    if (!autoRefreshEnabled || modalAbierto) return undefined;
    const intervalId = setInterval(() => {
      handleRefetch();
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

  const handleKeyPress = useCallback(
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

  const getStockColor = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= 5) return 'bg-orange-100 text-orange-800';
    if (stock <= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockText = (stock) => {
    if (stock === 0) return 'Sin stock';
    if (stock <= 5) return 'Stock crítico';
    if (stock <= 20) return 'Stock bajo';
    return 'Stock normal';
  };

  const formatearStock = (stock) => {
    const numero = parseFloat(stock || 0);
    if (numero % 1 === 0) return numero.toString();
    return numero.toFixed(1);
  };

  const columnas = [
    { key: 'nombre', label: 'Producto', sortable: true },
    { key: 'categoria_nombre', label: 'Categoría', sortable: true },
    { key: 'stock_actual', label: 'Stock Actual', sortable: true },
    { key: 'estado_stock', label: 'Estado Stock', sortable: false },
    { key: 'precio', label: 'Precio', sortable: true },
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
                  onKeyPress={handleKeyPress}
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

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader columns={columnas} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <tbody className="bg-white divide-y divide-gray-200">
                {productosOrdenados.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{producto.nombre || '-'}</div>
                      <div className="text-sm text-gray-500">{producto.unidad_medida || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.categoria_nombre || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                          producto.stock_actual === 0
                            ? 'text-red-600'
                            : producto.stock_actual <= 5
                              ? 'text-orange-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {formatearStock(producto.stock_actual)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockColor(
                          producto.stock_actual
                        )}`}
                      >
                        {getStockText(producto.stock_actual)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearMoneda(producto.precio || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditarProducto(producto)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden">
            {productosOrdenados.map((producto) => (
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
                            : producto.stock_actual <= 5
                              ? 'text-orange-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {formatearStock(producto.stock_actual)}
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
            ))}
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

      <ModalEditarProducto
        producto={productoSeleccionado}
        categorias={categorias}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setProductoSeleccionado(null);
          handleRefetch();
        }}
        onProductoActualizado={handleProductoActualizado}
      />
    </div>
  );
}
