// hooks/ventas/useVentaDirecta.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

export function useVentaDirecta() {
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);

  // Cargar cuentas de fondos
  const cargarCuentasFondos = async () => {
    setLoadingCuentas(true);
    try {
      const response = await axiosAuth.get('/ventas/cuentas-fondos');
      
      if (response.data.success) {
        setCuentas(response.data.data);
        return response.data.data;
      } else {
        toast.error(response.data.message || 'Error al cargar cuentas');
        return [];
      }
    } catch (error) {
      console.error('Error cargando cuentas:', error);
      toast.error('Error al cargar cuentas de fondos');
      return [];
    } finally {
      setLoadingCuentas(false);
    }
  };

  // Registrar venta directa
  const registrarVentaDirecta = async (datosVenta) => {
    setLoading(true);
    try {
      console.log('💰 Enviando venta directa:', datosVenta);
      
      const response = await axiosAuth.post('/ventas/venta-directa', datosVenta);
      
      if (response.data.success) {
        toast.success('¡Venta directa completada exitosamente!', {
          duration: 4000,
          icon: '🎉'
        });
        return {
          success: true,
          data: response.data.data
        };
      } else {
        toast.error(response.data.message || 'Error al registrar venta directa');
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      console.error('Error en venta directa:', error);
      
      // Manejo de errores específicos
      if (error.response?.status === 403) {
        toast.error('No tienes permisos para realizar ventas directas. Solo gerentes.', {
          duration: 5000,
          icon: '🔒'
        });
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Datos inválidos');
      } else {
        toast.error('Error al registrar la venta directa. Verifique su conexión.');
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    cuentas,
    loadingCuentas,
    cargarCuentasFondos,
    registrarVentaDirecta
  };
}