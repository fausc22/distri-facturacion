// hooks/ventas/useEditarVenta.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

export function useEditarVenta() {
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [productos, setProductos] = useState([]);
  const [cuenta, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarProductosVenta = async (venta) => {
    setSelectedVenta(venta);
    setLoading(true);
    
    try {
      const response = await axiosAuth.get(`/ventas/obtener-productos-venta/${venta.id}`);
      setProductos(response.data);
      
      // ✅ NUEVO: Log para verificar numero_factura en venta seleccionada
      console.log('📋 Venta seleccionada:', {
        id: venta.id,
        numero_factura: venta.numero_factura,
        cliente: venta.cliente_nombre
      });
    } catch (error) {
      console.error("Error al obtener productos:", error);
      toast.error("No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const cargarCuenta = async (venta) => {
    setSelectedVenta(venta);
    
    try {
      const response = await axiosAuth.get(`/finanzas/cuentas/${venta.cuenta_id}`);
      if (response.data.success) {
        setCuentas(response.data.data);
        console.log("Cuenta cargada:", response.data.data);
      } else {
        toast.error("Error al cargar las cuentas");
      }
    } catch (error) {
      console.error("Error al obtener cuentas:", error);
      toast.error("No se pudieron cargar las cuentas");
    }
  };

  // ✅ FUNCIÓN MEJORADA para recargar con numero_factura
  const recargarVenta = async (ventaId) => {
    try {
      const response = await axiosAuth.get(`/ventas/obtener-venta/${ventaId}`);
      if (response.data && response.data.length > 0) {
        const ventaActualizada = response.data[0];
        setSelectedVenta(ventaActualizada);
        
        console.log('✅ Venta recargada con numero_factura:', {
          id: ventaActualizada.id,
          numero_factura: ventaActualizada.numero_factura,
          cae_id: ventaActualizada.cae_id
        });
        
        return ventaActualizada;
      }
    } catch (error) {
      console.error("Error al recargar venta:", error);
      toast.error("Error al actualizar datos de la venta");
    }
  };

  const cerrarEdicion = () => {
    setSelectedVenta(null);
    setProductos([]);
  };

  return {
    selectedVenta,
    productos,
    cuenta,
    loading,
    cargarProductosVenta,
    cargarCuenta,
    recargarVenta,
    cerrarEdicion
  };
}