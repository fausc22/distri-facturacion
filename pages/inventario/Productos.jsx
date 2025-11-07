import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import useAuth from '../../hooks/useAuth';
import { useProductos } from '../../hooks/useProductos';
import SearchBar from '../../components/common/SearchBar';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import ModalProducto from '../../components/productos/ModalProducto';

export default function GestionProductos() {
  useAuth();

  const { buscarProductos, loading } = useProductos();

  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Ordenamiento
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  // Cargar productos
  const cargarProductos = async () => {
    const resultado = await buscarProductos(searchTerm);
    if (resultado.success) {
      setProductos(resultado.data);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarProductos();
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Ordenamiento
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

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

  // Paginación
  const totalPages = Math.ceil(productosOrdenados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const productosPaginados = productosOrdenados.slice(startIndex, startIndex + itemsPerPage);

  const handleNuevoProducto = () => {
    setProductoSeleccionado(null);
    setModoModal('crear');
    setModalAbierto(true);
  };

  const handleEditarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setModoModal('editar');
    setModalAbierto(true);
  };

  const handleProductoGuardado = () => {
    cargarProductos();
  };

  const columnas = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'categoria_nombre', label: 'Categoría', sortable: true },
    { key: 'unidad_medida', label: 'U.M.', sortable: true },
    { key: 'precio', label: 'Precio', sortable: true },
    { key: 'stock_actual', label: 'Stock', sortable: true },
    { key: 'acciones', label: 'Editar', sortable: false }
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
        <title>VERTIMAR | Gestión de Productos</title>
        <meta name="description" content="Gestión de productos e inventario" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Gestión de Productos
          </h1>

          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            placeholder="Buscar por nombre, categoría, ID..."
            loading={loading}
            extraButtons={
              <button
                onClick={handleNuevoProducto}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Producto
              </button>
            }
          />

          {/* Contador */}
          <div className="mt-4 text-sm text-gray-600">
            Total de productos: <span className="font-semibold">{productos.length}</span>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Vista desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
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
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
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
                          {producto.stock_actual || 0} unid.
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium w-24">
                        <button
                          onClick={() => handleEditarProducto(producto)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors w-full"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista móvil */}
          <div className="lg:hidden">
            {productosPaginados.map((producto) => {
              const stockBajo = producto.stock_actual < 10;

              return (
                <div key={producto.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {producto.nombre}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {producto.categoria_nombre || 'Sin categoría'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditarProducto(producto)}
                      className="ml-2 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs transition-colors flex-shrink-0"
                    >
                      Editar
                    </button>
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
                      {producto.stock_actual || 0} unid.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={productosOrdenados.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      {/* Modal */}
      <ModalProducto
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setProductoSeleccionado(null);
        }}
        producto={productoSeleccionado}
        modo={modoModal}
        onProductoGuardado={handleProductoGuardado}
      />
    </div>
  );
}
