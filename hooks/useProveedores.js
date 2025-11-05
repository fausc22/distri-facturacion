// hooks/useProveedores.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';

export const useProveedores = () => {
  const [loading, setLoading] = useState(false);

  // Crear proveedor
  const crearProveedor = async (proveedorData) => {
    setLoading(true);
    try {
      const response = await axiosAuth.post('/personas/crear-proveedor', proveedorData);
      
      if (response.data.success) {
        toast.success('Proveedor creado correctamente');
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      const message = error.response?.data?.message || 'Error al crear proveedor';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Buscar proveedores
  const buscarProveedores = async (searchTerm) => {
    setLoading(true);
    try {
      const response = await axiosAuth.get(`/personas/buscar-proveedor?search=${encodeURIComponent(searchTerm || '')}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      toast.error('Error al buscar proveedores');
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar proveedor
  const actualizarProveedor = async (id, proveedorData) => {
    setLoading(true);
    try {
      const response = await axiosAuth.put(`/personas/actualizar-proveedor/${id}`, proveedorData);
      
      if (response.data.success) {
        toast.success('Proveedor actualizado correctamente');
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      const message = error.response?.data?.message || 'Error al actualizar proveedor';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Validar datos de proveedor
  const validarDatosProveedor = (datos) => {
    const errores = [];

    if (!datos.nombre?.trim()) {
      errores.push('El nombre es obligatorio');
    }

    if (!datos.condicion_iva) {
      errores.push('La condición de IVA es obligatoria');
    }

    if (!datos.cuit?.trim()) {
      errores.push('El CUIT es obligatorio');
    } else if (datos.cuit.replace(/\D/g, '').length !== 11) {
      errores.push('El CUIT debe tener 11 dígitos');
    }

    if (!datos.dni?.trim()) {
      errores.push('El DNI es obligatorio');
    } else if (!/^\d+$/.test(datos.dni)) {
      errores.push('El DNI debe contener solo números');
    }

    if (!datos.direccion?.trim()) {
      errores.push('La dirección es obligatoria');
    }

    if (!datos.ciudad?.trim()) {
      errores.push('La ciudad es obligatoria');
    }

    if (!datos.provincia?.trim()) {
      errores.push('La provincia es obligatoria');
    }

    if (!datos.telefono?.trim()) {
      errores.push('El teléfono es obligatorio');
    } else if (!/^\d+$/.test(datos.telefono)) {
      errores.push('El teléfono debe contener solo números');
    }

    if (datos.email === undefined) {
      errores.push('El email es obligatorio (puede estar vacío)');
    } else if (datos.email && datos.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      errores.push('El formato del email no es válido');
    }

    return errores;
  };

  return {
    loading,
    crearProveedor,
    buscarProveedores,
    actualizarProveedor,
    validarDatosProveedor
  };
};