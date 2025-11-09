import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import InstallButton from '../components/InstallButton';
import { useConnection } from '../utils/ConnectionManager';
import { getAppMode, offlineManager } from '../utils/offlineManager';
import { LinkGuard } from '../components/OfflineGuard';
import { useOfflineCatalog, useOfflinePedidos } from '../hooks/useOfflineCatalog';

export default function Inicio() {
  const router = useRouter();
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalogStats, setCatalogStats] = useState(null);

  // ✅ CONNECTION MANAGER
  const { isOnline, eventType } = useConnection();
  const isPWA = getAppMode() === 'pwa';

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
    syncPedidosPendientes,
    syncing
  } = useOfflinePedidos();

  // ✅ CONDICIONES PARA MOSTRAR PANELES PWA
  const shouldShowCatalogPanel = isPWA && needsUpdate && isOnline;
  const shouldShowPedidosPanel = isPWA && hasPendientes && isOnline;
  const shouldShowPWAPanels = shouldShowCatalogPanel || shouldShowPedidosPanel;

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

  // ✅ CARGAR ESTADÍSTICAS DEL CATÁLOGO OFFLINE
  useEffect(() => {
    if (isPWA) {
      const stats = offlineManager.getStorageStats();
      setCatalogStats(stats);

      console.log('📊 Estadísticas del catálogo offline:', stats);
    }
  }, [isPWA]);

  // ✅ MANEJO DE EVENTOS DE CONECTIVIDAD SIMPLIFICADO
  useEffect(() => {
    if (!eventType) return;

    switch (eventType) {
      case 'connection_lost_redirect':
        console.log('📴 Redirección a /offline manejada por OfflineGuard');
        break;

      case 'connection_restored_normal':
        console.log('🌐 Conexión restaurada en inicio');
        break;

      default:
        break;
    }
  }, [eventType]);

  // ✅ HANDLERS PARA LOS BOTONES PWA
  const handleUpdateCatalog = async () => {
    console.log('🔄 Actualizando catálogo manualmente desde inicio...');
    await updateCatalogManual();

    if (isPWA) {
      const stats = offlineManager.getStorageStats();
      setCatalogStats(stats);
    }
  };

  const handleSyncPedidos = async () => {
    console.log('🔄 Sincronizando pedidos pendientes desde inicio...');
    await syncPedidosPendientes();

    if (isPWA) {
      const stats = offlineManager.getStorageStats();
      setCatalogStats(stats);
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

      {/* ✅ HEADER */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {getGreeting()}, {empleado?.nombre} {empleado?.apellido}
            </h1>
            <p className="text-blue-100">
              {getRoleDescription(empleado?.rol)}
            </p>
          </div>

          <div className="mt-4 md:mt-0 text-right">
            <InstallButton />
            <p className="text-blue-100 text-sm mt-2">
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

      {/* ✅ PANELES PWA */}
      {shouldShowPWAPanels && (
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
              <p className="text-sm mb-4 text-gray-600">
                <strong>Pedidos pendientes:</strong> {cantidadPendientes}
              </p>
              <button onClick={handleSyncPedidos} disabled={syncing} className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${syncing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'}`}>
                {syncing ? 'Sincronizando...' : `IMPORTAR PEDIDOS (${cantidadPendientes})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ MÓDULOS PRINCIPALES - Orden por frecuencia de uso */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

        {/* 1. VENTAS - Prioridad máxima */}
        {(empleado?.rol === 'GERENTE' || empleado?.rol === 'VENDEDOR') && (
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-emerald-200">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 md:p-6">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-25 p-3 md:p-4 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white ml-3">Ventas</h3>
              </div>
              <p className="text-emerald-50 mt-2 text-sm">Gestión de pedidos y facturación</p>
            </div>
            <div className="p-3 md:p-4 space-y-1">
              <LinkGuard href="/ventas/RegistrarPedido" className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition-colors group">
                <span className="font-medium text-gray-800 group-hover:text-emerald-700">Registrar Nota de Pedido</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LinkGuard>
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
            </div>
          </div>
        )}

        {/* 2. INVENTARIO */}
        {(empleado?.rol === 'GERENTE' || empleado?.rol === 'VENDEDOR') && (
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

        {/* 3. FINANZAS - Solo gerentes, nuevo orden */}
        {empleado?.rol === 'GERENTE' && (
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

        {/* 4. ADMINISTRACIÓN - Solo gerentes */}
        {empleado?.rol === 'GERENTE' && (
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

        {/* 5. COMPRAS - Al final por menor uso */}
        {empleado?.rol === 'GERENTE' && (
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

      {/* ✅ INFORMACIÓN DEL SISTEMA */}
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
            <p className="text-gray-800 font-medium">{isOnline ? '✅ Conectado' : '📴 Sin conexión'}</p>
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
    </div>
  );
}
