import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { apiClient, axiosAuth } from '../utils/apiClient';
import { toast } from 'react-hot-toast';

// ✅ HELPER PARA SSR
const isClient = () => typeof window !== 'undefined';

export default function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenCheckInterval, setTokenCheckInterval] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isClient()) {
      setLoading(false);
      return;
    }

    // Evitar doble inicialización
    if (initialized.current) return;
    initialized.current = true;

    const initializeAuth = async () => {
      try {
        const publicRoutes = ['/login', '/comprobante-publico'];
      const isPublicRoute = publicRoutes.some(route => 
        router.pathname.startsWith(route)
      );
      
      // ✅ Si es ruta pública, no verificar auth
      if (isPublicRoute) {
        console.log('🌍 Ruta pública detectada:', router.pathname);
        setLoading(false);
        return;
      }

      // Si estamos en login, no verificar auth
      if (router.pathname === '/login') {
        setLoading(false);
        return;
      }


        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('🔒 PWA: No hay token, redirigiendo al login');
          router.push('/login');
          return;
        }

        // ✅ PWA: Verificar si tenemos refresh token en localStorage
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('🔑 PWA: Refresh token disponible:', !!refreshToken);

        // ✅ Cargar datos del usuario
        await loadUserData();
        
        // ✅ Iniciar verificación periódica optimizada para PWA
        startTokenVerification();

      } catch (error) {
        console.error('❌ PWA: Error inicializando autenticación:', error);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, [router.pathname]);

  // ✅ CARGAR DATOS DEL USUARIO - PWA Compatible
  const loadUserData = async () => {
    if (!isClient()) return;

    try {
      // Primero intentar obtener del localStorage
      const user = apiClient.getUserFromStorage();
      
      if (user) {
        setUser(user);
        return;
      }

      // Si no hay datos locales, obtener del backend
      const profileResponse = await axiosAuth.get('/auth/profile');
      const empleado = profileResponse.data.empleado;
      
      // Actualizar localStorage
      localStorage.setItem('empleado', JSON.stringify(empleado));
      localStorage.setItem('role', empleado.rol);
      
      setUser(empleado);

    } catch (error) {
      console.error('❌ PWA: Error cargando datos del usuario:', error);
      throw error;
    }
  };

  // ✅ VERIFICACIÓN PERIÓDICA OPTIMIZADA PARA PWA
  const startTokenVerification = () => {
    if (!isClient()) return;

    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
    }

    const interval = apiClient.startTokenCheck();
    setTokenCheckInterval(interval);
  };

  // ✅ FUNCIÓN DE LOGOUT PARA PWA
  const logout = async () => {
    try {
      console.log('👋 PWA: Cerrando sesión...');
      
      // Limpiar intervalo
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
        setTokenCheckInterval(null);
      }
      
      // Logout en el backend
      await apiClient.logout();
      
      // Limpiar estado local
      setUser(null);
      
      // Redirigir al login
      if (isClient()) {
        router.push('/login');
        toast.success('Sesión cerrada correctamente');
      }
      
    } catch (error) {
      console.error('❌ PWA: Error en logout:', error);
      
      // Forzar limpieza local
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
        setTokenCheckInterval(null);
      }
      
      apiClient.clearLocalStorage();
      setUser(null);
      
      if (isClient()) {
        router.push('/login');
      }
    }
  };

  // ✅ FUNCIÓN DE LOGIN MEJORADA PARA PWA
  const login = async (credentials) => {
    try {
      setLoading(true);
      
      const result = await apiClient.login(credentials);
      
      if (result.success) {
        const { empleado } = result.data;
        
        setUser(empleado);
        
        // Iniciar verificación de tokens
        startTokenVerification();
        
        // ✅ Toast informativo específico para PWA
        if (result.data.hasRefreshToken) {
          const isPWA = window.matchMedia('(display-mode: standalone)').matches;
          if (isPWA) {
            toast.success(`¡Bienvenido ${empleado.nombre}! Tu sesión se mantendrá activa en la PWA por 7 días.`);
          } else {
            toast.success(`¡Bienvenido ${empleado.nombre}! Tu sesión se mantendrá activa por 7 días.`);
          }
        } else {
          toast.success(`¡Bienvenido ${empleado.nombre}!`);
        }
        
        return { success: true, empleado };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ PWA: Error en login:', error);
      return { success: false, error: 'Error inesperado durante el login' };
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIONES DE AUTORIZACIÓN - Sin cambios
  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.rol === roles;
    }
    if (Array.isArray(roles)) {
      return roles.includes(user.rol);
    }
    return false;
  };

  const isManager = () => hasRole('GERENTE');
  const canSell = () => hasRole(['GERENTE', 'VENDEDOR']);
  
  const isAuthenticated = () => {
    if (!isClient()) return false;
    const token = localStorage.getItem('token');
    return !!token && !!user;
  };

  // ✅ VERIFICAR CONECTIVIDAD
  const checkConnection = async () => {
    try {
      await apiClient.axiosAuth.get('/health');
      return { success: true, message: 'Conexión exitosa' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión' 
      };
    }
  };

  // ✅ FORZAR RENOVACIÓN DE TOKEN PARA PWA
  const forceTokenRefresh = async () => {
    try {
      await apiClient.refreshToken();
      await loadUserData();
      
      if (isClient()) {
        toast.success('Token renovado exitosamente');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ PWA: Error forzando renovación:', error);
      
      if (isClient()) {
        toast.error('Error renovando token');
      }
      
      await logout();
      return { success: false, error: error.message };
    }
  };

  // ✅ NUEVA FUNCIÓN: Obtener información de debug PWA
  const getAuthDebugInfo = () => {
    if (!isClient()) return { error: 'No disponible en SSR' };
    
    return {
      ...apiClient.getAuthDebugInfo(),
      hook: {
        userLoaded: !!user,
        loading,
        intervalActive: !!tokenCheckInterval,
        initialized: initialized.current
      }
    };
  };

  // ✅ NUEVA FUNCIÓN: Obtener estado de PWA
  const getPWAStatus = () => {
    if (!isClient()) return { error: 'No disponible en SSR' };
    
    return apiClient.getPWAStatus();
  };

  // ✅ NUEVA FUNCIÓN: Manejar reactivación de PWA
  const handlePWAResume = async () => {
    console.log('🔄 PWA: Handling resume...');
    
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token && refreshToken) {
        console.log('🔄 PWA: No access token pero sí refresh token, renovando...');
        await forceTokenRefresh();
      } else if (apiClient.isTokenExpired() && refreshToken && !apiClient.isRefreshTokenExpired()) {
        console.log('🔄 PWA: Token expirado, renovando...');
        await forceTokenRefresh();
      } else if (!token && !refreshToken) {
        console.log('❌ PWA: No hay tokens, redirigiendo a login...');
        await logout();
      }
    } catch (error) {
      console.error('❌ PWA: Error en resume:', error);
      await logout();
    }
  };

  // ✅ NUEVA FUNCIÓN: Verificar salud de autenticación
  const checkAuthHealth = () => {
    if (!isClient()) return { healthy: false, reason: 'SSR' };

    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const empleado = localStorage.getItem('empleado');

    if (!token) {
      return { healthy: false, reason: 'No access token' };
    }

    if (apiClient.isTokenExpired()) {
      if (refreshToken && !apiClient.isRefreshTokenExpired()) {
        return { healthy: true, reason: 'Token expired but refresh available', action: 'refresh' };
      } else {
        return { healthy: false, reason: 'Both tokens expired', action: 'login' };
      }
    }

    if (!empleado) {
      return { healthy: false, reason: 'No user data' };
    }

    return { healthy: true, reason: 'All good' };
  };

  return { 
    user, 
    loading, 
    login,
    logout, 
    hasRole, 
    isManager, 
    canSell,
    isAuthenticated,
    checkConnection,
    forceTokenRefresh,
    
    // ✅ NUEVAS FUNCIONES ESPECÍFICAS PARA PWA
    getAuthDebugInfo,
    getPWAStatus,
    handlePWAResume,
    checkAuthHealth,
    
    // ✅ Debug info mejorada para PWA
    debug: {
      hasToken: isClient() ? !!localStorage.getItem('token') : false,
      hasRefreshToken: isClient() ? !!localStorage.getItem('refreshToken') : false,
      intervalActive: !!tokenCheckInterval,
      isClient: isClient(),
      isPWA: isClient() ? window.matchMedia('(display-mode: standalone)').matches : false
    }
  };
}

