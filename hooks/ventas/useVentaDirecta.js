// hooks/ventas/useVentaDirecta.js
import { useState, useRef } from 'react';
import toast from '@/components/shared/toast';
import { axiosAuth } from '../../utils/apiClient';
import { generarHashVenta } from '../../utils/pedidoHash';

export function useVentaDirecta() {
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  
  // ✅ REF PARA PROTECCIÓN CONTRA DOBLE CLIC
  const registrandoRef = useRef(false);

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

  // Registrar venta directa CON PROTECCIÓN CONTRA DOBLE CLIC Y DUPLICADOS
  const registrarVentaDirecta = async (datosVenta) => {
    // ✅ PROTECCIÓN CONTRA DOBLE CLIC
    if (registrandoRef.current) {
      console.log('⚠️ Ya hay una venta en proceso, ignorando solicitud duplicada');
      toast.info('Procesando venta, por favor espere...');
      return { success: false, error: 'Venta en proceso' };
    }

    // ✅ GENERAR HASH ÚNICO PARA IDEMPOTENCIA
    const hashVenta = generarHashVenta(datosVenta);
    datosVenta.hash_venta = hashVenta;
    console.log(`🔐 Hash de venta generado: ${hashVenta}`);

    registrandoRef.current = true;
    setLoading(true);
    
    try {
      console.log('💰 Enviando venta directa:', datosVenta);
      
      const response = await axiosAuth.post('/ventas/venta-directa', datosVenta);
      
      if (response.data.success) {
        // ✅ VERIFICAR SI ES DUPLICADO
        if (response.data.existing) {
          console.log('⚠️ Venta duplicada detectada por backend');
          toast.info('Esta venta ya fue registrada anteriormente');
          registrandoRef.current = false;
          return {
            success: true,
            data: response.data.data,
            existing: true
          };
        }
        
        toast.success('¡Venta directa completada exitosamente!', {
          duration: 4000,
          icon: '🎉'
        });
        registrandoRef.current = false;
        return {
          success: true,
          data: response.data.data
        };
      } else {
        toast.error(response.data.message || 'Error al registrar venta directa');
        registrandoRef.current = false;
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      console.error('Error en venta directa:', error);

      const serverMsg = error.response?.data?.message;
      const faltantes = error.response?.data?.faltantes;

      // ✅ VERIFICAR SI ES ERROR DE DUPLICADO
      if (error.response?.status === 409 || error.response?.data?.code === 'DUPLICATE') {
        console.log('⚠️ Venta duplicada detectada');
        toast.info('Esta venta ya fue registrada anteriormente');
        registrandoRef.current = false;
        return {
          success: true,
          data: error.response?.data?.data,
          existing: true
        };
      }

      const isAuthError =
        error?.response?.status === 401 ||
        error?.message?.includes('Sesión expirada') ||
        error?.message?.includes('No refresh token');

      if (isAuthError) {
        // apiClient.js ya muestra el toast de sesión expirada
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para realizar ventas directas.', { duration: 5000 });
      } else if (error.response?.status === 400) {
        toast.error(serverMsg || 'Datos inválidos en la venta.');
      } else if (serverMsg) {
        toast.error(serverMsg, { duration: 6000 });
      } else {
        toast.networkError('No se pudo conectar con el servidor.');
      }

      registrandoRef.current = false;
      return {
        success: false,
        error: serverMsg || error.message,
        faltantes: faltantes || null
      };
    } finally {
      setLoading(false);
      registrandoRef.current = false;
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