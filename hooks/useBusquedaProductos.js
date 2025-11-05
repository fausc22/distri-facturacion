import { useState } from 'react';
import { axiosAuth, fetchAuth } from '../utils/apiClient';
  
export function useProductoSearch() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(0.5); // ✅ CAMBIO: Iniciar en 0.5
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  const buscarProducto = async () => {
    if (!busqueda.trim()) return;

    setLoading(true);
    try {
      const data = await fetchAuth(`/pedidos/filtrar-producto?search=${encodeURIComponent(busqueda)}`);
      setResultados(data.data);
      setMostrarModal(true);
    } catch (error) {
      console.error('Error al buscar producto:', error);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setCantidad(0.5); // ✅ CAMBIO: Resetear a 0.5
    setSubtotal(parseFloat((Number(producto.precio) * 0.5).toFixed(2))); // ✅ CAMBIO: Calcular con 0.5
  };

  const actualizarCantidad = (nuevaCantidad) => {
    // ✅ CAMBIO: Permitir cantidades desde 0.5
    let cantidadFloat = parseFloat(nuevaCantidad) || 0.5;
    
    // Redondear a medios más cercano
    cantidadFloat = Math.round(cantidadFloat * 2) / 2;
    
    // Mínimo 0.5
    const cantidadValida = Math.max(0.5, cantidadFloat);
    
    setCantidad(cantidadValida);
    if (productoSeleccionado) {
      setSubtotal(parseFloat((productoSeleccionado.precio * cantidadValida).toFixed(2)));
    }
  };

  const limpiarSeleccion = () => {
    setProductoSeleccionado(null);
    setCantidad(0.5); // ✅ CAMBIO: Resetear a 0.5
    setSubtotal(0);
    setBusqueda('');
    setMostrarModal(false);
  };

  return {
    busqueda,
    setBusqueda,
    resultados,
    productoSeleccionado,
    cantidad,
    subtotal,
    loading,
    mostrarModal,
    setMostrarModal,
    buscarProducto,
    seleccionarProducto,
    actualizarCantidad,
    limpiarSeleccion
  };
}