import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import { useProveedores } from '../../hooks/useProveedores';
import SearchBar from '../../components/common/SearchBar';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import ModalProveedor from '../../components/proveedores/ModalProveedor';
import ModalBase from '../../components/common/ModalBase';

export default function GestionProveedores() {
  const { user } = useAuth();
  const router = useRouter();

  const { buscarProveedores, eliminarProveedor, loading, loadingBusqueda } = useProveedores();

  const [proveedores, setProveedores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [totalProveedores, setTotalProveedores] = useState(0);

  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      router.push('/inicio');
    }
  }, [user, router]);

  const cargarProveedores = useCallback(async ({
    pagina = currentPage,
    termino = searchTerm,
    ordenCampo = sortBy,
    ordenDireccion = sortOrder
  } = {}) => {
    const resultado = await buscarProveedores(termino, {
      pagina,
      porPagina: itemsPerPage,
      sortBy: ordenCampo,
      sortOrder: ordenDireccion
    });
    if (resultado.success && !resultado.stale && !resultado.cancelled) {
      setProveedores(resultado.data);
      setTotalProveedores(Number(resultado.total || 0));
    }
  }, [buscarProveedores, currentPage, searchTerm, sortBy, sortOrder]);

  // Una sola fuente de carga: debounce sobre searchTerm + página/orden
  useEffect(() => {
    if (!user || user.rol !== 'GERENTE') return undefined;

    const timeoutId = setTimeout(() => {
      cargarProveedores();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [user, cargarProveedores]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalProveedores / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const proveedoresPaginados = proveedores;

  const handleNuevoProveedor = () => {
    setProveedorSeleccionado(null);
    setModoModal('crear');
    setModalAbierto(true);
  };

  const handleEditarProveedor = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setModoModal('editar');
    setModalAbierto(true);
  };

  const handleProveedorGuardado = () => {
    cargarProveedores();
  };

  const handleSolicitarEliminar = (proveedor) => {
    setProveedorAEliminar(proveedor);
  };

  const handleCerrarModalEliminar = () => {
    if (eliminando) return;
    setProveedorAEliminar(null);
  };

  const handleConfirmarEliminar = async () => {
    if (!proveedorAEliminar?.id) return;
    setEliminando(true);
    try {
      const resultado = await eliminarProveedor(proveedorAEliminar.id);
      if (resultado.success) {
        setProveedorAEliminar(null);
        cargarProveedores();
      }
    } finally {
      setEliminando(false);
    }
  };

  const columnas = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'condicion_iva', label: 'Condición', sortable: true },
    { key: 'cuit', label: 'CUIT', sortable: true },
    { key: 'direccion', label: 'Dirección', sortable: true },
    { key: 'ciudad', label: 'Ciudad', sortable: true },
    { key: 'acciones', label: 'Acciones', sortable: false }
  ];

  if (!user || user.rol !== 'GERENTE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">
            Solo los gerentes pueden acceder a la gestión de proveedores.
          </p>
          <button
            type="button"
            onClick={() => router.push('/inicio')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (loading && proveedores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  const emptyState = (
    <div className="px-4 py-12 text-center">
      <p className="text-gray-500 font-medium">No se encontraron proveedores</p>
      <p className="text-sm text-gray-400 mt-1">
        Probá con otro término de búsqueda o creá un proveedor nuevo.
      </p>
      <button
        type="button"
        onClick={handleNuevoProveedor}
        className="mt-4 min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 touch-manipulation"
      >
        Nuevo proveedor
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>VERTIMAR | Gestión de Proveedores</title>
        <meta name="description" content="Gestión de proveedores" />
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Gestión de Proveedores
          </h1>

          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            placeholder="Buscar por nombre, CUIT, ciudad..."
            loading={loadingBusqueda}
            extraButtons={
              <button
                type="button"
                onClick={handleNuevoProveedor}
                className="min-h-[44px] px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Proveedor
              </button>
            }
          />

          <div className="mt-4 text-sm text-gray-600">
            Total de proveedores: <span className="font-semibold">{totalProveedores}</span>
            {loadingBusqueda && <span className="ml-2 text-blue-600">Buscando...</span>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Vista desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader
                columns={columnas}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <tbody className="bg-white divide-y divide-gray-200">
                {proveedoresPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{emptyState}</td>
                  </tr>
                ) : (
                  proveedoresPaginados.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {proveedor.nombre || '-'}
                        </div>
                        {proveedor.nombre_alternativo && (
                          <div className="text-xs text-gray-500">
                            {proveedor.nombre_alternativo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {proveedor.condicion_iva || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {proveedor.cuit || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {proveedor.direccion || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{proveedor.ciudad || '-'}</div>
                        {proveedor.provincia && (
                          <div className="text-xs text-gray-500">{proveedor.provincia}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditarProveedor(proveedor)}
                            className="min-h-[36px] text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors touch-manipulation"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSolicitarEliminar(proveedor)}
                            className="min-h-[36px] text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors touch-manipulation"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista móvil */}
          <div className="lg:hidden">
            {proveedoresPaginados.length === 0 ? (
              emptyState
            ) : (
              proveedoresPaginados.map((proveedor) => (
                <div key={proveedor.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {proveedor.nombre || '-'}
                      </h3>
                      {proveedor.nombre_alternativo && (
                        <p className="text-xs text-gray-500">{proveedor.nombre_alternativo}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {proveedor.condicion_iva || '-'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditarProveedor(proveedor)}
                        className="min-h-[44px] px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 touch-manipulation"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSolicitarEliminar(proveedor)}
                        className="min-h-[44px] px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 touch-manipulation"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-500">CUIT:</span>
                      <span className="ml-1 text-gray-900">{proveedor.cuit || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Dirección:</span>
                      <span className="ml-1 text-gray-900">{proveedor.direccion || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ciudad:</span>
                      <span className="ml-1 text-gray-900">
                        {proveedor.ciudad || '-'}{proveedor.provincia && `, ${proveedor.provincia}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            totalItems={totalProveedores}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <ModalProveedor
        proveedor={proveedorSeleccionado}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setProveedorSeleccionado(null);
        }}
        onProveedorGuardado={handleProveedorGuardado}
        modo={modoModal}
      />

      <ModalBase
        isOpen={!!proveedorAEliminar}
        onClose={handleCerrarModalEliminar}
        title="Eliminar proveedor"
        size="sm"
        closeOnEscape
        closeOnOverlay
        showHeader={true}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            ¿Seguro que querés eliminar al proveedor{' '}
            <span className="font-semibold">{proveedorAEliminar?.nombre || ''}</span>?
          </p>
          <p className="text-xs text-gray-500">
            Esta acción es permanente. Las compras asociadas conservarán el nombre denormalizado del proveedor.
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCerrarModalEliminar}
              disabled={eliminando}
              className="min-h-[44px] px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarEliminar}
              disabled={eliminando}
              className={`min-h-[44px] min-w-[44px] px-4 py-2 text-white rounded-md touch-manipulation ${
                eliminando ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
