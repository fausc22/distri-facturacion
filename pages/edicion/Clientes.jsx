import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import useAuth from '../../hooks/useAuth';
import { useClientes } from '../../hooks/useClientes';
import SearchBar from '../../components/common/SearchBar';
import TableHeader from '../../components/common/TableHeader';
import Pagination from '../../components/common/Pagination';
import ModalCliente from '../../components/clientes/ModalCliente';

export default function GestionClientes() {
  useAuth();

  const { buscarClientes, loading } = useClientes();
  
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Ordenamiento
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  // Cargar clientes
  const cargarClientes = async () => {
    const resultado = await buscarClientes(searchTerm);
    if (resultado.success) {
      setClientes(resultado.data);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarClientes();
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
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>VERTIMAR | Gestión de Clientes</title>
        <meta name="description" content="Gestión de clientes" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Gestión de Clientes
          </h1>
          
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            placeholder="Buscar por nombre, CUIT, ciudad..."
            loading={loading}
            extraButtons={
              <button
                onClick={handleNuevoCliente}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Cliente
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
                      <div className="text-sm font-medium text-gray-900">
                        {cliente.nombre || '-'}
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
                      <button
                        onClick={() => handleEditarCliente(cliente)}
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

          {/* Vista móvil */}
          <div className="lg:hidden">
            {clientesPaginados.map((cliente) => (
              <div key={cliente.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {cliente.nombre || '-'}
                    </h3>
                    {cliente.nombre_alternativo && (
                      <p className="text-xs text-gray-500">{cliente.nombre_alternativo}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {cliente.condicion_iva || '-'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditarCliente(cliente)}
                    className="ml-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex-shrink-0"
                  >
                    Editar
                  </button>
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

      {/* Modal */}
      <ModalCliente
        cliente={clienteSeleccionado}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setClienteSeleccionado(null);
        }}
        onClienteGuardado={handleClienteGuardado}
        modo={modoModal}
      />
    </div>
  );
}