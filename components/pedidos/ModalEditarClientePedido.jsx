// components/pedidos/ModalEditarClientePedido.jsx
import { useState, useEffect } from 'react';
import { MdClose, MdSearch, MdPersonAdd } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useClienteSearch } from '../../hooks/useBusquedaClientes';
import ModalCrearClienteRapido from './ModalCrearClienteRapido';
import ModalBase from '../common/ModalBase';
import LoadingButton from '../common/LoadingButton';
import LoadingSpinner from '../common/LoadingSpinner';
import { Z_INDEX } from '../../constants/zIndex';

export default function ModalEditarClientePedido({
  isOpen,
  onClose,
  clienteActual,
  onClienteSeleccionado,
  onActualizarPedido
}) {
  const {
    busqueda,
    setBusqueda,
    resultados,
    loading,
    buscarCliente,
    limpiarBusqueda
  } = useClienteSearch();

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [modoModalCliente, setModoModalCliente] = useState('crear'); // 'crear' o 'editar'
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (isOpen && clienteActual) {
      setClienteSeleccionado(clienteActual);
    }
  }, [isOpen, clienteActual]);

  // Manejar apertura del modal de crear
  const handleAbrirModalCrear = () => {
    setModoModalCliente('crear');
    setClienteParaEditar(null);
    setMostrarModalCrear(true);
  };

  // Manejar apertura del modal de editar
  const handleAbrirModalEditar = () => {
    if (!clienteSeleccionado) {
      toast.error('Debe seleccionar un cliente primero');
      return;
    }
    setModoModalCliente('editar');
    setClienteParaEditar(clienteSeleccionado);
    setMostrarModalCrear(true);
  };

  // Manejar cierre del modal de crear/editar
  const handleCerrarModalCrear = () => {
    setMostrarModalCrear(false);
    setModoModalCliente('crear');
    setClienteParaEditar(null);
  };

  const handleSeleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    limpiarBusqueda();
  };

  const handleClienteCreado = (nuevoCliente) => {
    console.log('🔔 handleClienteCreado llamado con:', nuevoCliente);
    
    // Asegurar que tenemos el objeto de cliente completo
    if (!nuevoCliente || !nuevoCliente.id) {
      console.error('❌ Cliente no tiene ID:', nuevoCliente);
      toast.error('Error: Cliente creado pero sin ID');
      return;
    }
    
    // Establecer el cliente seleccionado
    setClienteSeleccionado(nuevoCliente);
    handleCerrarModalCrear();
    toast.success(`Cliente "${nuevoCliente.nombre}" creado y seleccionado correctamente`);
    console.log('✅ Cliente seleccionado:', nuevoCliente);
  };

  const handleGuardarCambios = async () => {
    if (!clienteSeleccionado) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    if (clienteSeleccionado.id === clienteActual?.id) {
      toast.info('No se detectaron cambios en el cliente');
      onClose();
      return;
    }

    setGuardando(true);
    try {
      await onActualizarPedido(clienteSeleccionado);
      onClienteSeleccionado(clienteSeleccionado);
      onClose();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast.error('Error al actualizar el cliente del pedido');
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    setClienteSeleccionado(null);
    limpiarBusqueda();
    onClose();
  };

  const handleBuscar = () => {
    if (!busqueda.trim()) {
      toast.error('Ingrese un nombre para buscar');
      return;
    }
    buscarCliente();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  // Si el modal de crear está abierto, no renderizar este modal
  if (!isOpen) return null;

  return (
    <>
      {/* Solo renderizar si no está abierto el modal de crear */}
      {!mostrarModalCrear && (
        <ModalBase
          isOpen={isOpen}
          onClose={handleClose}
          title="Cambiar Cliente del Pedido"
          size="lg"
          closeOnOverlay
          closeOnEscape
          zIndex={Z_INDEX.MODAL_BASE}
          panelClassName="shadow-xl max-w-2xl max-h-[90vh] p-0"
          showHeader={false}
          loading={guardando}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <h2 className="text-lg font-semibold">Cambiar Cliente del Pedido</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              disabled={guardando}
              aria-label="Cerrar cambio de cliente"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Cliente Actual */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Cliente Actual:</p>
              <div className="bg-white p-2 rounded border border-gray-300">
                <p className="font-medium text-gray-900">{clienteActual?.nombre || 'No especificado'}</p>
                {clienteActual?.ciudad && (
                  <p className="text-sm text-gray-600">{clienteActual.ciudad}</p>
                )}
              </div>
            </div>

            {/* Búsqueda de Cliente */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Buscar Cliente Existente:</p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                  disabled={loading}
                />
                <button
                  onClick={handleBuscar}
                  disabled={loading || !busqueda.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                  title="Buscar cliente"
                >
                  {loading ? (
                    <LoadingSpinner size="md" colorClass="border-white" />
                  ) : (
                    <MdSearch size={24} />
                  )}
                </button>
              </div>

              {/* Resultados de Búsqueda */}
              {resultados.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                  {resultados.map((cliente, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSeleccionarCliente(cliente)}
                      className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                        clienteSeleccionado?.id === cliente.id
                          ? 'bg-blue-100 hover:bg-blue-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{cliente.nombre}</div>
                      {cliente.ciudad && (
                        <div className="text-sm text-gray-600">{cliente.ciudad}</div>
                      )}
                      {cliente.telefono && (
                        <div className="text-xs text-gray-500">{cliente.telefono}</div>
                      )}
                      {clienteSeleccionado?.id === cliente.id && (
                        <div className="text-xs text-blue-700 font-medium mt-1">✓ Seleccionado</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones para Crear/Editar Cliente */}
            <div className="border-t pt-3 space-y-2">
              <button
                onClick={handleAbrirModalCrear}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <MdPersonAdd size={20} />
                Crear Nuevo Cliente
              </button>

              {clienteSeleccionado && (
                <button
                  onClick={handleAbrirModalEditar}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  ✏️ Editar Cliente Seleccionado
                </button>
              )}
            </div>

            {/* Cliente Seleccionado (Preview) */}
            {clienteSeleccionado && clienteSeleccionado.id !== clienteActual?.id && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-700 mb-2">Nuevo Cliente Seleccionado:</p>
                <div className="bg-white p-2 rounded border border-green-300">
                  <p className="font-medium text-gray-900">{clienteSeleccionado.nombre}</p>
                  {clienteSeleccionado.ciudad && (
                    <p className="text-sm text-gray-600">{clienteSeleccionado.ciudad}</p>
                  )}
                  {clienteSeleccionado.condicion_iva && (
                    <p className="text-xs text-gray-500">Condición IVA: {clienteSeleccionado.condicion_iva}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer con botones */}
          <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex flex-col sm:flex-row justify-end gap-2">
            <button
              onClick={handleClose}
              disabled={guardando}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <LoadingButton
              onClick={handleGuardarCambios}
              loading={guardando}
              loadingText="Guardando..."
              disabled={!clienteSeleccionado}
              className={`w-full sm:w-auto px-6 py-2 text-white rounded-md flex items-center justify-center gap-2 ${
                guardando || !clienteSeleccionado
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              Guardar Cambios
            </LoadingButton>
          </div>
        </ModalBase>
      )}

      {/* Modal para crear/editar cliente - renderizado cuando mostrarModalCrear es true */}
      <ModalCrearClienteRapido
        isOpen={mostrarModalCrear}
        onClose={handleCerrarModalCrear}
        onClienteCreado={handleClienteCreado}
        modo={modoModalCliente}
        clienteEditar={clienteParaEditar}
      />
    </>
  );
}
