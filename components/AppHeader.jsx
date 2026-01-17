import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiX, FiMenu, FiWifi, FiWifiOff } from 'react-icons/fi';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { getAppMode } from '../utils/offlineManager';
import { useConnection } from '../utils/ConnectionManager';
import { LinkGuard } from './OfflineGuard';

function AppHeader() {
  const [showMenu, setShowMenu] = useState(false);
  const [role, setRole] = useState(null);
  const [empleado, setEmpleado] = useState(null);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [isPWA, setIsPWA] = useState(false);
  const router = useRouter();

  // ⚠️ CONNECTION MANAGER - Usar navigator.onLine directamente para evitar bugs de estado
  const { checkOnDemand } = useConnection();
  
  // ⚠️ Estado local de conexión - RESPETA MODO OFFLINE FORZADO
  // El navbar NO debe cambiar automáticamente si el modo offline forzado está activo
  const [isOnlineLocal, setIsOnlineLocal] = useState(() => {
    if (typeof window === 'undefined') return true;
    
    // Si hay modo offline forzado guardado, siempre mostrar offline (naranja)
    const modoOfflineForzado = localStorage.getItem('vertimar_modo_offline_forzado');
    if (modoOfflineForzado === 'true') {
      return false; // Forzar naranja (offline)
    }
    
    return navigator.onLine;
  });
  
  useEffect(() => {
    const updateOnlineStatus = () => {
      // ⚠️ CRÍTICO: Si hay modo offline forzado, NO actualizar el estado
      // El navbar debe quedarse naranja hasta que se reconecte manualmente
      const modoOfflineForzado = localStorage.getItem('vertimar_modo_offline_forzado');
      
      if (modoOfflineForzado === 'true') {
        // Mantener naranja (offline) aunque haya conexión
        setIsOnlineLocal(false);
        return;
      }
      
      // Solo actualizar si NO hay modo offline forzado
      setIsOnlineLocal(navigator.onLine);
    };
    
    // Verificar estado inicial
    updateOnlineStatus();
    
    const handleOnline = () => {
      // Solo actualizar si NO hay modo offline forzado
      const modoOfflineForzado = localStorage.getItem('vertimar_modo_offline_forzado');
      if (modoOfflineForzado !== 'true') {
        setIsOnlineLocal(true);
      }
    };
    
    const handleOffline = () => {
      // Siempre actualizar cuando se pierde conexión
      setIsOnlineLocal(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // ⚠️ Polling para detectar cambios en localStorage (mismo origen)
    // Esto es necesario porque el evento 'storage' solo se dispara en otras pestañas
    const intervalId = setInterval(() => {
      const modoOfflineForzado = localStorage.getItem('vertimar_modo_offline_forzado');
      const tieneConexion = navigator.onLine;
      
      if (modoOfflineForzado === 'true') {
        // Si hay modo offline forzado, mantener naranja (offline)
        if (isOnlineLocal) {
          setIsOnlineLocal(false);
        }
      } else {
        // Si NO hay modo offline forzado, actualizar según conexión real
        if (tieneConexion !== isOnlineLocal) {
          setIsOnlineLocal(tieneConexion);
        }
      }
    }, 500); // Verificar cada 500ms
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnlineLocal]);

  // ✅ NAVEGACIÓN CON VERIFICACIÓN DE CONEXIÓN MEJORADA
  const handleNavigationWithCheck = async (href) => {
    // ✅ Rutas que siempre están disponibles (registrar pedido funciona offline)
    const alwaysAvailableRoutes = [
      '/ventas/RegistrarPedido',
      '/inicio',
      '/login',
      '/'
    ];
    
    // ✅ Rutas que requieren conexión estricta
    const onlineRequiredRoutes = [
      '/ventas/HistorialPedidos',
      '/ventas/ListaPrecios', 
      '/ventas/Facturacion',
      '/inventario',
      '/compras',
      '/finanzas',
      '/edicion'
    ];
    
    // ✅ CERRAR MENÚS INMEDIATAMENTE
    setShowMenu(false);
    setOpenSubMenu(null);
    
    if (alwaysAvailableRoutes.includes(href)) {
      // ✅ Navegación directa para rutas siempre disponibles
      console.log(`🔄 Navegación directa a: ${href}`);
      
      try {
        await router.push(href);
        console.log('✅ Navegación exitosa');
      } catch (error) {
        console.log('⚠️ Router falló, forzando navegación directa...');
        window.location.href = href;
      }
      
    } else if (onlineRequiredRoutes.some(route => href.includes(route))) {
      // ⚠️ Verificar conexión para rutas que la requieren
      // Usar navigator.onLine directamente (más confiable que estado del ConnectionManager)
      console.log(`🔍 Verificando conexión para: ${href}`);
      
      const tieneConexion = typeof window !== 'undefined' ? navigator.onLine : true;
      
      if (!tieneConexion) {
        console.log(`📴 Sin conexión, bloqueando navegación a: ${href}`);
        toast('📴 Esta sección requiere conexión a internet', {
          duration: 3000,
          icon: '📴',
          style: {
            background: '#f59e0b',
            color: '#fff',
          },
        });
        return;
      }
      
      // Si hay conexión, navegar
      console.log(`🌐 Conexión disponible, navegando a: ${href}`);
      try {
        await router.push(href);
      } catch (error) {
        console.log('⚠️ Error navegando, usando navegación directa');
        window.location.href = href;
      }
      
    } else {
      // ✅ Navegación normal para otras rutas
      try {
        await router.push(href);
      } catch (error) {
        window.location.href = href;
      }
    }
  };

  // ⚠️ COMPONENTE LINK - Usar navigator.onLine directamente para evitar bugs
  const MenuLink = ({ href, className, children, requiresOnline = false }) => {
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      handleNavigationWithCheck(href);
    };

    // ⚠️ Determinar si mostrar como deshabilitado - Usar estado local
    const shouldDisable = isPWA && requiresOnline && !isOnlineLocal;

    return (
      <a 
        href="#" 
        className={`${className} ${
          shouldDisable 
            ? 'opacity-60 cursor-not-allowed text-gray-400' 
            : 'hover:bg-gray-100'
        }`}
        onClick={shouldDisable ? (e) => e.preventDefault() : handleClick}
        onTouchStart={(e) => e.preventDefault()}
        title={shouldDisable ? "Requiere conexión a internet" : ""}
      >
        <span className="flex items-center gap-2">
          {children}
          {shouldDisable && <span className="text-xs">🔒</span>}
        </span>
      </a>
    );
  };

  useEffect(() => {
    // Obtener rol y datos del empleado
    const roleFromStorage = localStorage.getItem("role");
    const empleadoFromStorage = localStorage.getItem("empleado");
    
    setRole(roleFromStorage);
    setIsPWA(getAppMode() === 'pwa');
    
    if (empleadoFromStorage) {
      try {
        const empleadoData = JSON.parse(empleadoFromStorage);
        setEmpleado(empleadoData);
      } catch (error) {
        console.error('Error parsing empleado data:', error);
        setEmpleado(null);
      }
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      setShowMenu(false);
      setOpenSubMenu(null);
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("empleado");
    
    setRole(null);
    setEmpleado(null);
    
    router.push("/");
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    setOpenSubMenu(null);
  };

  const toggleSubMenu = (menuName) => {
    setOpenSubMenu(openSubMenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = () => {
    setShowMenu(false);
    setOpenSubMenu(null);
  };

  const getUserName = () => {
    if (empleado?.nombre) {
      return `${empleado.nombre} ${empleado.apellido || ''}`.trim();
    }
    return 'Usuario';
  };

  // ✅ VARIANTES DE ANIMACIÓN
  const subMenuVariants = {
    open: { opacity: 1, y: 0, display: 'block' },
    closed: { opacity: 0, y: -10, display: 'none' },
  };

  const logoVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.9 },
  };

  const menuItemVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  const logoutVariants = {
    hover: { scale: 1.1, backgroundColor: 'rgba(255, 0, 0, 0.2)' },
    tap: { scale: 0.9 },
  };

  // ⚠️ DETERMINAR TEMA SEGÚN CONECTIVIDAD - Usar estado local
  const getNavbarTheme = () => {
    if (!isPWA) return 'bg-blue-500'; // Tema normal para web
    
    return isOnlineLocal ? 'bg-blue-500' : 'bg-orange-500'; // Azul online, naranja offline
  };

  // ⚠️ OBTENER ESTILO DE MENÚ SEGÚN DISPONIBILIDAD OFFLINE - Usar estado local
  const getMenuItemStyle = (requiresOnline = false) => {
    if (!isPWA) {
      return "text-white focus:outline-none font-bold"; // Normal para web
    }
    
    if (isOnlineLocal) {
      return "text-white focus:outline-none font-bold"; // Normal cuando hay conexión
    }
    
    if (requiresOnline) {
      return "text-orange-200 focus:outline-none font-bold opacity-60 cursor-not-allowed"; // Deshabilitado offline
    }
    
    return "text-white focus:outline-none font-bold"; // Disponible offline
  };

  return (
    <>
      <nav className={`${getNavbarTheme()} text-white py-4 sticky top-0 z-50 transition-colors duration-300`}>
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <motion.div
            variants={logoVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Link href="/" className="text-xl sm:text-3xl font-bold">
              VERTIMAR SRL
            </Link>
          </motion.div>

          {/* ⚠️ INDICADOR DE CONECTIVIDAD - Usar estado local */}
          {isPWA && (
            <div className="flex items-center gap-2 bg-black bg-opacity-20 px-3 py-1 rounded-full">
              {isOnlineLocal ? (
                <>
                  <FiWifi className="text-green-300" size={16} />
                  <span className="text-green-300 text-sm font-medium">ONLINE</span>
                </>
              ) : (
                <>
                  <FiWifiOff className="text-orange-300" size={16} />
                  <span className="text-orange-300 text-sm font-medium">OFFLINE</span>
                </>
              )}
            </div>
          )}

          {/* Menú para pantallas pequeñas */}
          <div className="sm:hidden ml-auto">
            <motion.button onClick={toggleMenu} className="text-white focus:outline-none">
              {showMenu ? <FiX size={24} /> : <FiMenu size={24} />}
            </motion.button>
          </div>

          {/* Menú para pantallas grandes */}
          <div className="hidden sm:flex flex-grow justify-center space-x-6 items-center">
            {/* VENTAS - SIEMPRE DISPONIBLE (RegistrarPedido funciona offline) */}
            {(role === 'GERENTE' || role === 'VENDEDOR') && (
              <motion.div className="relative" variants={menuItemVariants} whileHover="hover" whileTap="tap">
                <button 
                  onClick={() => toggleSubMenu('ventas')} 
                  className={getMenuItemStyle(false)}
                  disabled={false} // Siempre habilitado
                >
                  VENTAS
                </button>
                <motion.div
                  className="absolute top-full left-0 bg-white text-black shadow-md rounded-md p-2 mt-1 origin-top transition duration-200 ease-in-out"
                  variants={subMenuVariants}
                  initial="closed"
                  animate={openSubMenu === 'ventas' ? 'open' : 'closed'}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ minWidth: '200px' }}
                >
                  <MenuLink 
                    href="/ventas/RegistrarPedido" 
                    className="block py-2 px-4 text-sm whitespace-nowrap"
                    requiresOnline={false}
                  >
                    Registrar Pedido 
                  </MenuLink>
                  <MenuLink 
                    href="/ventas/HistorialPedidos" 
                    className="block py-2 px-4 text-sm whitespace-nowrap border-b border-black-200"
                    requiresOnline={true}
                  >
                    Modificar Nota de Pedido
                  </MenuLink>
                  
                  {(role === 'GERENTE') && (
                    <>
                    <MenuLink 
                        href="/ventas/VentaDirecta" 
                        className="block py-2 px-4 text-sm whitespace-nowrap"
                        requiresOnline={true}
                      >
                        Venta Directa
                      </MenuLink>
                      <MenuLink 
                        href="/ventas/Facturacion" 
                        className="block py-2 px-4 text-sm whitespace-nowrap mt-1 border-b border-black-200"
                        requiresOnline={true}
                      >
                        Facturación
                      </MenuLink>
                      <MenuLink 
                        href="/ventas/ListaPrecios" 
                        className="block py-2 px-4 text-sm whitespace-nowrap"
                        requiresOnline={true}
                      >
                        Generar Lista de Precios
                      </MenuLink>
                      
                    </>
                  )}
                  <MenuLink 
                    href="/ventas/comprobantes" 
                    className="block py-2 px-4 text-sm whitespace-nowrap"
                    requiresOnline={true}
                  >
                    Gestión de Comprobantes
                  </MenuLink>
                </motion.div>
              </motion.div>
            )}

            {/* INVENTARIO - Requiere online */}
            {(role === 'GERENTE' || role === 'VENDEDOR') && (
              <motion.div className="relative" variants={menuItemVariants} whileHover="hover" whileTap="tap">
                <button 
                  onClick={() => isPWA && !isOnlineLocal ? null : toggleSubMenu('inventario')} 
                  className={getMenuItemStyle(true)}
                  disabled={isPWA && !isOnlineLocal}
                  title={isPWA && !isOnlineLocal ? "Requiere conexión a internet" : ""}
                >
                  INVENTARIO
                  {isPWA && !isOnlineLocal && <span className="ml-1 text-xs">🔒</span>}
                </button>
                {(isOnlineLocal || !isPWA) && (
                  <motion.div
                    className="absolute top-full left-0 bg-white text-black shadow-md rounded-md p-2 mt-1 origin-top transition duration-200 ease-in-out"
                    variants={subMenuVariants}
                    initial="closed"
                    animate={openSubMenu === 'inventario' ? 'open' : 'closed'}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ minWidth: '200px' }}
                  >
                    {(role === 'GERENTE') && ( 
                      <MenuLink 
                        href="/inventario/Productos" 
                        className="block py-2 px-4 text-sm whitespace-nowrap"
                        requiresOnline={true}
                      >
                        Productos
                      </MenuLink>
                    )}
                    <MenuLink 
                      href="/inventario/consultaStock" 
                      className="block py-2 px-4 text-sm whitespace-nowrap border-b border-gray-200"
                      requiresOnline={true}
                    >
                      Consulta de STOCK
                    </MenuLink>
                    <MenuLink 
                      href="/inventario/Remitos" 
                      className="block py-2 px-4 text-sm whitespace-nowrap"
                      requiresOnline={true}
                    >
                      Remitos
                    </MenuLink>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* COMPRAS - Requiere online */}
            <motion.div className="relative" variants={menuItemVariants} whileHover="hover" whileTap="tap">
              <button 
                onClick={() => isPWA && !isOnlineLocal ? null : toggleSubMenu('compras')} 
                className={getMenuItemStyle(true)}
                disabled={isPWA && !isOnlineLocal}
                title={isPWA && !isOnlineLocal ? "Requiere conexión a internet" : ""}
              >
                COMPRAS
                {isPWA && !isOnlineLocal && <span className="ml-1 text-xs">🔒</span>}
              </button>
              {(isOnlineLocal || !isPWA) && (
                <motion.div
                  className="absolute top-full left-0 bg-white text-black shadow-md rounded-md p-2 mt-1 origin-top transition duration-200 ease-in-out"
                  variants={subMenuVariants}
                  initial="closed"
                  animate={openSubMenu === 'compras' ? 'open' : 'closed'}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ minWidth: '200px' }}
                >
                  {role === 'GERENTE' && (
                    <MenuLink 
                      href="/compras/RegistrarCompra" 
                      className="block py-2 px-4 text-sm whitespace-nowrap"
                      requiresOnline={true}
                    >
                      Registrar Compra
                    </MenuLink>
                  )}
                  
                  <MenuLink 
                    href="/compras/RegistrarGasto" 
                    className="block py-2 px-4 text-sm whitespace-nowrap border-b border-gray-200"
                    requiresOnline={true}
                  >
                    Registrar Gasto
                  </MenuLink>
                  
                  {role === 'GERENTE' && (
                    <MenuLink 
                      href="/compras/HistorialCompras" 
                      className="block py-2 px-4 text-sm whitespace-nowrap"
                      requiresOnline={true}
                    >
                      Historial de Compras
                    </MenuLink>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* FINANZAS - Solo gerentes y requiere online */}
            {role === 'GERENTE' && (
              <motion.div className="relative" variants={menuItemVariants} whileHover="hover" whileTap="tap">
                <button 
                  onClick={() => isPWA && !isOnlineLocal ? null : toggleSubMenu('finanzas')} 
                  className={getMenuItemStyle(true)}
                  disabled={isPWA && !isOnlineLocal}
                  title={isPWA && !isOnlineLocal ? "Requiere conexión a internet" : ""}
                >
                  FINANZAS
                  {isPWA && !isOnlineLocal && <span className="ml-1 text-xs">🔒</span>}
                </button>
                {(isOnlineLocal || !isPWA) && (
                  <motion.div
                    className="absolute top-full left-0 bg-white text-black shadow-md rounded-md p-2 mt-1 origin-top transition duration-200 ease-in-out"
                    variants={subMenuVariants}
                    initial="closed"
                    animate={openSubMenu === 'finanzas' ? 'open' : 'closed'}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ minWidth: '200px' }}
                  >
                    <MenuLink 
                      href="/finanzas/fondos" 
                      className="block py-2 px-4 text-sm whitespace-nowrap"
                      requiresOnline={true}
                    >
                      Fondos
                    </MenuLink>
                    <MenuLink 
                      href="/finanzas/ingresos" 
                      className="block py-2 px-4 text-sm whitespace-nowrap"
                      requiresOnline={true}
                    >
                      Historial de Ingresos
                    </MenuLink>
                    <MenuLink 
                      href="/finanzas/egresos" 
                      className="block py-2 px-4 text-sm whitespace-nowrap border-b border-gray-200"
                      requiresOnline={true}
                    >
                      Historial de Egresos
                    </MenuLink>
                    <MenuLink 
                      href="/finanzas/reportes" 
                      className="block py-2 px-4 text-sm whitespace-nowrap"
                      requiresOnline={true}
                    >
                      Reportes Financieros
                    </MenuLink>
                    <MenuLink 
                      href="/finanzas/Listados" 
                      className="block py-2 px-4 text-sm whitespace-nowrap"
                      requiresOnline={true}
                    >
                      Listados
                    </MenuLink>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* EDICION - Requiere online */}
            <motion.div className="relative" variants={menuItemVariants} whileHover="hover" whileTap="tap">
              <button 
                onClick={() => isPWA && !isOnlineLocal ? null : toggleSubMenu('edicion')} 
                className={getMenuItemStyle(true)}
                disabled={isPWA && !isOnlineLocal}
                title={isPWA && !isOnlineLocal ? "Requiere conexión a internet" : ""}
              >
                EDICION
                {isPWA && !isOnlineLocal && <span className="ml-1 text-xs">🔒</span>}
              </button>
              {(isOnlineLocal || !isPWA) && (
                <motion.div
                  className="absolute top-full left-0 bg-white text-black shadow-md rounded-md p-2 mt-1 origin-top transition duration-200 ease-in-out"
                  variants={subMenuVariants}
                  initial="closed"
                  animate={openSubMenu === 'edicion' ? 'open' : 'closed'}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ minWidth: '200px' }}
                >
                  <MenuLink 
                    href="/edicion/Clientes" 
                    className="block py-2 px-4 text-sm whitespace-nowrap"
                    requiresOnline={true}
                  >
                    Clientes
                  </MenuLink>
                  
                  {role === 'GERENTE' && (
                    <>
                      <MenuLink 
                        href="/edicion/Proveedores" 
                        className="block py-2 px-4 text-sm whitespace-nowrap"
                        requiresOnline={true}
                      >
                        Proveedores
                      </MenuLink>
                      <MenuLink 
                        href="/edicion/Empleados" 
                        className="block py-2 px-4 text-sm whitespace-nowrap"
                        requiresOnline={true}
                      >
                        Empleados
                      </MenuLink>
                      <MenuLink 
                        href="/auditoria/Auditoria" 
                        className="block py-2 px-4 text-sm whitespace-nowrap border-t border-gray-200 mt-1 pt-3"
                        requiresOnline={true}
                      >
                        📋 Auditoría del Sistema
                      </MenuLink>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ✅ INFORMACIÓN DEL USUARIO */}
          <div className="hidden sm:flex items-center space-x-2">
            {/* Información del usuario */}
            <div className="text-right text-sm">
              <p className="font-medium">{getUserName()}</p>
              <p className={`text-xs ${isOnlineLocal ? 'text-blue-200' : 'text-orange-200'}`}>{role}</p>
              
            </div>
            
            {/* Cerrar sesión */}
            <motion.button
              onClick={handleLogout}
              className="text-white focus:outline-none bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold"
              variants={logoutVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Cerrar Sesión
            </motion.button>
          </div>
        </div>

        {/* ✅ MENU MÓVIL CON NAVEGACIÓN OFFLINE */}
        {showMenu && (
          <div className="sm:hidden bg-blue-500 py-2 px-4 flex flex-col items-center">
            {/* Información del usuario en móvil */}
            <div className={`w-full text-center mb-4 rounded p-3 ${
              isOnlineLocal ? 'bg-blue-600' : 'bg-orange-600'
            }`}>
              <p className="font-medium text-white">{getUserName()}</p>
              <p className="text-blue-200 text-sm">{role}</p>
              {isPWA && (
                <div className="flex items-center justify-center gap-2 mt-1">
                  {isOnlineLocal ? (
                    <FiWifi className="text-green-300" size={14} />
                  ) : (
                    <FiWifiOff className="text-orange-300" size={14} />
                  )}
                  
                </div>
              )}
            </div>

            {/* VENTAS MÓVIL - SIEMPRE DISPONIBLE */}
            {(role === 'GERENTE' || role === 'VENDEDOR') && (
              <div className="w-full mb-2">
                <motion.button
                  onClick={() => toggleSubMenu('ventas-mobile')}
                  className="w-full text-white py-2 focus:outline-none text-left font-bold"
                >
                  VENTAS
                </motion.button>
                <motion.div
                  variants={subMenuVariants}
                  initial="closed"
                  animate={openSubMenu === 'ventas-mobile' ? 'open' : 'closed'}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <MenuLink 
                    href="/ventas/RegistrarPedido" 
                    className="block py-2 px-4 hover:bg-blue-600 text-white"
                    requiresOnline={false}
                  >
                    Registrar Pedido
                  </MenuLink>
                  {(isOnlineLocal || !isPWA) && (
                    <>
                      <MenuLink 
                        href="/ventas/HistorialPedidos" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Modificar Nota de Pedido
                      </MenuLink>
                      
                      {(role === 'GERENTE') && (
                        <>
                        <MenuLink 
                            href="/ventas/VentaDirecta" 
                            className="block py-2 px-4 hover:bg-blue-600 text-white"
                            requiresOnline={true}
                          >
                             Venta Directa
                          </MenuLink>
                          <MenuLink 
                            href="/ventas/Facturacion" 
                            className="block py-2 px-4 hover:bg-blue-600 text-white"
                            requiresOnline={true}
                          >
                            Facturación
                          </MenuLink>
                          <MenuLink 
                            href="/ventas/ListaPrecios" 
                            className="block py-2 px-4 hover:bg-blue-600 text-white"
                            requiresOnline={true}
                          >
                            Generar Lista de Precios
                          </MenuLink>
                          
                        </>
                      )}
                      <MenuLink 
                        href="/ventas/comprobantes" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Gestión de Comprobantes
                      </MenuLink>
                    </>
                  )}
                </motion.div>
              </div>
            )}

            {/* RESTO DE MENÚS MÓVILES - Solo cuando online */}
            {(isOnlineLocal || !isPWA) && (
              <>
                {/* INVENTARIO MÓVIL */}
                {(role === 'GERENTE' || role === 'VENDEDOR') && (
                  <div className="w-full mb-2">
                    <motion.button
                      onClick={() => toggleSubMenu('inventario-mobile')}
                      className="w-full text-white py-2 focus:outline-none text-left font-bold"
                    >
                      INVENTARIO
                    </motion.button>
                    <motion.div
                      variants={subMenuVariants}
                      initial="closed"
                      animate={openSubMenu === 'inventario-mobile' ? 'open' : 'closed'}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {role === 'GERENTE' && (
                        <MenuLink 
                          href="/inventario/Productos" 
                          className="block py-2 px-4 hover:bg-blue-600 text-white"
                          requiresOnline={true}
                        >
                          Productos
                        </MenuLink>
                      )}
                      <MenuLink 
                        href="/inventario/consultaStock" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Consulta de STOCK
                      </MenuLink>
                      <MenuLink 
                        href="/inventario/Remitos" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Remitos
                      </MenuLink>
                    </motion.div>
                  </div>
                )}

                {/* COMPRAS MÓVIL */}
                <div className="w-full mb-2">
                  <motion.button
                    onClick={() => toggleSubMenu('compras-mobile')}
                    className="w-full text-white py-2 focus:outline-none text-left font-bold"
                  >
                    COMPRAS
                  </motion.button>
                  <motion.div
                    variants={subMenuVariants}
                    initial="closed"
                    animate={openSubMenu === 'compras-mobile' ? 'open' : 'closed'}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {role === 'GERENTE' && (
                      <MenuLink 
                        href="/compras/RegistrarCompra" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Registrar Compra
                      </MenuLink>
                    )}
                    
                    <MenuLink 
                      href="/compras/RegistrarGasto" 
                      className="block py-2 px-4 hover:bg-blue-600 text-white"
                      requiresOnline={true}
                    >
                      Registrar Gasto
                    </MenuLink>
                    
                    {role === 'GERENTE' && (
                      <MenuLink 
                        href="/compras/HistorialCompras" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Historial de Compras
                      </MenuLink>
                    )}
                  </motion.div>
                </div>

                {/* FINANZAS MÓVIL */}
                {role === 'GERENTE' && (
                  <div className="w-full mb-2">
                    <motion.button
                      onClick={() => toggleSubMenu('finanzas-mobile')}
                      className="w-full text-white py-2 focus:outline-none text-left font-bold"
                    >
                      FINANZAS
                    </motion.button>
                    <motion.div
                      variants={subMenuVariants}
                      initial="closed"
                      animate={openSubMenu === 'finanzas-mobile' ? 'open' : 'closed'}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <MenuLink 
                        href="/finanzas/fondos" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Fondos
                      </MenuLink>
                      <MenuLink 
                        href="/finanzas/ingresos" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Historial de Ingresos
                      </MenuLink>
                      <MenuLink 
                        href="/finanzas/egresos" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Historial de Egresos
                      </MenuLink>
                      <MenuLink 
                        href="/finanzas/reportes" 
                        className="block py-2 px-4 hover:bg-blue-600 text-white"
                        requiresOnline={true}
                      >
                        Reportes Financieros
                      </MenuLink>
                    </motion.div>
                  </div>
                )}

                {/* EDICION MÓVIL */}
                <div className="w-full mb-2">
                  <motion.button
                    onClick={() => toggleSubMenu('edicion-mobile')}
                    className="w-full text-white py-2 focus:outline-none text-left font-bold"
                  >
                    EDICION
                  </motion.button>
                  <motion.div
                    variants={subMenuVariants}
                    initial="closed"
                    animate={openSubMenu === 'edicion-mobile' ? 'open' : 'closed'}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <MenuLink 
                      href="/edicion/Clientes" 
                      className="block py-2 px-4 hover:bg-blue-600 text-white"
                      requiresOnline={true}
                    >
                      Clientes
                    </MenuLink>
                    
                    {role === 'GERENTE' && (
                      <>
                        <MenuLink 
                          href="/edicion/Proveedores" 
                          className="block py-2 px-4 hover:bg-blue-600 text-white"
                          requiresOnline={true}
                        >
                          Proveedores
                        </MenuLink>
                        <MenuLink 
                          href="/edicion/Empleados" 
                          className="block py-2 px-4 hover:bg-blue-600 text-white"
                          requiresOnline={true}
                        >
                          Empleados
                        </MenuLink>
                        <MenuLink 
                          href="/auditoria/Auditoria" 
                          className="block py-2 px-4 hover:bg-blue-600 text-white border-t border-blue-400 mt-2 pt-3"
                          requiresOnline={true}
                        >
                          Auditoría del Sistema
                        </MenuLink>
                      </>
                    )}
                  </motion.div>
                </div>
              </>
            )}

            {/* ⚠️ MENSAJE INFORMATIVO OFFLINE EN MÓVIL - Usar estado local */}
            {isPWA && !isOnlineLocal && (
              <div className="w-full mb-4 p-3 bg-orange-600 bg-opacity-50 rounded text-center">
                <p className="text-xs text-orange-100">
                  🔒 Algunas secciones requieren conexión a internet
                </p>
              </div>
            )}

            <motion.button
              onClick={handleLogout}
              className="w-full text-white py-2 focus:outline-none bg-red-500 hover:bg-red-600 rounded font-bold mt-4"
              variants={logoutVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Cerrar Sesión
            </motion.button>
          </div>
        )}
      </nav>
    </>
  );
}

export default AppHeader;