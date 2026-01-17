// components/AppInitializer.jsx - VERSIÓN ULTRA ESTABLE sin redirecciones automáticas
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useOfflineCatalog } from '../hooks/useOfflineCatalog';
import { getAppMode, offlineManager } from '../utils/offlineManager';
import { connectionManager } from '../utils/ConnectionManager';

export default function AppInitializer({ children }) {
  const [appReady, setAppReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initStep, setInitStep] = useState('Iniciando...');
  const [isOnline, setIsOnline] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const router = useRouter();
  
  const {
    updateCatalogSilently,
    checkIfNeedsUpdate,
    getLastUpdateFormatted,
    downloadFullCatalog,
    isPWA,
    stats
  } = useOfflineCatalog();

  // ✅ MONITOREAR CONECTIVIDAD SIN ACCIONES AUTOMÁTICAS
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 [AppInitializer] Inicializando aplicación en modo ultra estable...');
      setInitStep('Verificando entorno...');
      setProgress(10);
      
      const appMode = getAppMode();
      console.log(`📱 [AppInitializer] Modo detectado: ${appMode}`);
      
      if (isPWA) {
        console.log('📱 [AppInitializer] PWA detectada - Inicializando sistema offline estable...');
        await initializePWAEstable();
      } else {
        console.log('🌐 [AppInitializer] Modo Web normal');
        setProgress(100);
        setAppReady(true);
        setInitializing(false);
      }
      
    } catch (error) {
      console.error('❌ [AppInitializer] Error inicializando app:', error);
      // ✅ SIEMPRE PERMITIR QUE LA APP ARRANQUE
      setProgress(100);
      setAppReady(true);
      setInitializing(false);
    }
  };

  const initializePWAEstable = async () => {
    setInitStep('Verificando catálogo offline...');
    setProgress(20);
    
    // 1. VERIFICAR CATÁLOGO LOCAL (no bloqueante)
    const catalogoDisponible = checkCatalogoCompleto();
    console.log(`📦 [AppInitializer] Catálogo completo disponible: ${catalogoDisponible}`);
    
    setProgress(30);
    
    // 2. VERIFICAR CONECTIVIDAD (no bloqueante)
    const currentlyOnline = navigator.onLine;
    console.log(`🌐 [AppInitializer] Estado de conexión: ${currentlyOnline ? 'ONLINE' : 'OFFLINE'}`);
    
    setProgress(40);
    
    // ⚠️ OFFLINE-FIRST: SIEMPRE permitir acceso, incluso sin catálogo
    // El usuario puede registrar pedidos offline incluso en cold start
    // El catálogo se descargará en background si hay conexión
    
    console.log('✅ [AppInitializer] PWA disponible - Modo offline-first activo');
    setInitStep('App lista');
    setProgress(80);
    
    // SIEMPRE permitir que la app arranque
    setAppReady(true);
    setInitializing(false);
    setProgress(100);
    
    // Intentar descargar catálogo en background (no bloqueante)
    if (currentlyOnline && !catalogoDisponible) {
      console.log('📥 [AppInitializer] Descargando catálogo en background (no bloqueante)...');
      // No esperar, solo iniciar en background
      downloadFullCatalog().catch(() => {
        console.log('⚠️ [AppInitializer] No se pudo descargar catálogo en background (continuando)');
      });
    } else if (currentlyOnline && catalogoDisponible) {
      // Auto-actualización silenciosa si ya hay catálogo
      handleIntelligentUpdateSilent();
    }
  };

  // ✅ AUTO-ACTUALIZACIÓN COMPLETAMENTE SILENCIOSA Y NO BLOQUEANTE
  const handleIntelligentUpdateSilent = async () => {
    // ✅ NO BLOQUEAR LA UI - Ejecutar en background
    setTimeout(async () => {
      try {
        console.log('🧠 [AppInitializer] Iniciando auto-actualización silenciosa en background...');
        
        const needsUpdate = checkIfNeedsUpdate();
        
        if (needsUpdate) {
          console.log('📥 [AppInitializer] Actualizaciones disponibles - Descargando en background...');
          
          // ✅ Actualización completamente silenciosa
          updateCatalogSilently().then(result => {
            if (result.success) {
              console.log('✅ [AppInitializer] Auto-actualización background completada');
            } else {
              console.log('⚠️ [AppInitializer] Auto-actualización background falló (normal)');
            }
          }).catch(error => {
            console.log('⚠️ [AppInitializer] Auto-actualización background con error:', error.message);
          });
        } else {
          console.log('✅ [AppInitializer] Catálogo ya actualizado - Sin necesidad de update');
        }
        
      } catch (error) {
        console.log('⚠️ [AppInitializer] Error en auto-actualización background:', error.message);
      }
    }, 3000); // ✅ Esperar 3 segundos después de que la app esté lista
  };

  // ⚠️ ELIMINADO: waitForFirstConnection
  // Ya no bloqueamos el acceso - la app siempre arranca
  // El catálogo se descarga en background si hay conexión

  // ✅ VERIFICAR SI TENEMOS CATÁLOGO COMPLETO
  const checkCatalogoCompleto = () => {
    const clientes = offlineManager.getClientes();
    const productos = offlineManager.getProductos();
    
    // Umbral para considerar "completo": al menos 100 clientes y 50 productos
    return clientes.length >= 100 && productos.length >= 50;
  };

  // ✅ COMPONENTE DE LOADING ULTRA MEJORADO
  if (initializing || !appReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white p-8 max-w-md">
          {/* Logo/Título */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">VERTIMAR</h1>
            <p className="text-blue-200">Sistema ERP Ultra Estable</p>
          </div>

          {/* Estado de inicialización */}
          <div className="mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">{initStep}</h2>
            <p className="text-blue-200">
              {isPWA ? 'Preparando PWA ultra estable...' : 'Cargando aplicación...'}
            </p>
            
            {/* ✅ INDICADOR DE CONECTIVIDAD */}
            <div className="flex items-center justify-center mt-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-400' : 'bg-orange-400'}`}></div>
              <span className="text-xs text-blue-200">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* ✅ BARRA DE PROGRESO */}
          <div className="w-full bg-blue-700 rounded-full h-3 mb-4">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* ✅ INFORMACIÓN DE DEBUG EN DESARROLLO */}
          {process.env.NODE_ENV === 'development' && stats && (
            <div className="mt-6 text-xs text-blue-300 bg-blue-800 bg-opacity-50 rounded p-3">
              <p><strong>Debug PWA Ultra Estable:</strong></p>
              <p>📱 Productos: {stats.productos} | Clientes: {stats.clientes}</p>
              <p>🕐 Última actualización: {getLastUpdateFormatted()}</p>
              <p>🌐 Online: {isOnline ? 'Sí' : 'No'}</p>
              <p>📦 Catálogo completo: {checkCatalogoCompleto() ? 'Sí' : 'No'}</p>
              <p>📍 Ruta actual: {router.pathname}</p>
              <p>🔄 Progreso: {progress}%</p>
              <p>🔒 Modo: Ultra Estable (sin redirecciones automáticas)</p>
            </div>
          )}

          {/* ✅ PASOS DE INICIALIZACIÓN */}
          <div className="text-xs text-blue-300 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded ${progress >= 20 ? 'bg-green-600' : 'bg-blue-700'}`}>
                {progress >= 20 ? '✅' : '⏳'} Verificando catálogo
              </div>
              <div className={`p-2 rounded ${progress >= 40 ? 'bg-green-600' : 'bg-blue-700'}`}>
                {progress >= 40 ? '✅' : '⏳'} Verificando conexión
              </div>
              <div className={`p-2 rounded ${progress >= 60 ? 'bg-green-600' : 'bg-blue-700'}`}>
                {progress >= 60 ? '✅' : '⏳'} Preparando app
              </div>
              <div className={`p-2 rounded ${progress >= 100 ? 'bg-green-600' : 'bg-blue-700'}`}>
                {progress >= 100 ? '✅' : '⏳'} Listo
              </div>
            </div>
          </div>

          {/* ✅ INFORMACIÓN ESPECÍFICA DEL MODO ULTRA ESTABLE */}
          {isPWA && progress >= 50 && (
            <div className="mt-4 text-xs text-blue-300 bg-blue-800 bg-opacity-30 rounded p-3">
              <p><strong>🔒 Modo Ultra Estable Activado:</strong></p>
              <p>• Sin redirecciones automáticas por cambios de conectividad</p>
              <p>• Control total del usuario sobre navegación</p>
              <p>• Verificación de conexión solo bajo demanda</p>
              <p>• Máxima estabilidad para trabajo offline</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ RENDERIZAR CHILDREN CUANDO ESTÉ LISTO
  return children;
}