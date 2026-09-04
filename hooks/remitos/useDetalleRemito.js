// hooks/remitos/useDetalleRemito.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

export function useDetalleRemito() {
  const [selectedRemito, setSelectedRemito] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarProductosRemito = async (remito) => {
    setSelectedRemito(remito);
    setLoading(true);

    try {
      const response = await axiosAuth.get(`/productos/obtener-productos-remito/${remito.id}`);
      const data = response.data.success ? (response.data.data || []) : (Array.isArray(response.data) ? response.data : []);
      setProductos(data);
    } catch (error) {
      console.error('Error al obtener productos del remito:', error);
      toast.error('No se pudieron cargar los productos del remito');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const cerrarDetalle = () => {
    setSelectedRemito(null);
    setProductos([]);
  };

  const actualizarRemitoLocal = (cambios) => {
    setSelectedRemito((prev) => (prev ? { ...prev, ...cambios } : prev));
  };

  return {
    selectedRemito,
    productos,
    loading,
    cargarProductosRemito,
    cerrarDetalle,
    actualizarRemitoLocal
  };
}
