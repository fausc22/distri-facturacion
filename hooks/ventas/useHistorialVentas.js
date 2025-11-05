// hooks/ventas/useHistorialVentas.js
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

export function useHistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    setLoading(true);
    try {
      const response = await axiosAuth.get(`/ventas/obtener-ventas`);
      setVentas(response.data);
      console.log('✅ Ventas cargadas:', response.data.length);
      
      // ✅ NUEVO: Log para verificar numero_factura
      if (response.data.length > 0) {
        console.log('📋 Ejemplo de venta con numero_factura:', {
          id: response.data[0].id,
          numero_factura: response.data[0].numero_factura,
          cliente: response.data[0].cliente_nombre
        });
      }
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      toast.error("No se pudieron cargar las ventas");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVenta = (ventaId) => {
    if (selectedVentas.includes(ventaId)) {
      setSelectedVentas(selectedVentas.filter(id => id !== ventaId));
    } else {
      setSelectedVentas([...selectedVentas, ventaId]);
    }
  };

  const handleSelectAllVentas = (ventasVisibles) => {
    const idsVisibles = ventasVisibles.map(v => v.id);
    const todosSeleccionados = idsVisibles.every(id => selectedVentas.includes(id));
    
    if (todosSeleccionados) {
      setSelectedVentas(selectedVentas.filter(id => !idsVisibles.includes(id)));
    } else {
      const nuevosIds = idsVisibles.filter(id => !selectedVentas.includes(id));
      setSelectedVentas([...selectedVentas, ...nuevosIds]);
    }
  };

  const clearSelection = () => {
    setSelectedVentas([]);
  };

  const getVentasSeleccionadas = () => {
    return ventas.filter(venta => selectedVentas.includes(venta.id));
  };

  return {
    ventas,
    selectedVentas,
    loading,
    cargarVentas,
    handleSelectVenta,
    handleSelectAllVentas,
    clearSelection,
    getVentasSeleccionadas
  };
}