import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import { useClientes } from '../../hooks/useClientes';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import ModalCliente from '../../components/clientes/ModalCliente';
import ModalBase from '../../components/common/ModalBase';

export default function GestionClientes() {
  const { user } = useAuth();
  const router = useRouter();
  const puedeGestionarClientes = ['GERENTE', 'VENDEDOR'].includes(user?.rol);
  const esGerente = user?.rol === 'GERENTE';

  const { buscarClientes, eliminarCliente, loading, loadingBusqueda } = useClientes();
  
  const [clientes, setClientes] = useState([]);
  /** Texto en el input (borrador; no dispara API hasta Buscar / Enter). */
  const [searchInput, setSearchInput] = useState('');
  /** Término enviado al backend (alineado a Productos: búsqueda explícita). */
  const [searchQuery, setSearchQuery] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [totalClientes, setTotalClientes] = useState(0);
  
  // Ordenamiento
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const searchInputRef = useRef(null);
  const searchHadFocusRef = useRef(false);

  useEffect(() => {
    if (user && !puedeGestionarClientes) {
      router.push('/inicio');
    }
  }, [user, puedeGestionarClientes, router]);

  const cargarClientes = useCallback(async ({
    pagina = currentPage,
    termino = searchQuery,
    ordenCampo = sortBy,
    ordenDireccion = sortOrder
  } = {}) => {
    const resultado = await buscarClientes(termino, {
      pagina,
      porPagina: itemsPerPage,
      sortBy: ordenCampo,
      sortOrder: ordenDireccion
    });
    if (resultado.success && !resultado.stale) {
      setClientes(resultado.data);
      setTotalClientes(Number(resultado.total || 0));
    }
  }, [buscarClientes, currentPage, searchQuery, sortBy, sortOrder]);

  /**
   * Una sola fuente de recarga: página actual, orden y término aplicado (searchQuery).
   * El texto del input (searchInput) no está en las dependencias: no se busca al escribir.
   */
  useEffect(() => {
    if (!puedeGestionarClientes) return;
    cargarClientes();
  }, [puedeGestionarClientes, cargarClientes]);

  useEffect(() => {
    if (!loadingBusqueda && searchHadFocusRef.current && searchInputRef.current) {
      searchInputRef.current.focus({ preventScroll: true });
    }
  }, [loadingBusqueda]);

  const handleBuscar = useCallback(() => {
    const q = searchInput.trim();
    setSearchQuery(q);
    setCurrentPage(1);
  }, [searchInput]);

  const handleLimpiarBusqueda = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBuscar();
      }
    },
    [handleBuscar]
  );

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
    setCurrentPage(1);
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
    cargarClientes({ pagina: currentPage, termino: searchQuery });
  }, [cargarClientes, currentPage, searchQuery]);

  const handleCloseModal = useCallback(() => {
    setModalAbierto(false);
    setClienteSeleccionado(null);
  }, []);

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
        cargarClientes({ pagina: currentPage, termino: searchQuery });
      }
    } finally {
      setEliminando(false);
    }
  }, [clienteAEliminar, eliminando, eliminarCliente, cargarClientes, currentPage, searchQuery]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(totalClientes / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const clientesPaginados = clientes;

  const columnas = [
    { key: 'nombre', label: 'Nombre', sortable: true, className: '!px-2 sm:!px-2.5 !py-2' },
    { key: 'condicion_iva', label: 'Condición', sortable: true, className: '!px-2 sm:!px-2.5 !py-2' },
    { key: 'cuit', label: 'CUIT', sortable: true, className: '!px-2 sm:!px-2.5 !py-2' },
    { key: 'direccion', label: 'Dirección', sortable: true, className: '!px-2 sm:!px-2.5 !py-2' },
    { key: 'ciudad', label: 'Ciudad', sortable: true, className: '!px-2 sm:!px-2.5 !py-2' },
    { key: 'acciones', label: 'Acciones', sortable: false, className: '!px-2 sm:!px-2.5 !py-2 text-right' }
  ];

  if (!user || !puedeGestionarClientes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">
            No tenés permisos para acceder a la gestión de clientes.
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

  const emptyState = (
    <div className="px-4 py-12 text-center">
      <p className="text-gray-500 font-medium">No se encontraron clientes</p>
      <p className="text-sm text-gray-400 mt-1">
        Probá con otro término de búsqueda o creá un cliente nuevo.
      </p>
      <button
        type="button"
        onClick={handleNuevoCliente}
        className="mt-4 min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 touch-manipulation"
      >
        Nuevo cliente
      </button>
    </div>
  );

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

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative min-w-0">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => {
                      searchHadFocusRef.current = true;
                    }}
                    onBlur={() => {
                      searchHadFocusRef.current = false;
                    }}
                    placeholder="Buscar por nombre, CUIT, ciudad..."
                    disabled={loadingBusqueda}
                    className="w-full min-h-[44px] py-2.5 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation disabled:opacity-60"
                  />
                  <svg
                    className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none"
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
                  disabled={loadingBusqueda}
                  className="min-h-[44px] min-w-[44px] px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium whitespace-nowrap touch-manipulation"
                >
                  {loadingBusqueda ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
                {(searchInput.trim() || searchQuery) && (
                  <button
                    type="button"
                    onClick={handleLimpiarBusqueda}
                    disabled={loadingBusqueda}
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
                onClick={handleNuevoCliente}
                className="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium whitespace-nowrap touch-manipulation shrink-0"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nuevo Cliente</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>

            {/* Contador */}
            <div className="mt-4 text-sm text-gray-600">
              Total de clientes: <span className="font-semibold">{totalClientes}</span>
              {loadingBusqueda && <span className="ml-2 text-blue-600">Buscando...</span>}
            </div>
          </div>

          {/* Tabla — desktop: table-fixed + anchos % para evitar scroll horizontal */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
          <div className="hidden lg:block w-full">
            <table className="w-full table-fixed divide-y divide-gray-200 text-sm">
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <TableHeader
                columns={columnas}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{emptyState}</td>
                  </tr>
                ) : (
                  clientesPaginados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 sm:px-2.5 align-top min-w-0">
                      <div className="flex items-start gap-1 min-w-0">
                        <div
                          className="text-sm font-medium text-gray-900 truncate min-w-0 flex-1"
                          title={cliente.nombre || ''}
                        >
                          {cliente.nombre || '-'}
                        </div>
                        {cliente.validado_afip_at && (
                          <span className="inline-flex flex-shrink-0 items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800" title="Validado en AFIP">
                            AFIP
                          </span>
                        )}
                      </div>
                      {cliente.nombre_alternativo && (
                        <div className="text-xs text-gray-500 truncate mt-0.5" title={cliente.nombre_alternativo}>
                          {cliente.nombre_alternativo}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-2 py-2.5 sm:px-2.5 align-top text-gray-900"
                      title={cliente.condicion_iva || ''}
                    >
                      <span className="line-clamp-2 text-xs leading-snug">{cliente.condicion_iva || '-'}</span>
                    </td>
                    <td className="px-2 py-2.5 sm:px-2.5 align-top text-xs text-gray-900 tabular-nums whitespace-nowrap">
                      {cliente.cuit || '-'}
                    </td>
                    <td className="px-2 py-2.5 sm:px-2.5 align-top text-gray-900 min-w-0">
                      <span className="line-clamp-2 text-xs leading-snug" title={cliente.direccion || ''}>
                        {cliente.direccion || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 sm:px-2.5 align-top text-gray-900 min-w-0">
                      <div className="truncate text-xs" title={cliente.ciudad || ''}>{cliente.ciudad || '-'}</div>
                      {cliente.provincia && (
                        <div className="text-[11px] text-gray-500 truncate" title={cliente.provincia}>{cliente.provincia}</div>
                      )}
                    </td>
                    <td className="px-2 py-2.5 sm:px-2.5 align-middle text-right">
                      <div className="flex flex-row flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditarCliente(cliente)}
                          className="min-h-[36px] px-2 py-1.5 inline-flex items-center justify-center text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded border border-blue-200/80 touch-manipulation"
                        >
                          Editar
                        </button>
                        {esGerente && (
                          <button
                            type="button"
                            onClick={() => handleSolicitarEliminar(cliente)}
                            className="min-h-[36px] px-2 py-1.5 inline-flex items-center justify-center text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded border border-red-200/80 touch-manipulation"
                            title="Eliminar cliente"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista móvil — Fase 4: touch targets y scroll */}
          <div className="lg:hidden touch-manipulation">
            {clientesPaginados.length === 0 ? (
              emptyState
            ) : (
              clientesPaginados.map((cliente) => (
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
                    {esGerente && (
                      <button
                        type="button"
                        onClick={() => handleSolicitarEliminar(cliente)}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 active:bg-red-800 touch-manipulation"
                        title="Eliminar cliente"
                      >
                        Eliminar
                      </button>
                    )}
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
            ))
            )}
          </div>

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            totalItems={totalClientes}
            onPageChange={(page) => setCurrentPage(page)}
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
        isOpen={esGerente && !!clienteAEliminar}
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
            Esta acción es permanente. Si el cliente tiene pedidos asociados, no podrá eliminarse.
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