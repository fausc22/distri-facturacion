import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';

export const useProveedores = () => {
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [loadingMutacion, setLoadingMutacion] = useState(false);
  const loading = loadingBusqueda || loadingMutacion;
  const searchAbortControllerRef = useRef(null);
  const lastSearchRequestIdRef = useRef(0);

  const isCanceledSearchError = (error) =>
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.message === 'canceled';

  useEffect(() => {
    return () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  const crearProveedor = useCallback(async (proveedorData) => {
    setLoadingMutacion(true);
    try {
      const response = await axiosAuth.post('/personas/crear-proveedor', proveedorData);

      if (response.data.success) {
        toast.success('Proveedor creado correctamente');
        return { success: true, data: response.data };
      }
      const message = response.data.message || 'Error al crear proveedor';
      toast.error(message);
      return { success: false, error: message };
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      const message = error.response?.data?.message || 'Error al crear proveedor';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoadingMutacion(false);
    }
  }, []);

  const buscarProveedores = useCallback(async (searchTerm, opciones = {}) => {
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    searchAbortControllerRef.current = controller;
    const requestId = lastSearchRequestIdRef.current + 1;
    lastSearchRequestIdRef.current = requestId;

    setLoadingBusqueda(true);
    try {
      const params = new URLSearchParams();
      params.set('search', searchTerm || '');
      if (opciones.pagina) params.set('pagina', String(opciones.pagina));
      if (opciones.porPagina) params.set('porPagina', String(opciones.porPagina));
      if (opciones.sortBy) params.set('sortBy', String(opciones.sortBy));
      if (opciones.sortOrder) params.set('sortOrder', String(opciones.sortOrder));

      const response = await axiosAuth.get(`/personas/buscar-proveedor?${params.toString()}`, {
        signal: controller.signal
      });

      if (requestId !== lastSearchRequestIdRef.current) {
        return { success: false, stale: true, data: [] };
      }

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.total ?? response.data.data?.length ?? 0,
          pagina: response.data.pagina ?? opciones.pagina ?? 1,
          porPagina: response.data.porPagina ?? opciones.porPagina ?? response.data.data?.length ?? 0
        };
      }
      return { success: false, data: [] };
    } catch (error) {
      if (isCanceledSearchError(error)) {
        return { success: false, cancelled: true, data: [] };
      }
      console.error('Error al buscar proveedores:', error);
      toast.error('Error al buscar proveedores');
      return { success: false, data: [] };
    } finally {
      if (requestId === lastSearchRequestIdRef.current) {
        if (searchAbortControllerRef.current === controller) {
          searchAbortControllerRef.current = null;
        }
        setLoadingBusqueda(false);
      }
    }
  }, []);

  const actualizarProveedor = useCallback(async (id, proveedorData) => {
    setLoadingMutacion(true);
    try {
      const response = await axiosAuth.put(`/personas/actualizar-proveedor/${id}`, proveedorData);

      if (response.data.success) {
        toast.success('Proveedor actualizado correctamente');
        return { success: true, data: response.data };
      }
      const message = response.data.message || 'Error al actualizar proveedor';
      toast.error(message);
      return { success: false, error: message };
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      const message = error.response?.data?.message || 'Error al actualizar proveedor';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoadingMutacion(false);
    }
  }, []);

  const eliminarProveedor = useCallback(async (id) => {
    setLoadingMutacion(true);
    try {
      const response = await axiosAuth.delete(`/personas/eliminar-proveedor/${id}`);

      if (response.data.success) {
        toast.success('Proveedor eliminado correctamente');
        return { success: true, data: response.data };
      }
      const message = response.data.message || 'Error al eliminar proveedor';
      toast.error(message);
      return { success: false, error: message };
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      const message = error.response?.data?.message || 'Error al eliminar proveedor';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoadingMutacion(false);
    }
  }, []);

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
    } else if (!/^\d+$/.test(String(datos.dni).replace(/\D/g, ''))) {
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
    } else {
      const telefonoDigitos = String(datos.telefono).replace(/\D/g, '');
      if (telefonoDigitos.length < 6) {
        errores.push('El teléfono debe tener al menos 6 dígitos');
      }
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
    loadingBusqueda,
    loadingMutacion,
    crearProveedor,
    buscarProveedores,
    actualizarProveedor,
    eliminarProveedor,
    validarDatosProveedor
  };
};
