import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import { useEmpleados } from '../../hooks/useEmpleados';
import SearchBar from '../../components/common/SearchBar';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import ModalEmpleado from '../../components/empleados/ModalEmpleado';
import ModalBase from '../../components/common/ModalBase';

const ROL_LABEL = { GERENTE: 'Gerente', VENDEDOR: 'Vendedor' };
const ROL_COLOR = {
  GERENTE: 'bg-purple-100 text-purple-800',
  VENDEDOR: 'bg-blue-100 text-blue-800'
};

export default function GestionEmpleados() {
  const { user } = useAuth();
  const router = useRouter();

  const { listarTodosEmpleados, desactivarEmpleado, reactivarEmpleado, loading } = useEmpleados();

  const [empleados, setEmpleados] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [empleadoAccion, setEmpleadoAccion] = useState(null); // { empleado, tipo: 'desactivar'|'activar' }
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      router.push('/inicio');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.rol === 'GERENTE') {
      cargarEmpleados();
    }
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cargarEmpleados = async () => {
    const resultado = await listarTodosEmpleados();
    if (resultado.success) {
      setEmpleados(resultado.data);
    } else {
      setEmpleados([]);
    }
  };

  const empleadosFiltrados = empleados.filter(empleado => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      empleado.nombre?.toLowerCase().includes(searchLower) ||
      empleado.apellido?.toLowerCase().includes(searchLower) ||
      empleado.usuario?.toLowerCase().includes(searchLower) ||
      `${empleado.nombre} ${empleado.apellido}`.toLowerCase().includes(searchLower)
    );
  });

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const empleadosOrdenados = [...empleadosFiltrados].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(empleadosOrdenados.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const empleadosPaginados = empleadosOrdenados.slice(startIndex, startIndex + itemsPerPage);

  const handleNuevoEmpleado = () => {
    setEmpleadoSeleccionado(null);
    setModoModal('crear');
    setModalAbierto(true);
  };

  const handleEditarEmpleado = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setModoModal('editar');
    setModalAbierto(true);
  };

  const handleSolicitarDesactivar = (empleado) => {
    setEmpleadoAccion({ empleado, tipo: 'desactivar' });
  };

  const handleSolicitarActivar = (empleado) => {
    setEmpleadoAccion({ empleado, tipo: 'activar' });
  };

  const handleCerrarModalAccion = () => {
    if (procesandoAccion) return;
    setEmpleadoAccion(null);
  };

  const handleConfirmarAccion = async () => {
    if (!empleadoAccion?.empleado) return;
    setProcesandoAccion(true);
    try {
      const resultado = empleadoAccion.tipo === 'desactivar'
        ? await desactivarEmpleado(empleadoAccion.empleado.id)
        : await reactivarEmpleado(empleadoAccion.empleado.id);
      if (resultado.success) {
        setEmpleadoAccion(null);
        cargarEmpleados();
      }
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleEmpleadoGuardado = () => {
    cargarEmpleados();
  };

  const columnas = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'apellido', label: 'Apellido', sortable: true },
    { key: 'usuario', label: 'Usuario', sortable: true },
    { key: 'rol', label: 'Rol', sortable: true },
    { key: 'activo', label: 'Estado', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'acciones', label: 'Acciones', sortable: false }
  ];

  const empleadosActivos = empleados.filter(e => e.activo).length;
  const empleadosInactivos = empleados.filter(e => !e.activo).length;

  if (!user || user.rol !== 'GERENTE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">
            Solo los gerentes pueden acceder a la gestión de empleados.
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

  if (loading && empleados.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  const emptyState = (
    <div className="px-4 py-12 text-center">
      <p className="text-gray-500 font-medium">No se encontraron empleados</p>
      <p className="text-sm text-gray-400 mt-1">
        Probá con otro término de búsqueda o creá un empleado nuevo.
      </p>
      <button
        type="button"
        onClick={handleNuevoEmpleado}
        className="mt-4 min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 touch-manipulation"
      >
        Nuevo empleado
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>VERTIMAR | Gestión de Empleados</title>
        <meta name="description" content="Gestión de empleados" />
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Gestión de Empleados
          </h1>

          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            placeholder="Buscar por nombre, apellido o usuario..."
            loading={loading}
            extraButtons={
              <button
                type="button"
                onClick={handleNuevoEmpleado}
                className="min-h-[44px] px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Empleado
              </button>
            }
          />

          <div className="mt-4 text-sm text-gray-600">
            Total de empleados: <span className="font-semibold">{empleados.length}</span>
            {' '}
            (<span className="text-green-600 font-medium">{empleadosActivos} activos</span>,
            {' '}
            <span className="text-red-600 font-medium">{empleadosInactivos} inactivos</span>)
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
                {empleadosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={8}>{emptyState}</td>
                  </tr>
                ) : (
                  empleadosPaginados.map((empleado) => (
                    <tr key={empleado.id} className={`hover:bg-gray-50 ${!empleado.activo ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {empleado.nombre || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empleado.apellido || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empleado.usuario || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ROL_COLOR[empleado.rol] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {ROL_LABEL[empleado.rol] || empleado.rol || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          empleado.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empleado.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empleado.telefono || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empleado.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditarEmpleado(empleado)}
                            className="min-h-[36px] text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors touch-manipulation"
                          >
                            Editar
                          </button>
                          {empleado.activo ? (
                            <button
                              type="button"
                              onClick={() => handleSolicitarDesactivar(empleado)}
                              className="min-h-[36px] text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors touch-manipulation"
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSolicitarActivar(empleado)}
                              className="min-h-[36px] text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors touch-manipulation"
                            >
                              Activar
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

          {/* Vista móvil */}
          <div className="lg:hidden">
            {empleadosPaginados.length === 0 ? (
              emptyState
            ) : (
              empleadosPaginados.map((empleado) => (
                <div key={empleado.id} className={`border-b border-gray-200 p-4 hover:bg-gray-50 ${!empleado.activo ? 'bg-red-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">
                        {empleado.nombre} {empleado.apellido}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{empleado.usuario}
                      </p>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ROL_COLOR[empleado.rol] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {ROL_LABEL[empleado.rol] || empleado.rol || '-'}
                        </span>
                        {' '}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          empleado.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empleado.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Tel:</span>
                      <span className="ml-1 text-gray-900">{empleado.telefono || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-1 text-gray-900">{empleado.email || '-'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditarEmpleado(empleado)}
                      className="flex-1 min-h-[44px] px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 touch-manipulation"
                    >
                      Editar
                    </button>
                    {empleado.activo ? (
                      <button
                        type="button"
                        onClick={() => handleSolicitarDesactivar(empleado)}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 touch-manipulation"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSolicitarActivar(empleado)}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 touch-manipulation"
                      >
                        Activar
                      </button>
                    )}
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
            totalItems={empleadosOrdenados.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <ModalEmpleado
        empleado={empleadoSeleccionado}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setEmpleadoSeleccionado(null);
        }}
        onEmpleadoGuardado={handleEmpleadoGuardado}
        modo={modoModal}
      />

      <ModalBase
        isOpen={!!empleadoAccion}
        onClose={handleCerrarModalAccion}
        title={empleadoAccion?.tipo === 'desactivar' ? 'Desactivar empleado' : 'Activar empleado'}
        size="sm"
        closeOnEscape
        closeOnOverlay
        showHeader={true}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {empleadoAccion?.tipo === 'desactivar'
              ? <>¿Seguro que querés desactivar a <span className="font-semibold">{empleadoAccion?.empleado?.nombre} {empleadoAccion?.empleado?.apellido}</span>?</>
              : <>¿Deseás activar a <span className="font-semibold">{empleadoAccion?.empleado?.nombre} {empleadoAccion?.empleado?.apellido}</span>?</>
            }
          </p>
          {empleadoAccion?.tipo === 'desactivar' && (
            <p className="text-xs text-gray-500">
              El empleado no podrá iniciar sesión mientras esté inactivo.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCerrarModalAccion}
              disabled={procesandoAccion}
              className="min-h-[44px] px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarAccion}
              disabled={procesandoAccion}
              className={`min-h-[44px] min-w-[44px] px-4 py-2 text-white rounded-md touch-manipulation ${
                procesandoAccion
                  ? 'bg-gray-400 cursor-not-allowed'
                  : empleadoAccion?.tipo === 'desactivar'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {procesandoAccion
                ? 'Procesando...'
                : empleadoAccion?.tipo === 'desactivar'
                  ? 'Sí, desactivar'
                  : 'Sí, activar'}
            </button>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
