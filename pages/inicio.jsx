import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import InstallButton from '../components/InstallButton';
import { useConnectionContext } from '../context/ConnectionContext';
import { getAppMode, offlineManager } from '../utils/offlineManager';
import { LinkGuard } from '../components/OfflineGuard';
import { useOfflineCatalog, useOfflinePedidos } from '../hooks/useOfflineCatalog';

export default function Inicio() {
  const router = useRouter();
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalogStats, setCatalogStats] = useState(null);

  // ✅ CONEXIÓN CENTRALIZADA - Única fuente de verdad
  const { modoOffline, reconectando, reconectar, isPWA } = useConnectionContext();

  // ✅ HOOKS PARA PWA
  const {
    loading: catalogLoading,
    needsUpdate,
    updateCatalogManual,
    lastUpdateFormatted,
    getCatalogInfo
  } = useOfflineCatalog();

  const {
    hasPendientes,
    cantidadPendientes,
    hasEdicionesPendientes,
    cantidadEdicionesPendientes,
    cantidadEdicionesConflicto,
    cantidadEdicionesFallidasPermanentes,
    retryConflictedEdits,
    lastSyncSummary,
    syncPedidosPendientes,
    syncing
  } = useOfflinePedidos();

  // ✅ CONDICIONES PARA MOSTRAR PANELES PWA (solo en modo online)
  const shouldShowCatalogPanel = isPWA && needsUpdate && !modoOffline;
  const shouldShowPedidosPanel = isPWA && (hasPendientes || hasEdicionesPendientes || cantidadEdicionesConflicto > 0 || cantidadEdicionesFallidasPermanentes > 0) && !modoOffline;
  const shouldShowPWAPanels = shouldShowCatalogPanel || shouldShowPedidosPanel;

  // Autenticación
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const empleadoData = localStorage.getItem('empleado');

        if (!token) {
          router.replace('/login');
          return;
        }

        if (empleadoData) {
          try {
            const parsedEmpleado = JSON.parse(empleadoData);
            setEmpleado(parsedEmpleado);
          } catch (error) {
            console.error('Error parsing empleado data:', error);
            setEmpleado({
              nombre: 'Usuario',
              apellido: '',
              rol: localStorage.getItem('role') || 'EMPLEADO'
            });
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        toast.error('Error verificando autenticación');
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Cargar estadísticas del catálogo offline
  useEffect(() => {
    if (isPWA) {
      const stats = offlineManager.getStorageStats();
      setCatalogStats(stats);
      console.log('📊 [inicio] Estadísticas del catálogo offline:', stats);
    }
  }, [isPWA]);

  // Handlers para los botones PWA
  const handleUpdateCatalog = async () => {
    console.log('🔄 [inicio] Actualizando catálogo manualmente...');
    
    if (modoOffline) {
      toast.error('Debe reconectar la app primero');
      return;
    }
    
    await updateCatalogManual();

    if (isPWA) {
      const stats = offlineManager.getStorageStats();
      setCatalogStats(stats);
    }
  };

  const handleSyncPedidos = async () => {
    console.log('🔄 [inicio] Sincronizando pedidos pendientes...');
    
    if (modoOffline) {
      toast.error('Debe reconectar la app primero');
      return;
    }
    
    // Mostrar confirmación si hay muchos pedidos
    if (cantidadPendientes > 5) {
      const confirmar = window.confirm(
        `¿Desea sincronizar ${cantidadPendientes} pedidos pendientes?`
      );
      if (!confirmar) return;
    }
    
    try {
      const resultado = await syncPedidosPendientes();

      if (isPWA) {
        const stats = offlineManager.getStorageStats();
        setCatalogStats(stats);
      }
      
      // Mostrar resultado detallado
      if (resultado.success) {
        if (resultado.exitosos > 0 || resultado.edicionesExitosas > 0) {
          toast.success(
            `Sync OK: ${resultado.exitosos || 0} pedidos, ${resultado.edicionesExitosas || 0} ediciones, ${resultado.duplicados || 0} duplicados`,
            { duration: 5000 }
          );
        } else {
          toast.info('No hubo cambios para sincronizar');
        }
        if ((resultado.conflictos || 0) > 0) {
          toast.error(`Se detectaron ${resultado.conflictos} conflictos de edición`, { duration: 5000 });
        }
      } else if (resultado.error) {
        console.error('❌ [inicio] Error en sincronización:', resultado.error);
      }
    } catch (error) {
      console.error('❌ [inicio] Error inesperado sincronizando:', error);
      toast.error('Error inesperado durante la sincronización. Intente nuevamente.');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getRoleDescription = (rol) => {
    switch (rol) {
      case 'GERENTE':
        return 'Gerente - Acceso completo al sistema';
      case 'VENDEDOR':
        return 'Vendedor - Acceso a ventas e inventario';
      default:
        return 'Empleado';
    }
  };

  // ✅ HANDLER DE RECONEXIÓN - Usa el Context centralizado
  const handleReconectarApp = async () => {
    await reconectar();
  };

  // ✅ DETERMINAR SI ESTAMOS EN MODO OFFLINE
  const estaEnModoOffline = isPWA && modoOffline;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Head>
        <title>VERTIMAR | INICIO</title>
      </Head>

      {/* ✅ HEADER - Cambia de color en modo offline */}
      <div className={`bg-gradient-to-r ${estaEnModoOffline ? 'from-orange-500 to-orange-600' : 'from-blue-500 to-blue-600'} text-white rounded-xl shadow-lg p-6 mb-6`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {getGreeting()}, {empleado?.nombre} {empleado?.apellido}
            </h1>
            <p className={estaEnModoOffline ? 'text-orange-100' : 'text-blue-100'}>
              {estaEnModoOffline ? 'Modo Offline - Solo Registrar Pedidos' : getRoleDescription(empleado?.rol)}
            </p>
          </div>

          <div className="mt-4 md:mt-0 text-right">
            <InstallButton />
            <p className={`${estaEnModoOffline ? 'text-orange-100' : 'text-blue-100'} text-sm mt-2`}>
              {new Date().toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ✅ BOTÓN "RECONECTAR APP" - Solo visible cuando está en modo offline */}
      {estaEnModoOffline && (
        <div className="mb-6 border-2 rounded-xl p-6 shadow-lg bg-orange-50 border-orange-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-orange-100">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Modo Offline Activo
                </h3>
                <p className="text-sm text-gray-600">
                  Toque el botón cuando tenga conexión estable para reconectar la app
                </p>
              </div>
            </div>
            <button
              onClick={handleReconectarApp}
              disabled={reconectando}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                reconectando
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg'
              }`}
            >
              {reconectando ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reconectando...
                </span>
              ) : (
                '🔄 RECONECTAR APP'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ✅ PANELES PWA - Solo en modo online */}
      {!estaEnModoOffline && shouldShowPWAPanels && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {shouldShowCatalogPanel && (
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-orange-100">
                  <svg className={`w-6 h-6 ${catalogLoading ? 'text-gray-500 animate-spin' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 ml-3">ACTUALIZAR CATALOGO</h3>
              </div>
              <p className="text-sm mb-4 text-gray-600">
                {catalogLoading ? 'Actualizando catálogo...' : 'Hay actualizaciones disponibles'}
              </p>
              <button onClick={handleUpdateCatalog} disabled={catalogLoading} className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${catalogLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'}`}>
                {catalogLoading ? 'Actualizando...' : 'Actualizar Ahora'}
              </button>
            </div>
          )}

          {shouldShowPedidosPanel && (
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <svg className={`w-6 h-6 ${syncing ? 'text-gray-500 animate-pulse' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 ml-3">IMPORTAR PEDIDOS</h3>
              </div>
              <p className="text-sm mb-2 text-gray-600">
                <strong>Pedidos nuevos pendientes:</strong> {cantidadPendientes}
              </p>
              <p className="text-sm mb-4 text-gray-600">
                <strong>Ediciones offline pendientes:</strong> {cantidadEdicionesPendientes}
              </p>
              <p className="text-sm mb-2 text-gray-600">
                <strong>Conflictos:</strong> {cantidadEdicionesConflicto}
              </p>
              <p className="text-sm mb-4 text-gray-600">
                <strong>Fallidas permanentes:</strong> {cantidadEdicionesFallidasPermanentes}
              </p>
              <button onClick={handleSyncPedidos} disabled={syncing} className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${syncing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'}`}>
                {syncing ? 'Sincronizando...' : `SINCRONIZAR (${cantidadPendientes + cantidadEdicionesPendientes})`}
              </button>
              {cantidadEdicionesConflicto > 0 && (
                <button
                  onClick={() => {
                    const retried = retryConflictedEdits();
                    toast.success(`${retried} conflictos pasaron a reintento`);
                  }}
                  className="mt-2 w-full py-2 px-3 rounded-lg font-medium transition-all bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg"
                >
                  Reintentar conflictos
                </button>
              )}
              {lastSyncSummary && (
                <div className="mt-3 p-2 rounded bg-gray-50 border border-gray-200 text-xs text-gray-700">
                  Último sync: {lastSyncSummary.exitosos} pedidos, {lastSyncSummary.edicionesExitosas} ediciones, {lastSyncSummary.conflictos} conflictos.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ✅ MÓDULOS PRINCIPALES - Modo offline: solo VENTAS con Registrar Pedido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

        {/* 1. VENTAS - Prioridad máxima - SIEMPRE visible */}
        {(empleado?.rol === 'GERENTE' || empleado?.rol === 'VENDEDOR') && (
          <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border-2 ${estaEnModoOffline ? 'border-orange-300' : 'border-transparent hover:border-emerald-200'}`}>
            <div className={`bg-gradient-to-br ${estaEnModoOffline ? 'from-orange-500 to-orange-600' : 'from-emerald-500 to-emerald-600'} p-5 md:p-6`}>
              <div className="flex items-center">
                <div className="bg-white bg-opacity-25 p-3 md:p-4 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white ml-3">Ventas</h3>
              </div>
              <p className={`${estaEnModoOffline ? 'text-orange-50' : 'text-emerald-50'} mt-2 text-sm`}>
                {estaEnModoOffline ? 'Modo Offline - Solo Registrar Pedidos' : 'Gestión de pedidos y facturación'}
              </p>
            </div>
            <div className="p-3 md:p-4 space-y-1">
              {/* ✅ REGISTRAR PEDIDO - SIEMPRE disponible */}
              <LinkGuard href="/ventas/RegistrarPedido" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-emerald-700">Registrar Nota de Pedido</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              
              {/* ✅ OTRAS OPCIONES DE VENTAS - Solo en modo online */}
              {!estaEnModoOffline && (
                <>
                  <LinkGuard href="/ventas/HistorialPedidos" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition-colors group">
                    <span className="font-medium text-gray-800 group-hover:text-emerald-700">Historial de Pedidos</span>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </LinkGuard>
                  {empleado?.rol === 'GERENTE' && (
                    <>
                    <LinkGuard href="/ventas/VentaDirecta" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition-colors group">
                      <span className="font-medium text-gray-800 group-hover:text-emerald-700">Venta Directa</span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </LinkGuard>
                    <LinkGuard href="/ventas/Facturacion" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition-colors group">
                      <span className="font-medium text-gray-800 group-hover:text-emerald-700">Facturación</span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </LinkGuard>
                    </>
                  )}
                  <LinkGuard href="/ventas/comprobantes" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition-colors group">
                    <span className="font-medium text-gray-800 group-hover:text-emerald-700">Gestión de Comprobantes</span>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </LinkGuard>
                </>
              )}
              {estaEnModoOffline && (
                <LinkGuard href="/ventas/HistorialPedidosOffline" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-orange-50 active:bg-orange-100 transition-colors group">
                  <span className="font-medium text-gray-800 group-hover:text-orange-700">Historial de Pedidos Offline</span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </LinkGuard>
              )}
            </div>
          </div>
        )}

        {/* 2. INVENTARIO - Solo en modo online */}
        {!estaEnModoOffline && (empleado?.rol === 'GERENTE' || empleado?.rol === 'VENDEDOR') && (
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-blue-200">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 md:p-6">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-25 p-3 md:p-4 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white ml-3">Inventario</h3>
              </div>
              <p className="text-blue-50 mt-2 text-sm">Control de stock y productos</p>
            </div>
            <div className="p-3 md:p-4 space-y-1">
              {empleado?.rol === 'GERENTE' && (
                <LinkGuard href="/inventario/Productos" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors group">
                  <span className="font-medium text-gray-800 group-hover:text-blue-700">Gestión de Productos</span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </LinkGuard>
              )}
              <LinkGuard href="/inventario/consultaStock" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-blue-700">Consulta de Stock</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              <LinkGuard href="/inventario/Remitos" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-blue-700">Remitos</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
            </div>
          </div>
        )}

        {/* 3. FINANZAS - Solo gerentes, solo en modo online */}
        {!estaEnModoOffline && empleado?.rol === 'GERENTE' && (
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-teal-200">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-5 md:p-6">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-25 p-3 md:p-4 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white ml-3">Finanzas</h3>
              </div>
              <p className="text-teal-50 mt-2 text-sm">Control financiero y reportes</p>
            </div>
            <div className="p-3 md:p-4 space-y-1">
              <LinkGuard href="/finanzas/fondos" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-teal-50 active:bg-teal-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-teal-700">Fondos</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              <LinkGuard href="/finanzas/reportes" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-teal-50 active:bg-teal-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-teal-700">Reportes Financieros</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              <LinkGuard href="/finanzas/Listados" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-teal-50 active:bg-teal-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-teal-700">Listados (IVA, Precios)</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
            </div>
          </div>
        )}

        {/* 4. ADMINISTRACIÓN - Solo gerentes, solo en modo online */}
        {!estaEnModoOffline && empleado?.rol === 'GERENTE' && (
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-purple-200">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 md:p-6">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-25 p-3 md:p-4 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white ml-3">Administración</h3>
              </div>
              <p className="text-purple-50 mt-2 text-sm">Gestión de usuarios y sistema</p>
            </div>
            <div className="p-3 md:p-4 space-y-1">
              <LinkGuard href="/edicion/Empleados" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-purple-50 active:bg-purple-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-purple-700">Gestión de Empleados</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              <LinkGuard href="/edicion/Clientes" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-purple-50 active:bg-purple-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-purple-700">Gestión de Clientes</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              <LinkGuard href="/edicion/Proveedores" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-purple-50 active:bg-purple-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-purple-700">Gestión de Proveedores</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              <LinkGuard href="/auditoria/Auditoria" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-purple-50 active:bg-purple-100 transition-colors group border-t border-gray-200">
                <span className="font-medium text-gray-800 group-hover:text-purple-700">Auditoría del Sistema</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
            </div>
          </div>
        )}

        {/* 5. COMPRAS - Al final por menor uso, solo en modo online */}
        {!estaEnModoOffline && empleado?.rol === 'GERENTE' && (
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-amber-200">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 md:p-6">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-25 p-3 md:p-4 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white ml-3">Compras</h3>
              </div>
              <p className="text-amber-50 mt-2 text-sm">Gestión de compras y gastos</p>
            </div>
            <div className="p-3 md:p-4 space-y-1">
              <LinkGuard href="/compras/RegistrarCompra" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-amber-50 active:bg-amber-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-amber-700">Registrar Compra Proveedores</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              <LinkGuard href="/compras/HistorialCompras" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-amber-50 active:bg-amber-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-amber-700">Historial de Compras</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
              <LinkGuard href="/compras/RegistrarGasto" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-amber-50 active:bg-amber-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-amber-700">Registrar Gasto</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
            </div>
          </div>
        )}
      </div>

      {/* ✅ INFORMACIÓN DEL SISTEMA - Solo en modo online */}
      {!estaEnModoOffline && (
      <div className="mt-6 md:mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Información del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg">
            <strong className="text-gray-600">Usuario:</strong>
            <p className="text-gray-800 font-medium">{empleado?.usuario || 'N/A'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <strong className="text-gray-600">Rol:</strong>
            <p className="text-gray-800 font-medium">{empleado?.rol || 'N/A'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <strong className="text-gray-600">Email:</strong>
            <p className="text-gray-800 font-medium">{empleado?.email || 'No configurado'}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg">
            <strong className="text-gray-600">Modo:</strong>
            <p className="text-gray-800 font-medium">{isPWA ? '📱 PWA' : '🌐 Web Online'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <strong className="text-gray-600">Estado:</strong>
            <p className="text-gray-800 font-medium">✅ Conectado</p>
          </div>
          {isPWA && catalogStats && (
            <>
              <div className="bg-white p-3 rounded-lg">
                <strong className="text-gray-600">Catálogo:</strong>
                <p className="text-gray-800 font-medium">{catalogStats.clientes} clientes, {catalogStats.productos} productos</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <strong className="text-gray-600">Storage:</strong>
                <p className="text-gray-800 font-medium">{catalogStats.storageUsed?.mb}MB utilizados</p>
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
