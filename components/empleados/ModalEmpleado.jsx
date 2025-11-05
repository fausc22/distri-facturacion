import { useState, useEffect } from 'react';
import ModalBase from '../common/ModalBase';
import { useEmpleados } from '../../hooks/useEmpleados';

export default function ModalEmpleado({ 
  empleado, 
  isOpen, 
  onClose, 
  onEmpleadoGuardado,
  modo = 'crear'
}) {
  const { crearEmpleado, actualizarEmpleado, validarDatosEmpleado, loading } = useEmpleados();
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    usuario: '',
    password: '',
    rol: 'VENDEDOR'
  });

  const [errores, setErrores] = useState([]);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    if (empleado && modo === 'editar') {
      setFormData({
        nombre: empleado.nombre || '',
        apellido: empleado.apellido || '',
        dni: empleado.dni || '',
        telefono: empleado.telefono || '',
        email: empleado.email || '',
        usuario: empleado.usuario || '',
        password: '', // No mostrar contraseña actual
        rol: empleado.rol || 'VENDEDOR'
      });
    } else if (modo === 'crear') {
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        email: '',
        usuario: '',
        password: '',
        rol: 'VENDEDOR'
      });
    }
    setErrores([]);
  }, [empleado, modo, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrores([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const esEdicion = modo === 'editar';
    const erroresValidacion = validarDatosEmpleado(formData, esEdicion);
    
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    let resultado;
    if (modo === 'crear') {
      resultado = await crearEmpleado(formData);
    } else {
      resultado = await actualizarEmpleado(empleado.id, formData);
    }

    if (resultado.success) {
      onEmpleadoGuardado();
      onClose();
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={modo === 'crear' ? 'Crear Nuevo Empleado' : `Editar Empleado: ${empleado?.nombre} ${empleado?.apellido}`}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
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

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          {/* DNI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI
            </label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
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

          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario *
            </label>
            <input
              type="text"
              name="usuario"
              value={formData.usuario}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol *
            </label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            >
              <option value="VENDEDOR">Vendedor</option>
              <option value="GERENTE">Gerente</option>
            </select>
          </div>

          {/* Contraseña */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña {modo === 'crear' ? '*' : '(dejar vacío para no cambiar)'}
            </label>
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-2.5 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={modo === 'crear'}
                disabled={loading}
                autoComplete="new-password"
                placeholder={modo === 'editar' ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {mostrarPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {modo === 'editar' && (
              <p className="text-xs text-gray-500 mt-1">
                Solo completa este campo si deseas cambiar la contraseña
              </p>
            )}
          </div>
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
            {loading ? 'Guardando...' : modo === 'crear' ? 'Crear Empleado' : 'Actualizar Empleado'}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}