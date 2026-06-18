import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MdSearch, MdDeleteForever, MdPersonAdd } from "react-icons/md";
import { useContextoCompartido } from '../../hooks/shared/useContextoCompartido';
import { useClienteSearch } from '../../hooks/useBusquedaClientes';
import ModalCrearClienteRapido from './ModalCrearClienteRapido';
import ModalSeleccionClientes, { PanelDetalleCliente } from './ModalSeleccionClientes';

function DetallesClienteListaPrecios({ cliente, onEditar, puedeEditar }) {
  const [expandido, setExpandido] = useState(false);

  if (!cliente) return null;

  return (
    <PanelDetalleCliente
      cliente={cliente}
      expandido={expandido}
      onToggle={() => setExpandido(!expandido)}
      onEditar={onEditar}
      puedeEditar={puedeEditar}
      className="bg-primary-dark p-4 rounded mt-2 text-sm text-white"
    />
  );
}

export default function ClienteSelectorListaPrecios({
  contextAdapter,
  allowCreate = true,
  containerClassName = 'bg-primary-dark text-white p-6 rounded-lg flex-1 min-w-0 md:min-w-[300px]',
  title = 'Cliente',
}) {
  const sharedContext = useContextoCompartido();
  const { cliente, setCliente, clearCliente } = contextAdapter || sharedContext;
  const {
    busqueda,
    setBusqueda,
    resultados,
    loading,
    mostrarModal,
    setMostrarModal,
    buscarCliente,
    limpiarBusqueda,
    cargarMasResultados,
    hasMore
  } = useClienteSearch();

  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);

  const handleSeleccionarCliente = (clienteSeleccionado) => {
    setCliente(clienteSeleccionado);
    setMostrarModal(false);
    limpiarBusqueda();
  };

  const handleLimpiarCliente = () => {
    clearCliente();
    limpiarBusqueda();
  };

  const handleClienteCreado = (nuevoCliente) => {
    const id = nuevoCliente?.id ?? nuevoCliente?.ID;
    if (!allowCreate || !nuevoCliente || id == null) {
      toast.error('No se pudo obtener el cliente creado. Buscá el cliente por nombre.');
      return;
    }
    setCliente({ ...nuevoCliente, id: Number(id) });
    setMostrarModalCrear(false);
    setMostrarModalEditar(false);
  };

  const handleEditarCliente = () => {
    if (!cliente) return;
    setMostrarModalEditar(true);
  };

  return (
    <div className={containerClassName}>
      <h2 className="text-2xl font-semibold mb-4 text-center">{title}</h2>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={cliente ? cliente.nombre : busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            disabled={!!cliente}
            className="w-full p-2 rounded text-black"
          />
          <button
            onClick={buscarCliente}
            disabled={!!cliente || loading}
            className="p-2 rounded bg-white text-blue-900 hover:bg-sky-300 transition disabled:opacity-50"
            title="Buscar cliente"
          >
            <MdSearch size={24} />
          </button>
          {cliente && (
            <button
              onClick={handleLimpiarCliente}
              className="p-2 rounded bg-white text-red-600 hover:bg-red-300 transition"
              title="Eliminar cliente"
            >
              <MdDeleteForever size={24} />
            </button>
          )}
        </div>

        {/* Botón para crear nuevo cliente */}
        {!cliente && allowCreate && (
          <button
            onClick={() => setMostrarModalCrear(true)}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <MdPersonAdd size={20} />
            Crear Nuevo Cliente
          </button>
        )}
      </div>

      <DetallesClienteListaPrecios
        cliente={cliente}
        onEditar={handleEditarCliente}
        puedeEditar={!!cliente}
      />

      {mostrarModal && (
        <ModalSeleccionClientes
          resultados={resultados}
          onSeleccionar={handleSeleccionarCliente}
          onCerrar={() => setMostrarModal(false)}
          loading={loading}
          onVerMas={cargarMasResultados}
          hasMore={hasMore}
        />
      )}

      {allowCreate && (
        <ModalCrearClienteRapido
          isOpen={mostrarModalCrear}
          onClose={() => setMostrarModalCrear(false)}
          onClienteCreado={handleClienteCreado}
        />
      )}

      {cliente && (
        <ModalCrearClienteRapido
          isOpen={mostrarModalEditar}
          onClose={() => setMostrarModalEditar(false)}
          onClienteCreado={handleClienteCreado}
          clienteEditar={cliente}
          modo="editar"
        />
      )}
    </div>
  );
}