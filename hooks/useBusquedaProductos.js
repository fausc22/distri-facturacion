import { useState, useCallback } from 'react';
import { fetchAuth } from '../utils/apiClient';

const CANTIDAD_INICIAL = 0.5;

export function useProductoSearch() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(CANTIDAD_INICIAL);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  const resetCantidad = useCallback(() => {
    setCantidad(CANTIDAD_INICIAL);
    setSubtotal(0);
  }, []);

  const deseleccionarProducto = useCallback(() => {
    setProductoSeleccionado(null);
    resetCantidad();
  }, [resetCantidad]);

  const cerrarModal = useCallback(() => {
    setProductoSeleccionado(null);
    resetCantidad();
    setBusqueda('');
    setResultados([]);
    setMostrarModal(false);
  }, [resetCantidad]);

  const reiniciarBusqueda = () => {
    setBusqueda('');
    setResultados([]);
    deseleccionarProducto();
  };

  const buscarProducto = async () => {
    if (!busqueda.trim()) return;

    setLoading(true);
    try {
      const data = await fetchAuth(`/pedidos/filtrar-producto?search=${encodeURIComponent(busqueda)}`);
      deseleccionarProducto();
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
    if (productoSeleccionado?.id === producto.id) {
      deseleccionarProducto();
      return;
    }

    setProductoSeleccionado(producto);
    setCantidad(CANTIDAD_INICIAL);
    setSubtotal(parseFloat((Number(producto.precio) * CANTIDAD_INICIAL).toFixed(2)));
  };

  const actualizarCantidad = (nuevaCantidad) => {
    let cantidadFloat = parseFloat(nuevaCantidad) || CANTIDAD_INICIAL;
    cantidadFloat = Math.round(cantidadFloat * 2) / 2;
    const cantidadValida = Math.max(CANTIDAD_INICIAL, cantidadFloat);

    setCantidad(cantidadValida);
    if (productoSeleccionado) {
      setSubtotal(parseFloat((productoSeleccionado.precio * cantidadValida).toFixed(2)));
    }
  };

  /** @deprecated Usar cerrarModal o deseleccionarProducto según el caso */
  const limpiarSeleccion = cerrarModal;

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
    deseleccionarProducto,
    cerrarModal,
    reiniciarBusqueda,
    limpiarSeleccion,
  };
}
