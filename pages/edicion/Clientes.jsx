import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import useAuth from '../../hooks/useAuth';
import { useClientes } from '../../hooks/useClientes';
import SearchBar from '../../components/common/SearchBar';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import ModalCliente from '../../components/clientes/ModalCliente';
import ModalBase from '../../components/common/ModalBase';

export default function GestionClientes() {
  useAuth();

  const { buscarClientes, eliminarCliente, loading } = useClientes();
  
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Ordenamiento
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  // Cargar clientes (Fase 5: estable para efectos y callbacks)
  const cargarClientes = useCallback(async () => {
    const resultado = await buscarClientes(searchTerm);
    if (resultado.success) {
      setClientes(resultado.data);
    }
  }, [buscarClientes, searchTerm]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      cargarClientes();
      return;
    }
    const timeoutId = setTimeout(() => {
      cargarClientes();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, cargarClientes]);

  // Fase 5: callbacks estables para evitar re-renders en hijos
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

  const handleNuevoCliente = useCallback(() => {
    setClienteSeleccionado(null);
    setModoModal('crear');
    setModalAbierto(true);
  }, []);

  const handleEditarCliente = useCallback((cliente) => {
    setClienteSeleccionado(cliente);
    setModoModal('editar');
    setModalAbierto(true);
  }, []);

  const handleClienteGuardado = useCallback(() => {
    cargarClientes();
  }, [cargarClientes]);

  const handleCloseModal = useCallback(() => {
    setModalAbierto(false);
    setClienteSeleccionado(null);
  }, []);

  const handleClearSearch = useCallback(() => setSearchTerm(''), []);

  const handleSolicitarEliminar = useCallback((cliente) => {
    setClienteAEliminar(cliente);
  }, []);

  const handleCerrarModalEliminar = useCallback(() => {
    if (!eliminando) {
      setClienteAEliminar(null);
    }
  }, [eliminando]);

  const handleConfirmarEliminar = useCallback(async () => {
    if (!clienteAEliminar || eliminando) return;
    setEliminando(true);
    try {
      const resultado = await eliminarCliente(clienteAEliminar.id);
      if (resultado.success) {
        setClienteAEliminar(null);
        cargarClientes();
      }
    } finally {
      setEliminando(false);
    }
  }, [clienteAEliminar, eliminando, eliminarCliente, cargarClientes]);

  const clientesOrdenados = [...clientes].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(clientesOrdenados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const clientesPaginados = clientesOrdenados.slice(startIndex, startIndex + itemsPerPage);

  const handleNuevoCliente = () => {
    setClienteSeleccionado(null);
    setModoModal('crear');
    setModalAbierto(true);
  };

  const handleEditarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setModoModal('editar');
    setModalAbierto(true);
  };

  const handleClienteGuardado = () => {
    cargarClientes();
  };

  const columnas = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'condicion_iva', label: 'Condición', sortable: true },
    { key: 'cuit', label: 'CUIT', sortable: true },
    { key: 'direccion', label: 'Dirección', sortable: true },
    { key: 'ciudad', label: 'Ciudad', sortable: true },
    { key: 'acciones', label: 'Acciones', sortable: false }
  ];

  if (loading && clientes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>VERTIMAR | Gestión de Clientes</title>
        <meta name="description" content="Gestión de clientes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-8">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              Gestión de Clientes
            </h1>

            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={handleClearSearch}
              placeholder="Buscar por nombre, CUIT, ciudad..."
              loading={loading}
              extraButtons={
                <button
                  type="button"
                  onClick={handleNuevoCliente}
                  className="min-h-[44px] min-w-[44px] px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Nuevo Cliente</span>
                </button>
              }
            />

            {/* Contador */}
            <div className="mt-4 text-sm text-gray-600">
              Total de clientes: <span className="font-semibold">{clientes.length}</span>
            </div>
          </div>

          {/* Tabla */}
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
                {clientesPaginados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.nombre || '-'}
                        </div>
                        {cliente.validado_afip_at && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Validado en AFIP">
                            AFIP
                          </span>
                        )}
                      </div>
                      {cliente.nombre_alternativo && (
                        <div className="text-xs text-gray-500">
                          {cliente.nombre_alternativo}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.condicion_iva || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.cuit || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {cliente.direccion || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{cliente.ciudad || '-'}</div>
                      {cliente.provincia && (
                        <div className="text-xs text-gray-500">{cliente.provincia}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditarCliente(cliente)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-3 py-2 rounded-md transition-colors touch-manipulation"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSolicitarEliminar(cliente)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 active:bg-red-200 px-3 py-2 rounded-md transition-colors touch-manipulation"
                          title="Eliminar cliente"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil — Fase 4: touch targets y scroll */}
          <div className="lg:hidden touch-manipulation">
            {clientesPaginados.map((cliente) => (
              <div key={cliente.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 active:bg-gray-100">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                      {cliente.nombre || '-'}
                      {cliente.validado_afip_at && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">AFIP</span>
                      )}
                    </h3>
                    {cliente.nombre_alternativo && (
                      <p className="text-xs text-gray-500">{cliente.nombre_alternativo}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {cliente.condicion_iva || '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditarCliente(cliente)}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 active:bg-blue-800 touch-manipulation"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSolicitarEliminar(cliente)}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 active:bg-red-800 touch-manipulation"
                      title="Eliminar cliente"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-500">CUIT:</span>
                    <span className="ml-1 text-gray-900">{cliente.cuit || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dirección:</span>
                    <span className="ml-1 text-gray-900">{cliente.direccion || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ciudad:</span>
                    <span className="ml-1 text-gray-900">
                      {cliente.ciudad || '-'}{cliente.provincia && `, ${cliente.provincia}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            totalItems={clientesOrdenados.length}
            onPageChange={setCurrentPage}
          />
        </div>
        </div>
      </main>

      {/* Modal crear/editar */}
      <ModalCliente
        cliente={clienteSeleccionado}
        isOpen={modalAbierto}
        onClose={handleCloseModal}
        onClienteGuardado={handleClienteGuardado}
        modo={modoModal}
      />

      {/* Modal confirmar eliminar (Fase 6) */}
      <ModalBase
        isOpen={!!clienteAEliminar}
        onClose={handleCerrarModalEliminar}
        title="Eliminar cliente"
        size="sm"
        closeOnEscape
        closeOnOverlay
        showHeader={true}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            ¿Seguro que querés eliminar al cliente{' '}
            <span className="font-semibold">{clienteAEliminar?.nombre || ''}</span>?
          </p>
          <p className="text-xs text-gray-500">
            Esta acción es permanente. Si el cliente tiene pedidos o ventas asociados, puede haber restricciones en base de datos.
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCerrarModalEliminar}
              disabled={eliminando}
              className="min-h-[44px] px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarEliminar}
              disabled={eliminando}
              className={`min-h-[44px] min-w-[44px] px-4 py-2 text-white rounded-md touch-manipulation ${
                eliminando ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
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