// components/AppInitializer.jsx - SIMPLIFICADO: Sin dependencias de ConnectionManager
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useOfflineCatalog } from '../hooks/useOfflineCatalog';
import { getAppMode, offlineManager } from '../utils/offlineManager';

/**
 * AppInitializer - Inicializador simplificado de la aplicación
 * 
 * Responsabilidades:
 * - Detectar modo PWA
 * - Descargar catálogo en background si es necesario
 * - NO maneja conexión (eso lo hace ConnectionContext)
 */
export default function AppInitializer({ children }) {
  const [appReady, setAppReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initStep, setInitStep] = useState('Iniciando...');
  const [progress, setProgress] = useState(0);
  
  const router = useRouter();
  
  const {
    updateCatalogSilently,
    downloadFullCatalog,
    isPWA,
    stats
  } = useOfflineCatalog();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 [AppInitializer] Inicializando aplicación...');
      setInitStep('Verificando entorno...');
      setProgress(20);
      
      const appMode = getAppMode();
      console.log(`📱 [AppInitializer] Modo detectado: ${appMode}`);
      
      setProgress(40);
      
      if (appMode === 'pwa') {
        console.log('📱 [AppInitializer] PWA detectada - Inicializando...');
        await initializePWA();
      } else {
        console.log('🌐 [AppInitializer] Modo Web normal');
      }
      
      setProgress(100);
      setAppReady(true);
      setInitializing(false);
      
    } catch (error) {
      console.error('❌ [AppInitializer] Error inicializando app:', error);
      // SIEMPRE permitir que la app arranque
      setProgress(100);
      setAppReady(true);
      setInitializing(false);
    }
  };

  const initializePWA = async () => {
    setInitStep('Verificando catálogo offline...');
    setProgress(50);
    
    // Verificar catálogo local
    const catalogoDisponible = checkCatalogoCompleto();
    console.log(`📦 [AppInitializer] Catálogo disponible: ${catalogoDisponible}`);
    
    setProgress(70);
    setInitStep('App lista');
    
    // Intentar descargar catálogo en background si hay conexión y no hay catálogo
    if (navigator.onLine && !catalogoDisponible) {
      console.log('📥 [AppInitializer] Descargando catálogo en background...');
      downloadFullCatalog().catch(() => {
        console.log('⚠️ [AppInitializer] No se pudo descargar catálogo');
      });
    } else if (navigator.onLine && catalogoDisponible) {
      // Auto-actualización silenciosa después de 3 segundos
      setTimeout(() => {
        updateCatalogSilently().catch(() => {});
      }, 3000);
    }
  };

  const checkCatalogoCompleto = () => {
    const clientes = offlineManager.getClientes();
    const productos = offlineManager.getProductos();
    return clientes.length >= 100 && productos.length >= 50;
  };

  // Loading screen
  if (initializing || !appReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white p-8 max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">VERTIMAR</h1>
            <p className="text-blue-200">Sistema ERP</p>
          </div>

          <div className="mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">{initStep}</h2>
          </div>

          <div className="w-full bg-blue-700 rounded-full h-3 mb-4">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
