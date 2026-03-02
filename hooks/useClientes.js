// hooks/useClientes.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';

export const useClientes = () => {
  const [loading, setLoading] = useState(false);
  const [consultandoAfip, setConsultandoAfip] = useState(false);

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
      const errors = error.response?.data?.errors;
      toast.error(message);
      return { success: false, error: message, errors: Array.isArray(errors) ? errors : undefined };
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
      const errors = error.response?.data?.errors;
      toast.error(message);
      return { success: false, error: message, errors: Array.isArray(errors) ? errors : undefined };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Consulta contribuyente en AFIP por CUIT o DNI (Fase 3).
   * Si hay 11 dígitos en cuit → consulta por CUIT; si no, si hay 7-8 dígitos en dni → consulta por DNI.
   * @returns {Promise<{ success: boolean, data?: object, message?: string, error?: string }>}
   */
  const consultarContribuyenteAfip = async (cuit = '', dni = '') => {
    const cuitLimpio = (cuit || '').replace(/\D/g, '');
    const dniLimpio = (dni || '').replace(/\D/g, '');

    if (cuitLimpio.length === 11) {
      // Consulta por CUIT
      setConsultandoAfip(true);
      try {
        const response = await axiosAuth.post('/personas/consulta-afip', { cuit: cuitLimpio });
        if (response.data.success && response.data.data) {
          toast.success('Datos obtenidos de AFIP');
          return { success: true, data: response.data.data, message: response.data.message };
        }
        return { success: false, error: 'No se recibieron datos' };
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Error al consultar AFIP';
        toast.error(msg);
        return { success: false, error: msg };
      } finally {
        setConsultandoAfip(false);
      }
    }

    if (dniLimpio.length >= 7 && dniLimpio.length <= 8) {
      // Consulta por DNI
      setConsultandoAfip(true);
      try {
        const response = await axiosAuth.post('/personas/consulta-afip', { dni: dniLimpio });
        if (response.data.success && response.data.data) {
          if (response.data.message) {
            toast(response.data.message, { icon: 'ℹ️' });
          } else {
            toast.success('Datos obtenidos de AFIP');
          }
          return { success: true, data: response.data.data, message: response.data.message };
        }
        return { success: false, error: 'No se recibieron datos' };
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Error al consultar AFIP';
        toast.error(msg);
        return { success: false, error: msg };
      } finally {
        setConsultandoAfip(false);
      }
    }

    toast.error('Ingresá CUIT (11 dígitos) o DNI (7 u 8 dígitos) para validar con AFIP');
    return { success: false, error: 'CUIT o DNI inválido para consulta' };
  };

  // Validar datos de cliente (alineado con backend Fase 2)
  const validarDatosCliente = (datos) => {
    const errores = [];

    if (!datos.nombre?.trim()) {
      errores.push('El nombre es obligatorio');
    }
    if (datos.nombre?.trim() && datos.nombre.length > 255) {
      errores.push('El nombre no puede superar los 255 caracteres');
    }

    if (!datos.condicion_iva?.trim()) {
      errores.push('La condición de IVA es obligatoria');
    }

    if (!datos.ciudad?.trim()) {
      errores.push('La ciudad es obligatoria');
    }

    const exigeCuit = datos.condicion_iva === 'Monotributo' || datos.condicion_iva === 'Responsable Inscripto';
    const cuitLimpio = (datos.cuit || '').replace(/\D/g, '');

    if (exigeCuit) {
      if (!cuitLimpio || cuitLimpio.length === 0) {
        errores.push('Para Monotributo o Responsable Inscripto el CUIT es obligatorio');
      } else if (cuitLimpio.length !== 11) {
        errores.push('El CUIT debe tener 11 dígitos');
      }
    } else if (cuitLimpio.length > 0 && cuitLimpio.length !== 11) {
      errores.push('El CUIT debe tener 11 dígitos');
    }

    const dniStr = (datos.dni || '').replace(/\D/g, '');
    if (dniStr.length > 0 && (dniStr.length < 7 || dniStr.length > 8)) {
      errores.push('El DNI debe tener 7 u 8 dígitos');
    }
    if (datos.dni && !/^\d*$/.test(String(datos.dni).replace(/\s/g, ''))) {
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
    consultandoAfip,
    crearCliente,
    buscarClientes,
    actualizarCliente,
    consultarContribuyenteAfip,
    validarDatosCliente
  };
};