// hooks/useBusquedaHybrid.js - Hook híbrido para búsqueda de clientes PWA/Web
import { useState, useEffect } from 'react';
import { useOfflineCatalog } from './useOfflineCatalog';
import { getAppMode } from '../utils/offlineManager';

export function useClienteSearchHybrid() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 10;

  const appMode = getAppMode();
  const isPWA = appMode === 'pwa';

  // Hook del catálogo offline
  const { buscarClientes } = useOfflineCatalog();

  // ✅ MONITOREAR CONECTIVIDAD SOLO EN PWA
  useEffect(() => {
    if (isPWA) {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      setIsOnline(navigator.onLine);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isPWA]);

  // ✅ BÚSQUEDA HÍBRIDA DE CLIENTES
  const buscarCliente = async ({ append = false } = {}) => {
    if (!busqueda.trim()) return;

    setLoading(true);
    try {
      console.log(`🔍 Buscando clientes en modo ${appMode}:`, busqueda);

      const nextOffset = append ? offset : 0;
      const response = await buscarClientes(busqueda, { limit: PAGE_SIZE, offset: nextOffset });
      const nuevosResultados = response?.data || [];

      setResultados(prev => (append ? [...prev, ...nuevosResultados] : nuevosResultados));
      setOffset(nextOffset + nuevosResultados.length);
      setHasMore(Boolean(response?.hasMore));
      setMostrarModal(true);
      
      console.log(`✅ Clientes encontrados: ${nuevosResultados.length}`);
    } catch (error) {
      console.error('❌ Error buscando clientes:', error);
      if (!append) setResultados([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const cargarMasResultados = async () => {
    if (loading || !hasMore) return;
    await buscarCliente({ append: true });
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setResultados([]);
    setMostrarModal(false);
    setOffset(0);
    setHasMore(false);
  };

  return {
    // Estados
    busqueda,
    setBusqueda,
    resultados,
    loading,
    mostrarModal,
    setMostrarModal,
    isPWA,
    isOnline,
    hasMore,
    
    // Funciones
    buscarCliente,
    limpiarBusqueda,
    cargarMasResultados
  };
}