// ✅ HOOK SIMPLE PARA VERIFICAR AUTH SIN LÓGICA COMPLETA
export function useAuthSimple() {
  const router = useRouter();

  useEffect(() => {
    if (!isClient()) return;
    
    if (router.pathname === '/login') return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router.pathname]);
}

// ✅ HOOK PARA OBTENER USUARIO ACTUAL
export function useCurrentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isClient()) return;

    const loadUser = () => {
      const user = apiClient.getUserFromStorage();
      setUser(user);
    };

    loadUser();
  }, []);

  return user;
}

// ✅ NUEVO HOOK: Monitor de PWA
export function usePWAMonitor() {
  const [isOnline, setIsOnline] = useState(true);
  const [pwaStatus, setPwaStatus] = useState(null);

  useEffect(() => {
    if (!isClient()) return;

    // Monitorear estado online/offline
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 PWA: Conexión restaurada');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 PWA: Conexión perdida');
    };

    // Monitorear cambios de visibilidad (PWA suspend/resume)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ PWA: Visible');
        setPwaStatus('active');
      } else {
        console.log('🙈 PWA: Hidden');
        setPwaStatus('background');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Estado inicial
    setIsOnline(navigator.onLine);
    setPwaStatus(document.visibilityState === 'visible' ? 'active' : 'background');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    isOnline,
    pwaStatus,
    isPWA: isClient() ? window.matchMedia('(display-mode: standalone)').matches : false
  };
}