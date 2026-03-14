// components/pedidos/ModalCrearClienteRapido.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useClientes } from '../../hooks/useClientes';
import { MdClose, MdPersonAdd, MdEdit } from 'react-icons/md';
import CiudadAutocomplete from '../common/CiudadAutocomplete';
import ModalBase from '../common/ModalBase';
import LoadingButton from '../common/LoadingButton';
import { Z_INDEX } from '../../constants/zIndex';

export default function ModalCrearClienteRapido({
  isOpen,
  onClose,
  onClienteCreado,
  clienteEditar = null, // Si se pasa un cliente, el modal entra en modo edición
  modo = 'crear' // 'crear' o 'editar'
}) {
  const { crearCliente, actualizarCliente, validarDatosCliente, consultarContribuyenteAfip, loading, consultandoAfip } = useClientes();

  const [formData, setFormData] = useState({
    nombre: '',
    nombre_alternativo: '',
    condicion_iva: '',
    cuit_dni: '',
    direccion: '',
    ciudad: '',
    ciudad_id: '',
    provincia: '',
    telefono: '',
    email: ''
  });

  const [errores, setErrores] = useState([]);
  const [mostrarCamposOpcionales, setMostrarCamposOpcionales] = useState(false);
  const [datosValidadosConAfip, setDatosValidadosConAfip] = useState(false);

  // Llenar formulario si es modo edición, o limpiar si es crear
  useEffect(() => {
    if (isOpen) {
      if (modo === 'editar' && clienteEditar) {
        // Modo edición: cargar datos del cliente
        setFormData({
          nombre: clienteEditar.nombre || '',
          nombre_alternativo: clienteEditar.nombre_alternativo || '',
          condicion_iva: clienteEditar.condicion_iva || '',
          cuit_dni: (clienteEditar.cuit || clienteEditar.dni || '').toString().trim(),
          direccion: clienteEditar.direccion || '',
          ciudad: clienteEditar.ciudad || '',
          ciudad_id: clienteEditar.ciudad_id || '',
          provincia: clienteEditar.provincia || '',
          telefono: clienteEditar.telefono || '',
          email: clienteEditar.email || ''
        });
        // Si hay datos opcionales, expandir esa sección
        if (clienteEditar.nombre_alternativo || clienteEditar.email || clienteEditar.provincia) {
          setMostrarCamposOpcionales(true);
        }
      } else {
        // Modo crear: limpiar formulario
        setFormData({
          nombre: '',
          nombre_alternativo: '',
          condicion_iva: '',
          cuit_dni: '',
          direccion: '',
          ciudad: '',
          ciudad_id: '',
          provincia: '',
          telefono: '',
          email: ''
        });
        setMostrarCamposOpcionales(false);
        setDatosValidadosConAfip(false);
      }
      setErrores([]);
    }
  }, [isOpen, modo, clienteEditar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrores([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const digits = (formData.cuit_dni || '').replace(/\D/g, '');
    const cuit = digits.length === 11 ? (formData.cuit_dni || '').trim() : '';
    const dni = (digits.length >= 7 && digits.length <= 8) ? (formData.cuit_dni || '').trim() : '';
    const datosParaValidar = { ...formData, cuit, dni };
    const erroresValidacion = validarDatosCliente(datosParaValidar);
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    const { cuit_dni: _, ...rest } = formData;
    const payload = { ...rest, cuit, dni, validado_afip: datosValidadosConAfip };
    let resultado;
    if (modo === 'editar' && clienteEditar) {
      resultado = await actualizarCliente(clienteEditar.id, payload);
    } else {
      resultado = await crearCliente(payload);
    }

    if (resultado.success) {
      setDatosValidadosConAfip(false);
      const clienteParaPasar = resultado.data?.id != null
        ? resultado.data
        : (resultado.insertId != null ? { id: resultado.insertId, ...resultado.data } : resultado.data);
      if (clienteParaPasar && clienteParaPasar.id != null) {
        console.log('✅ Cliente creado/actualizado:', clienteParaPasar);
        onClienteCreado(clienteParaPasar);
        onClose();
      } else {
        console.error('Cliente guardado pero sin ID en la respuesta');
        toast.error('No se pudo obtener el cliente creado. Recargá la lista o buscá el cliente por nombre.');
      }
    } else if (resultado.errors?.length) {
      setErrores(resultado.errors);
    }
  };

  const handleCiudadSeleccionada = (ciudad) => {
    setFormData(prev => ({
      ...prev,
      ciudad: ciudad.nombre,
      ciudad_id: ciudad.id
    }));
  };

  const handleValidarAfip = async () => {
    const valor = formData.cuit_dni || '';
    const result = await consultarContribuyenteAfip(valor, valor);
    if (!result.success || !result.data) return;
    const nuevoCuitDni = (result.data.cuit || result.data.dni || '').toString().trim();
    setFormData(prev => ({
      ...prev,
      cuit_dni: nuevoCuitDni || prev.cuit_dni,
      nombre: result.data.nombre ?? prev.nombre,
      condicion_iva: result.data.condicion_iva ?? prev.condicion_iva,
      direccion: result.data.direccion ?? prev.direccion,
      ciudad: result.data.ciudad ?? prev.ciudad,
      provincia: result.data.provincia ?? prev.provincia,
      telefono: prev.telefono || '',
      email: prev.email || ''
    }));
    setErrores([]);
    setDatosValidadosConAfip(true);
  };

  const condicionesIVA = [
    'Responsable Inscripto',
    'Monotributo',
    'Exento',
    'Consumidor Final'
  ];

  if (!isOpen) return null;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={modo === 'editar' ? 'Editar Cliente' : 'Crear Cliente'}
      size="lg"
      loading={loading}
      closeOnOverlay
      closeOnEscape
      panelClassName="p-0 max-w-[95vw] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh]"
      zIndex={Z_INDEX.MODAL_BASE}
      showHeader={false}
    >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-1 sm:gap-2">
            {modo === 'editar' ? <MdEdit size={20} className="sm:w-6 sm:h-6" /> : <MdPersonAdd size={20} className="sm:w-6 sm:h-6" />}
            <h2 className="text-base sm:text-lg font-semibold">
              {modo === 'editar' ? 'Editar Cliente' : 'Crear Cliente'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            disabled={loading}
            aria-label="Cerrar modal de cliente"
          >
            <MdClose size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Errores */}
          {errores.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm font-semibold text-red-800 mb-1">Errores de validación:</p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {errores.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Campos Esenciales */}
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-sm font-semibold text-blue-800 mb-3">Datos Esenciales</p>

              {/* Nombre */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo / Razón Social *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 touch-manipulation"
                  required
                  disabled={loading}
                />
              </div>

              {/* Condición IVA y DNI/CUIT en fila */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condición IVA *
                  </label>
                  <select
                    name="condicion_iva"
                    value={formData.condicion_iva}
                    onChange={handleInputChange}
                    className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 bg-white touch-manipulation"
                    disabled={loading}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {condicionesIVA.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>

                {/* CUIT/DNI único: 11 dígitos = CUIT, 7 u 8 = DNI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CUIT / DNI
                  </label>
                  <input
                    type="text"
                    name="cuit_dni"
                    value={formData.cuit_dni}
                    onChange={handleInputChange}
                    placeholder="CUIT (11 dígitos) o DNI (7-8 dígitos)"
                    className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 touch-manipulation"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Validar con AFIP */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleValidarAfip}
                  disabled={loading || consultandoAfip}
                  className="min-h-[44px] min-w-[44px] px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                >
                  {consultandoAfip ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Buscando en AFIP...
                    </>
                  ) : (
                    <>Validar con AFIP</>
                  )}
                </button>
                <span className="text-xs text-gray-500">CUIT (11 dígitos) o DNI (7-8 dígitos)</span>
              </div>

              {/* Teléfono */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 touch-manipulation"
                  disabled={loading}
                />
              </div>

              {/* Dirección */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 touch-manipulation"
                  disabled={loading}
                />
              </div>

              {/* Ciudad con Autocomplete */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad *
                </label>
                <CiudadAutocomplete
                  value={formData.ciudad}
                  onChange={(value) => setFormData(prev => ({ ...prev, ciudad: value }))}
                  onCiudadSeleccionada={handleCiudadSeleccionada}
                  disabled={loading}
                  placeholder="Escribe al menos 3 caracteres..."
                  required
                />
              </div>
            </div>

            {/* Botón para mostrar campos opcionales */}
            <button
              type="button"
              onClick={() => setMostrarCamposOpcionales(!mostrarCamposOpcionales)}
              className="w-full min-h-[44px] py-2 px-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              {mostrarCamposOpcionales ? '▲ Ocultar' : '▼ Mostrar'} campos opcionales
            </button>

            {/* Campos Opcionales */}
            {mostrarCamposOpcionales && (
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Datos Adicionales (Opcional)</p>

                {/* Nombre Alternativo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Alternativo
                  </label>
                  <input
                    type="text"
                    name="nombre_alternativo"
                    value={formData.nombre_alternativo}
                    onChange={handleInputChange}
                    className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 touch-manipulation"
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 touch-manipulation"
                    disabled={loading}
                  />
                </div>

                {/* Provincia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleInputChange}
                    className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 touch-manipulation"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
              disabled={loading}
            >
              Cancelar
            </button>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText={modo === 'editar' ? 'Guardando...' : 'Creando...'}
              className={`w-full sm:w-auto min-h-[44px] min-w-[44px] px-6 py-2 text-white rounded-md flex items-center justify-center gap-2 touch-manipulation ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              } transition-colors`}
            >
              <>
                {modo === 'editar' ? <MdEdit size={20} /> : <MdPersonAdd size={20} />}
                {modo === 'editar' ? 'Guardar Cambios' : 'Crear Cliente'}
              </>
            </LoadingButton>
          </div>
        </form>
    </ModalBase>
  );
}
