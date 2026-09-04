import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';

export const useEmpleados = () => {
  const [loading, setLoading] = useState(false);

  const crearEmpleado = async (empleadoData) => {
    setLoading(true);
    try {
      const response = await axiosAuth.post('/empleados/crear-empleado', empleadoData);
      toast.success('Empleado creado exitosamente');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al crear empleado:', error);

      let message = 'Error al crear empleado';
      if (error.response) {
        switch (error.response.status) {
          case 401:
            message = 'Sesión expirada';
            break;
          case 403:
            message = 'No tienes permisos';
            break;
          default:
            message = error.response.data?.message || message;
        }
      }

      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const actualizarEmpleado = async (id, empleadoData) => {
    setLoading(true);
    try {
      const dataToSend = { ...empleadoData };
      if (!dataToSend.password || dataToSend.password.trim() === '') {
        delete dataToSend.password;
      }

      const response = await axiosAuth.put(
        `/empleados/actualizar-empleado/${id}`,
        dataToSend
      );

      toast.success('Empleado actualizado exitosamente');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al actualizar empleado:', error);

      let message = 'Error al actualizar empleado';
      if (error.response) {
        switch (error.response.status) {
          case 401:
            message = 'Sesión expirada';
            break;
          case 403:
            message = 'No tienes permisos';
            break;
          default:
            message = error.response.data?.message || message;
        }
      }

      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const listarTodosEmpleados = async () => {
    setLoading(true);
    try {
      const response = await axiosAuth.get('/empleados/listar-todos');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al listar empleados:', error);
      const message = error.response?.data?.message || 'Error al listar empleados';
      toast.error(message);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  const desactivarEmpleado = async (id) => {
    setLoading(true);
    try {
      const response = await axiosAuth.delete(`/empleados/${id}`);
      toast.success('Empleado desactivado exitosamente');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al desactivar empleado';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const reactivarEmpleado = async (id) => {
    setLoading(true);
    try {
      const response = await axiosAuth.put(`/empleados/reactivar/${id}`);
      toast.success('Empleado reactivado exitosamente');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al reactivar empleado';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const validarDatosEmpleado = (datos, esEdicion = false) => {
    const errores = [];

    if (!datos.nombre?.trim()) errores.push('El nombre es obligatorio');
    if (!datos.apellido?.trim()) errores.push('El apellido es obligatorio');
    if (!datos.usuario?.trim()) errores.push('El usuario es obligatorio');
    if (!datos.rol) errores.push('El rol es obligatorio');

    if (!esEdicion && (!datos.password || datos.password.length < 6)) {
      errores.push('La contraseña debe tener al menos 6 caracteres');
    }

    if (esEdicion && datos.password && datos.password.length > 0 && datos.password.length < 6) {
      errores.push('La contraseña debe tener al menos 6 caracteres');
    }

    if (datos.usuario && datos.usuario.length > 0) {
      if (datos.usuario.length < 3 || datos.usuario.length > 20) {
        errores.push('El usuario debe tener entre 3-20 caracteres');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(datos.usuario)) {
        errores.push('El usuario solo puede contener letras, números y guión bajo');
      }
    }

    if (datos.email && datos.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      errores.push('El formato del email no es válido');
    }

    if (datos.dni && datos.dni.length > 0 && !/^\d+$/.test(datos.dni)) {
      errores.push('El DNI debe contener solo números');
    }

    if (datos.telefono && datos.telefono.length > 0 && !/^\d+$/.test(datos.telefono)) {
      errores.push('El teléfono debe contener solo números');
    }

    return errores;
  };

  return {
    loading,
    crearEmpleado,
    actualizarEmpleado,
    listarTodosEmpleados,
    desactivarEmpleado,
    reactivarEmpleado,
    validarDatosEmpleado
  };
};
