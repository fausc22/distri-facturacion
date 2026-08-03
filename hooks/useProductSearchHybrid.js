import { useState, useEffect } from 'react';
import { useOfflineCatalog } from './useOfflineCatalog';
import { getAppMode } from '../utils/offlineManager';

const CANTIDAD_INICIAL = 0.5;

export function useProductoSearchHybrid() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(CANTIDAD_INICIAL);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const appMode = getAppMode();
  const isPWA = appMode === 'pwa';
  const { buscarProductos } = useOfflineCatalog();

  useEffect(() => {
    if (!isPWA) return undefined;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isPWA]);

  const resetCantidad = () => {
    setCantidad(CANTIDAD_INICIAL);
    setSubtotal(0);
  };

  const deseleccionarProducto = () => {
    setProductoSeleccionado(null);
    resetCantidad();
  };

  const cerrarModal = () => {
    deseleccionarProducto();
    setBusqueda('');
    setResultados([]);
    setMostrarModal(false);
  };

  const buscarProducto = async () => {
    if (!busqueda.trim()) return;

    setLoading(true);
    try {
      const encontrados = await buscarProductos(busqueda);
      deseleccionarProducto();
      setResultados(encontrados);
      setMostrarModal(true);
    } catch (error) {
      console.error('Error buscando productos:', error);
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
    const cantidadValida = Math.max(CANTIDAD_INICIAL, parseFloat(nuevaCantidad) || CANTIDAD_INICIAL);
    setCantidad(cantidadValida);
    if (productoSeleccionado) {
      setSubtotal(parseFloat((productoSeleccionado.precio * cantidadValida).toFixed(2)));
    }
  };

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
    isPWA,
    isOnline,
    buscarProducto,
    seleccionarProducto,
    actualizarCantidad,
    deseleccionarProducto,
    cerrarModal,
    limpiarSeleccion,
  };
}
