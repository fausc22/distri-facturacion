import { useState, useEffect } from 'react';
import ModalBase from '../common/ModalBase';
import { useClientes } from '../../hooks/useClientes';
import CiudadAutocomplete from '../common/CiudadAutocomplete';

export default function ModalCliente({ 
  cliente, 
  isOpen, 
  onClose, 
  onClienteGuardado,
  modo = 'crear' // 'crear' o 'editar'
}) {
  const { crearCliente, actualizarCliente, validarDatosCliente, consultarContribuyenteAfip, loading, consultandoAfip } = useClientes();
  
  const [formData, setFormData] = useState({
    nombre: '',
    nombre_alternativo: '',
    condicion_iva: '',
    cuit: '',
    dni: '',
    direccion: '',
    ciudad: '',
    ciudad_id: '',
    provincia: '',
    telefono: '',
    email: ''
  });

  const [errores, setErrores] = useState([]);
  const [datosValidadosConAfip, setDatosValidadosConAfip] = useState(false);

  // Llenar formulario cuando se selecciona un cliente para editar
  useEffect(() => {
    if (cliente && modo === 'editar') {
      setFormData({
        nombre: cliente.nombre || '',
        nombre_alternativo: cliente.nombre_alternativo || '',
        condicion_iva: cliente.condicion_iva || '',
        cuit: cliente.cuit || '',
        dni: cliente.dni || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        ciudad_id: cliente.ciudad_id || '',
        provincia: cliente.provincia || '',
        telefono: cliente.telefono || '',
        email: cliente.email || ''
      });
    } else if (modo === 'crear') {
      // Limpiar formulario para crear nuevo
      setFormData({
        nombre: '',
        nombre_alternativo: '',
        condicion_iva: '',
        cuit: '',
        dni: '',
        direccion: '',
        ciudad: '',
        ciudad_id: '',
        provincia: '',
        telefono: '',
        email: ''
      });
      setDatosValidadosConAfip(false);
    }
    setErrores([]);
  }, [cliente, modo, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrores([]);
  };

  const handleCiudadSeleccionada = (ciudad) => {
    setFormData(prev => ({
      ...prev,
      ciudad: ciudad.nombre,
      ciudad_id: ciudad.id
    }));
  };

  const handleValidarAfip = async () => {
    const result = await consultarContribuyenteAfip(formData.cuit, formData.dni);
    if (!result.success || !result.data) return;
    setFormData(prev => ({
      ...prev,
      nombre: result.data.nombre ?? prev.nombre,
      condicion_iva: result.data.condicion_iva ?? prev.condicion_iva,
      cuit: result.data.cuit ?? prev.cuit,
      dni: result.data.dni ? String(result.data.dni) : prev.dni,
      direccion: result.data.direccion ?? prev.direccion,
      ciudad: result.data.ciudad ?? prev.ciudad,
      provincia: result.data.provincia ?? prev.provincia,
      telefono: prev.telefono || '',
      email: prev.email || ''
    }));
    setErrores([]);
    setDatosValidadosConAfip(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar datos
    const erroresValidacion = validarDatosCliente(formData);
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    const payload = { ...formData, validado_afip: datosValidadosConAfip };
    let resultado;
    if (modo === 'crear') {
      resultado = await crearCliente(payload);
    } else {
      resultado = await actualizarCliente(cliente.id, payload);
    }

    if (resultado.success) {
      setDatosValidadosConAfip(false);
      onClienteGuardado();
      onClose();
    } else if (resultado.errors?.length) {
      setErrores(resultado.errors);
    }
  };

  const condicionesIVA = [
    'Responsable Inscripto',
    'Exento',
    'Monotributo',
    'Consumidor Final'
  ];

  // Determinar si mostrar DNI o CUIT según la condición IVA
  const esConsumidorFinal = formData.condicion_iva === 'Consumidor Final';

  const tieneValidacionAfip = (modo === 'editar' && cliente?.validado_afip_at) || datosValidadosConAfip;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {modo === 'crear' ? 'Crear Nuevo Cliente' : `Editar Cliente: ${cliente?.nombre}`}
          {tieneValidacionAfip && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Validado en AFIP
            </span>
          )}
        </span>
      }
      loading={loading}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo / Razón Social *
            </label>
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

          {/* Nombre Alternativo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Alternativo
            </label>
            <input
              type="text"
              name="nombre_alternativo"
              value={formData.nombre_alternativo}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Condición IVA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condición IVA *
            </label>
            <select
              name="condicion_iva"
              value={formData.condicion_iva}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              required
            >
              <option value="">Seleccionar...</option>
              {condicionesIVA.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>

          {/* Mostrar DNI o CUIT según condición IVA */}
          {esConsumidorFinal ? (
            /* DNI para Consumidor Final */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                placeholder="12345678"
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          ) : (
            /* CUIT para otros */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CUIT
              </label>
              <input
                type="text"
                name="cuit"
                value={formData.cuit}
                onChange={handleInputChange}
                placeholder="20-12345678-9"
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          )}

          {/* Validar con AFIP */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={handleValidarAfip}
              disabled={loading || consultandoAfip}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <span className="ml-2 text-xs text-gray-500">Ingresá CUIT (11 dígitos) o DNI (7-8 dígitos) y hacé clic</span>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Dirección */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Ciudad con Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad *
            </label>
            <CiudadAutocomplete
              value={formData.ciudad}
              onChange={(value) => setFormData(prev => ({ ...prev, ciudad: value }))}
              onCiudadSeleccionada={handleCiudadSeleccionada}
              disabled={loading}
              placeholder="Escribe al menos 2 caracteres..."
              required
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
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Mostrar campo complementario según condición IVA */}
          {esConsumidorFinal ? (
            /* Mostrar CUIT adicional para Consumidor Final */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CUIT (Opcional)
              </label>
              <input
                type="text"
                name="cuit"
                value={formData.cuit}
                onChange={handleInputChange}
                placeholder="20-12345678-9"
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          ) : (
            /* Mostrar DNI adicional para otros */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI (Opcional)
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                placeholder="12345678"
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`px-6 py-2 text-white rounded-md ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Guardando...' : modo === 'crear' ? 'Crear Cliente' : 'Actualizar Cliente'}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}