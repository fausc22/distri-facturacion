// hooks/useClientes.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';

export const useClientes = () => {
  const [loading, setLoading] = useState(false);

  // Crear cliente
  const crearCliente = async (clienteData) => {
    setLoading(true);
    try {
      const response = await axiosAuth.post('/personas/crear-cliente', clienteData);
      
      if (response.data.success) {
        toast.success('Cliente creado correctamente');
        // El backend devuelve: { success: true, message: "...", data: {...cliente} }
        // Necesitamos pasar el cliente completo
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      const message = error.response?.data?.message || 'Error al crear cliente';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes
  const buscarClientes = async (searchTerm) => {
    setLoading(true);
    try {
      const response = await axiosAuth.get(`/personas/buscar-cliente?search=${encodeURIComponent(searchTerm || '')}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      toast.error('Error al buscar clientes');
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cliente
  const actualizarCliente = async (id, clienteData) => {
    setLoading(true);
    try {
      const response = await axiosAuth.put(`/personas/actualizar-cliente/${id}`, clienteData);
      
      if (response.data.success) {
        toast.success('Cliente actualizado correctamente');
        // El backend puede devolver el cliente actualizado o solo success
        return { success: true, data: response.data.data || response.data };
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      const message = error.response?.data?.message || 'Error al actualizar cliente';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Validar datos de cliente
  const validarDatosCliente = (datos) => {
    const errores = [];

    // ✅ CAMPOS OBLIGATORIOS
    if (!datos.nombre?.trim()) {
      errores.push('El nombre es obligatorio');
    }

    if (!datos.condicion_iva?.trim()) {
      errores.push('La condición de IVA es obligatoria');
    }

    if (!datos.ciudad?.trim()) {
      errores.push('La ciudad es obligatoria');
    }

    // ✅ VALIDACIONES OPCIONALES (solo si tienen contenido)
    if (datos.cuit && datos.cuit.length > 0 && !/^\d{2}-\d{8}-\d{1}$/.test(datos.cuit)) {
      // Validación flexible para CUIT (puede estar vacío)
      if (datos.cuit.replace(/\D/g, '').length !== 11) {
        errores.push('El CUIT debe tener 11 dígitos');
      }
    }

    if (datos.dni && datos.dni.length > 0 && !/^\d+$/.test(datos.dni)) {
      errores.push('El DNI debe contener solo números');
    }

    if (datos.email && datos.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      errores.push('El formato del email no es válido');
    }

    if (datos.telefono && datos.telefono.length > 0 && !/^\d+$/.test(datos.telefono)) {
      errores.push('El teléfono debe contener solo números');
    }

    return errores;
  };

  return {
    loading,
    crearCliente,
    buscarClientes,
    actualizarCliente,
    validarDatosCliente
  };
};