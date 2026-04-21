
import { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import { axiosAuth, fetchAuth } from '../../utils/apiClient';

export function useFacturacion() {
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  
  // ✅ REF PARA PROTECCIÓN CONTRA DOBLE CLIC/ENVÍO
  const facturandoRef = useRef(false);

  // Cargar cuentas de fondos
  const cargarCuentasFondos = async () => {
    setLoadingCuentas(true);
    try {
      const response = await axiosAuth.get(`/finanzas/obtener-cuentas`);
      
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

  // Facturar un pedido - ✅ CON PROTECCIÓN CONTRA DOBLE CLIC Y MANEJO DE IDEMPOTENCIA
  const facturarPedido = async (datosFacturacion) => {
    // ✅ PROTECCIÓN CONTRA DOBLE CLIC/ENVÍO
    if (facturandoRef.current) {
      console.log('⚠️ Ya hay una facturación en proceso, ignorando solicitud duplicada');
      toast.info('Ya estamos procesando la facturación. Por favor, espera.');
      return { success: false, error: 'Facturación en proceso' };
    }

    facturandoRef.current = true;
    setLoading(true);
    
    try {
      const subtotal = Number(datosFacturacion?.subtotalSinIva);
      const iva = Number(datosFacturacion?.ivaTotal);
      const total = Number(datosFacturacion?.totalConIva);
      const importesValidos = (
        Number.isFinite(subtotal) &&
        Number.isFinite(iva) &&
        Number.isFinite(total) &&
        subtotal >= 0 &&
        iva >= 0 &&
        total > 0
      );

      if (!importesValidos) {
        toast.error('Importes inválidos para facturar. Revise subtotal, IVA y total.');
        facturandoRef.current = false;
        return {
          success: false,
          error: 'Importes inválidos para facturar'
        };
      }

      console.log('🧾 Enviando datos de facturación:', datosFacturacion);
      
      const response = await axiosAuth.post(`/ventas/facturar-pedido`, datosFacturacion);
      
      if (response.data.success) {
        // ✅ VERIFICAR SI ES DUPLICADO (backend retorna existing: true)
        if (response.data.existing) {
          console.log('⚠️ Facturación duplicada detectada por backend');
          toast.info('Este pedido ya fue facturado anteriormente');
          facturandoRef.current = false;
          return {
            success: true,
            data: response.data.data,
            existing: true
          };
        }
        
        toast.success('¡Pedido facturado exitosamente!');
        facturandoRef.current = false;
        return {
          success: true,
          data: response.data.data
        };
      } else {
        toast.error(response.data.message || 'Error al facturar pedido');
        facturandoRef.current = false;
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      console.error('Error facturando pedido:', error);
      
      // ✅ VERIFICAR SI ES ERROR DE DUPLICADO
      if (error.response?.status === 409 || error.response?.data?.code === 'DUPLICATE') {
        console.log('⚠️ Facturación duplicada detectada');
        toast.info('Este pedido ya fue facturado anteriormente');
        facturandoRef.current = false;
        return {
          success: true,
          data: error.response?.data?.data,
          existing: true
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Error al facturar el pedido';
      toast.error(errorMessage);
      facturandoRef.current = false;
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
      facturandoRef.current = false;
    }
  };

  // Obtener movimientos de una cuenta
  const obtenerMovimientosCuenta = async (cuentaId) => {
    try {
      const response = await axiosAuth.get(`/ventas/movimientos-cuenta/${cuentaId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        toast.error(response.data.message || 'Error al cargar movimientos');
        return [];
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      toast.error('Error al cargar movimientos de la cuenta');
      return [];
    }
  };

  return {
    // Estados
    loading,
    cuentas,
    loadingCuentas,
    
    // Funciones
    cargarCuentasFondos,
    facturarPedido,
    obtenerMovimientosCuenta
  };
}