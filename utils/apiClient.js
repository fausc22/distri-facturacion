import axios from 'axios';
import { toast } from '@/components/shared/toast';

// ✅ CONFIGURACIÓN DE API URL CON VALIDACIÓN
const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // ✅ Validar que la URL esté definida
  if (!envUrl) {
    console.error('❌ NEXT_PUBLIC_API_URL no está definida en las variables de entorno');
    // En desarrollo, usar localhost como fallback
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3001';
    }
    // En producción, lanzar error visible
    throw new Error('NEXT_PUBLIC_API_URL no está configurada. Por favor, configura la variable de entorno en Vercel.');
  }
  
  // ✅ Validar formato de URL
  try {
    new URL(envUrl);
    return envUrl;
  } catch (error) {
    console.error('❌ NEXT_PUBLIC_API_URL tiene un formato inválido:', envUrl);
    throw new Error(`NEXT_PUBLIC_API_URL tiene un formato inválido: ${envUrl}`);
  }
};

const apiUrl = getApiUrl();

// ✅ HELPER FUNCTIONS PARA SSR
const isClient = () => typeof window !== 'undefined';

const getFromStorage = (key) => {
  if (!isClient()) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error);
    return null;
  }
};

const setToStorage = (key, value) => {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting localStorage for key ${key}:`, error);
  }
};

const removeFromStorage = (key) => {
  if (!isClient()) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage for key ${key}:`, error);
  }
};

// ✅ Instancia de axios para login SIN interceptores
export const axiosLogin = axios.create({
  baseURL: apiUrl,
  withCredentials: false, // ✅ PWA: Sin cookies, solo localStorage
});

// ✅ Instancia de axios autenticado CON interceptores  
export const axiosAuth = axios.create({
  baseURL: apiUrl,
  withCredentials: false, // ✅ PWA: Sin cookies, solo localStorage
});



class ApiClient {
  constructor() {
    this.baseURL = apiUrl;
    this.isRefreshing = false;
    this.failedQueue = [];
    
    // Solo configurar interceptors en el cliente
    if (isClient()) {
      this.setupInterceptors();
      this.setupPWAListeners(); // ✅ NUEVO: Listeners específicos para PWA
    }
  }

  // ✅ NUEVO: Configurar listeners específicos para PWA
  setupPWAListeners() {
    // Detectar cuando la PWA se reactiva
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 PWA reactivada, verificando autenticación...');
        this.checkAuthOnPWAResume();
      }
    });

    // Detectar focus de la ventana
    window.addEventListener('focus', () => {
      console.log('🔍 PWA obtuvo focus, verificando tokens...');
      this.checkAuthOnPWAResume();
    });

    // Listener para cuando la PWA se instala
    window.addEventListener('appinstalled', () => {
      console.log('📱 PWA instalada, configurando persistencia mejorada...');
    });
  }

  // ✅ NUEVO: Verificar autenticación al reactivar PWA
  async checkAuthOnPWAResume() {
    const token = getFromStorage('token');
    const refreshToken = getFromStorage('refreshToken');
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (!token && refreshToken) {
      if (!isOnline) {
        console.log('📴 PWA: Reanudada sin conexión. Se conserva sesión local hasta recuperar red.');
        return;
      }

      console.log('🔄 PWA: No hay access token pero sí refresh token, renovando...');
      try {
        await this.refreshToken();
      } catch (error) {
        console.log('❌ PWA: Error renovando al reactivar');
      }
    } else if (this.isTokenExpired() && refreshToken && !this.isRefreshTokenExpired()) {
      if (!isOnline) {
        console.log('📴 PWA: Token próximo a expirar pero sin conexión. Se reintentará al volver online.');
        return;
      }

      console.log('🔄 PWA: Access token expirado, renovando automáticamente...');
      try {
        await this.refreshToken();
      } catch (error) {
        console.log('❌ PWA: Error renovando automáticamente');
      }
    }
  }

  setupInterceptors() {
    // ✅ REQUEST INTERCEPTOR
    axiosAuth.interceptors.request.use(
      (config) => {
        const token = getFromStorage('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ✅ RESPONSE INTERCEPTOR MEJORADO PARA PWA
    axiosAuth.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Solo manejar errores 401 que no sean del refresh endpoint
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/refresh-token')) {
          
          originalRequest._retry = true;

          // Si ya estamos renovando, añadir a la cola
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, originalRequest });
            });
          }

          return this.handleTokenRefresh(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  // ✅ MANEJO DE REFRESH TOKEN MODIFICADO PARA PWA (localStorage)
  async handleTokenRefresh(originalRequest) {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, originalRequest });
      });
    }

    this.isRefreshing = true;

    try {
      console.log('🔄 PWA: Token expirado, intentando renovar con localStorage...');
      
      const refreshToken = getFromStorage('refreshToken');
      
      if (!refreshToken) {
        console.log('🔒 PWA: No hay refresh token. Cerrando sesión.');
        this.processQueue(new Error('Sesión expirada'), null);
        this.clearSessionAndRedirect();
        return Promise.reject(new Error('Sesión expirada'));
      }

      // ✅ PWA: Enviar refresh token en el body
      const response = await axiosLogin.post('/auth/refresh-token', {
        refreshToken: refreshToken
      });
      
      const {
        accessToken,
        refreshToken: rotatedRefreshToken,
        empleado,
        expiresIn,
        refreshTokenExpiresIn,
        refreshExpiresIn
      } = response.data;
      
      // ✅ ACTUALIZAR localStorage
      setToStorage('token', accessToken);
      setToStorage('empleado', JSON.stringify(empleado));
      setToStorage('tokenExpiry', (Date.now() + this.parseExpiration(expiresIn)).toString());

      // ✅ FASE 5: guardar refresh token rotado cuando backend lo devuelve
      if (rotatedRefreshToken) {
        setToStorage('refreshToken', rotatedRefreshToken);
        setToStorage('hasRefreshToken', 'true');
      }
      
      // ✅ Actualizar información del refresh token si está disponible
      if (refreshTokenExpiresIn) {
        setToStorage('refreshTokenExpiry', (Date.now() + (refreshTokenExpiresIn * 1000)).toString());
      } else if (refreshExpiresIn) {
        setToStorage('refreshTokenExpiry', (Date.now() + this.parseExpiration(refreshExpiresIn)).toString());
      }
      
      console.log('✅ PWA: Token renovado exitosamente via localStorage');
      
      // ✅ Procesar cola de requests fallidos
      this.processQueue(null, accessToken);
      
      // ✅ Reintentar request original
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosAuth(originalRequest);
      
    } catch (refreshError) {
      const status = refreshError?.response?.status;
      const errorCode = refreshError?.response?.data?.code;
      const backendMessage = refreshError?.response?.data?.message;
      const isLocalSessionError = !refreshError?.response && (
        refreshError.message?.includes('Sesión expirada') ||
        refreshError.message?.includes('localStorage') ||
        refreshError.message?.includes('No refresh token')
      );
      const isAuthFailure = isLocalSessionError || status === 401 || status === 403 || [
        'NO_REFRESH_TOKEN',
        'REFRESH_TOKEN_EXPIRED',
        'REFRESH_TOKEN_INVALID',
        'INVALID_TOKEN_TYPE'
      ].includes(errorCode);

      console.log('❌ PWA Error renovando token:', backendMessage || refreshError.message);
      
      // ✅ Procesar cola con error
      this.processQueue(refreshError, null);

      if (isAuthFailure) {
        console.log('🔒 PWA: Refresh inválido/expirado. Cerrando sesión por seguridad.');
        this.clearSessionAndRedirect();
      } else {
        // ✅ FASE 2: no expulsar usuarios por errores temporales de red/backend
        console.warn('🌐 PWA: Error temporal de conectividad al renovar token. Se mantiene la sesión local.');
        if (typeof toast !== 'undefined') {
          toast('Conexión inestable. Reintentaremos renovar la sesión cuando vuelva la red.', {
            duration: 3500,
            icon: '🌐'
          });
        }
      }

      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  // ✅ Procesar cola de requests
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject, originalRequest }) => {
      if (error) {
        reject(error);
      } else {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        resolve(axiosAuth(originalRequest));
      }
    });
    
    this.failedQueue = [];
  }

  // ✅ LOGIN MODIFICADO PARA PWA (localStorage)
  async login(credentials) {
    try {
      console.log('🔐 PWA Login con credenciales:', { 
        username: credentials.username, 
        remember: credentials.remember 
      });
      
      const response = await axiosLogin.post('/auth/login', credentials);
      const { token, refreshToken, empleado, expiresIn, refreshExpiresIn, hasRefreshToken } = response.data;
      
      // ✅ GUARDAR TODO EN LOCALSTORAGE (PWA COMPATIBLE)
      setToStorage('token', token);
      setToStorage('role', empleado.rol);
      setToStorage('empleado', JSON.stringify(empleado));
      setToStorage('tokenExpiry', (Date.now() + this.parseExpiration(expiresIn)).toString());
      
      // ✅ PWA: Guardar refresh token en localStorage si está disponible
      if (hasRefreshToken && refreshToken) {
        setToStorage('refreshToken', refreshToken);
        setToStorage('hasRefreshToken', 'true');
        
        if (refreshExpiresIn) {
          const refreshExpiryTime = Date.now() + this.parseExpiration(refreshExpiresIn);
          setToStorage('refreshTokenExpiry', refreshExpiryTime.toString());
          console.log(`🔑 PWA: Refresh token guardado en localStorage, expira en: ${refreshExpiresIn} (${new Date(refreshExpiryTime).toLocaleString()})`);
        }
      } else {
        setToStorage('hasRefreshToken', 'false');
      }
      
      console.log(`✅ PWA Login exitoso - AccessToken: ${expiresIn}, RefreshToken: ${hasRefreshToken ? `${refreshExpiresIn} (localStorage)` : 'NO'}`);
      
      return { success: true, data: { token, empleado, expiresIn, refreshExpiresIn, hasRefreshToken } };
      
    } catch (error) {
      console.error('❌ PWA Error en login:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Error desconocido';

        if (status === 401) {
          return { success: false, error: 'Usuario o contraseña incorrectos' };
        } else {
          return { success: false, error: message };
        }
      } else {
        return { success: false, error: 'No se puede conectar con el servidor. Verifique su conexión.' };
      }
    }
  }

  // ✅ LOGOUT MODIFICADO PARA PWA
  async logout() {
    try {
      console.log('👋 PWA: Cerrando sesión...');
      
      // ✅ Intentar logout en backend (incluye refresh token para revocación servidor)
      const refreshToken = getFromStorage('refreshToken');
      await axiosLogin.post('/auth/logout', { refreshToken });
      console.log('✅ PWA: Logout exitoso en backend');
      
    } catch (error) {
      console.error('⚠️ PWA: Error en logout del backend (continuando con limpieza local):', error.response?.data?.message || error.message);
    } finally {
      // ✅ Siempre limpiar localStorage
      this.clearLocalStorage();
    }
  }

  // ✅ UTILIDADES MEJORADAS PARA PWA
  clearLocalStorage() {
    if (!isClient()) return;
    
    removeFromStorage('token');
    removeFromStorage('refreshToken'); // ✅ PWA: Limpiar refresh token de localStorage
    removeFromStorage('role');
    removeFromStorage('empleado');
    removeFromStorage('tokenExpiry');
    removeFromStorage('hasRefreshToken');
    removeFromStorage('refreshTokenExpiry');
    
    console.log('🧹 PWA: localStorage limpiado completamente');
  }

  clearSessionAndRedirect() {
    this.clearLocalStorage();
    
    if (!isClient()) return;
    
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      if (typeof toast !== 'undefined') {
        toast.authError();
      }
      window.location.href = '/login';
    }
  }

  // ✅ VERIFICACIÓN DE EXPIRACIÓN
  isTokenExpired() {
    if (!isClient()) return false;
    
    const expiry = getFromStorage('tokenExpiry');
    if (!expiry) return true;
    
    const expiryTime = parseInt(expiry);
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000; // FASE 4: buffer más conservador para evitar renovaciones agresivas
    
    return (expiryTime - now) < twoMinutes;
  }

  // ✅ VERIFICAR SI EL REFRESH TOKEN HA EXPIRADO
  isRefreshTokenExpired() {
    if (!isClient()) return true;
    
    const refreshExpiry = getFromStorage('refreshTokenExpiry');
    if (!refreshExpiry) return true;
    
    const expiryTime = parseInt(refreshExpiry);
    const now = Date.now();
    
    return now >= expiryTime;
  }

  hasToken() {
    if (!isClient()) return false;
    return !!getFromStorage('token');
  }

  hasRefreshToken() {
    if (!isClient()) return false;
    const hasRefresh = getFromStorage('hasRefreshToken');
    const refreshToken = getFromStorage('refreshToken');
    return hasRefresh === 'true' && !!refreshToken;
  }

  // ✅ FUNCIÓN DE PARSING MEJORADA para soportar días
  parseExpiration(expiresIn) {
    if (!expiresIn) return 60 * 60 * 1000; // Default 1 hora
    
    // ✅ SOPORTE COMPLETO para horas (h), minutos (m) Y DÍAS (d)
    const match = expiresIn.match(/^(\d+)([hmd])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hora
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;      // horas a milisegundos
      case 'm': return value * 60 * 1000;           // minutos a milisegundos
      case 'd': return value * 24 * 60 * 60 * 1000; // ✅ días a milisegundos
      default: return 60 * 60 * 1000;               // Default 1 hora
    }
  }

  // ✅ VERIFICACIÓN PERIÓDICA OPTIMIZADA PARA PWA
  startTokenCheck() {
    if (!isClient()) return null;
    
    const interval = setInterval(() => {
      const token = getFromStorage('token');
      const hasRefresh = this.hasRefreshToken();
      
      if (!token) {
        clearInterval(interval);
        return;
      }

      // ✅ PWA: Verificar primero si el refresh token ha expirado
      if (hasRefresh && this.isRefreshTokenExpired()) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.log('📴 PWA: Refresh token expirado detectado offline. Se pospone cierre hasta recuperar conexión.');
          return;
        }

        console.log('⏰ PWA: Refresh token expirado, cerrando sesión...');
        this.clearSessionAndRedirect();
        clearInterval(interval);
        return;
      }

      // ✅ Si el access token está próximo a expirar y tenemos refresh token válido
      if (this.isTokenExpired() && hasRefresh && !this.isRefreshTokenExpired() && !this.isRefreshing) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.log('📴 PWA: Token próximo a expirar y sin conexión. Se reintentará al reconectar.');
          return;
        }

        console.log('⏰ PWA: Access token próximo a expirar, renovando...');
        this.handleTokenRefresh({ url: '/health', headers: {} }).catch(() => {
          // FASE 3: no detener chequeo por fallos temporales de red
          if (typeof navigator !== 'undefined' && !navigator.onLine) return;
          clearInterval(interval);
        });
      } else if (this.isTokenExpired() && !hasRefresh) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.log('📴 PWA: Access token expirado sin refresh token, pero offline. Se pospone logout.');
          return;
        }

        console.log('⏰ PWA: Access token expirado sin refresh token, cerrando sesión...');
        this.clearSessionAndRedirect();
        clearInterval(interval);
      }
    }, 30 * 1000); // ✅ Verificar cada 30 segundos (optimizado para PWA)

    return interval;
  }

  // ✅ Función auxiliar para obtener usuario
  getUserFromStorage() {
    if (!isClient()) return null;
    
    const empleadoData = getFromStorage('empleado');
    const role = getFromStorage('role');
    
    if (empleadoData) {
      try {
        const empleado = JSON.parse(empleadoData);
        return {
          ...empleado,
          rol: role || empleado.rol
        };
      } catch (error) {
        console.error('Error parseando datos del empleado:', error);
        return null;
      }
    }
    
    return null;
  }

  // ✅ REFRESH MANUAL MODIFICADO PARA PWA
  async refreshToken() {
    const refreshToken = getFromStorage('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token disponible en localStorage');
    }

    const response = await axiosLogin.post('/auth/refresh-token', {
      refreshToken: refreshToken
    });
    
    const {
      accessToken,
      refreshToken: rotatedRefreshToken,
      empleado,
      expiresIn,
      refreshTokenExpiresIn,
      refreshExpiresIn
    } = response.data;
    
    setToStorage('token', accessToken);
    setToStorage('empleado', JSON.stringify(empleado));
    setToStorage('tokenExpiry', (Date.now() + this.parseExpiration(expiresIn)).toString());

    if (rotatedRefreshToken) {
      setToStorage('refreshToken', rotatedRefreshToken);
      setToStorage('hasRefreshToken', 'true');
    }
    
    // ✅ Actualizar información del refresh token si está disponible
    if (refreshTokenExpiresIn) {
      setToStorage('refreshTokenExpiry', (Date.now() + (refreshTokenExpiresIn * 1000)).toString());
    } else if (refreshExpiresIn) {
      setToStorage('refreshTokenExpiry', (Date.now() + this.parseExpiration(refreshExpiresIn)).toString());
    }
    
    return accessToken;
  }

  // ✅ WRAPPER PARA FETCH CON AUTH (para compatibilidad)
  async fetchWithAuth(endpoint, options = {}) {
    if (!isClient()) {
      throw new Error('fetchWithAuth solo puede usarse en el cliente');
    }
    
    const token = getFromStorage('token');
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      credentials: 'include',
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // Para errores 401, usar axios que tiene el interceptor configurado
      if (error.message.includes('401')) {
        const axiosResponse = await axiosAuth.get(endpoint);
        return axiosResponse.data;
      }
      throw error;
    }
  }

  // ✅ FUNCIÓN DE DEBUG MEJORADA PARA PWA
  getAuthDebugInfo() {
    if (!isClient()) return { error: 'No disponible en SSR' };

    const token = getFromStorage('token');
    const refreshToken = getFromStorage('refreshToken');
    const tokenExpiry = getFromStorage('tokenExpiry');
    const hasRefreshToken = getFromStorage('hasRefreshToken') === 'true';
    const refreshTokenExpiry = getFromStorage('refreshTokenExpiry');
    const empleado = this.getUserFromStorage();

    const now = Date.now();
    const tokenExpiryTime = tokenExpiry ? parseInt(tokenExpiry) : null;
    const refreshExpiryTime = refreshTokenExpiry ? parseInt(refreshTokenExpiry) : null;

    // ✅ Detectar si es PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone || 
                  document.referrer.includes('android-app://');

    return {
      // Información de tokens
      hasToken: !!token,
      tokenExpiry: tokenExpiryTime ? new Date(tokenExpiryTime).toLocaleString() : 'N/A',
      tokenExpiresIn: tokenExpiryTime ? Math.max(0, Math.round((tokenExpiryTime - now) / 1000)) : 0,
      isTokenExpired: this.isTokenExpired(),
      
      // Información de refresh token
      hasRefreshToken: hasRefreshToken && !!refreshToken,
      refreshTokenExpiry: refreshExpiryTime ? new Date(refreshExpiryTime).toLocaleString() : 'N/A',
      refreshExpiresIn: refreshExpiryTime ? Math.max(0, Math.round((refreshExpiryTime - now) / 1000)) : 0,
      isRefreshTokenExpired: this.isRefreshTokenExpired(),
      
      // Información del usuario
      user: empleado ? `${empleado.nombre} ${empleado.apellido} (${empleado.rol})` : 'N/A',
      isRefreshing: this.isRefreshing,
      
      // ✅ Información específica de PWA
      isPWA,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
      storageMethod: 'localStorage',
      
      recommendations: this.getAuthRecommendations()
    };
  }

  // ✅ RECOMENDACIONES MEJORADAS PARA PWA
  getAuthRecommendations() {
    const recommendations = [];

    if (!this.hasToken()) {
      recommendations.push('❌ No hay token de acceso - Usuario debe hacer login');
    } else if (this.isTokenExpired()) {
      if (this.hasRefreshToken() && !this.isRefreshTokenExpired()) {
        recommendations.push('🔄 Token expirado pero refresh token válido - Se renovará automáticamente');
      } else if (this.isRefreshTokenExpired()) {
        recommendations.push('⏰ Ambos tokens expirados - Usuario debe hacer login nuevamente');
      } else {
        recommendations.push('❌ Token expirado sin refresh token - Usuario debe hacer login');
      }
    } else {
      const tokenExpiry = getFromStorage('tokenExpiry');
      if (tokenExpiry) {
        const timeLeft = parseInt(tokenExpiry) - Date.now();
        if (timeLeft < 10 * 60 * 1000) { // Menos de 10 minutos
          recommendations.push('⚠️ Token expira pronto - Se renovará automáticamente si hay refresh token');
        } else {
          recommendations.push('✅ Autenticación válida y estable');
        }
      }
    }

    // ✅ Recomendaciones específicas para PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    if (isPWA) {
      recommendations.push('📱 Ejecutándose como PWA - Usando localStorage para persistencia');
      if (this.hasRefreshToken()) {
        recommendations.push('🔑 Refresh token configurado - Sesión persistirá entre suspensiones de PWA');
      }
    }

    return recommendations;
  }

  // ✅ NUEVA FUNCIÓN: Verificar estado de PWA
  getPWAStatus() {
    if (!isClient()) return { error: 'No disponible en SSR' };

    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const isStandalone = window.navigator.standalone;
    const isAndroidPWA = document.referrer.includes('android-app://');

    return {
      isPWA: isPWA || isStandalone || isAndroidPWA,
      displayMode: isPWA ? 'standalone' : 'browser',
      platform: navigator.userAgent.includes('iPhone') ? 'iOS' : 
                navigator.userAgent.includes('Android') ? 'Android' : 'Desktop',
      standalone: isStandalone,
      androidPWA: isAndroidPWA,
      serviceWorkerReady: 'serviceWorker' in navigator && navigator.serviceWorker.ready,
      storageMethod: 'localStorage',
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    };
  }
}

// ✅ Exportar instancia única
export const apiClient = new ApiClient();

// ✅ Funciones helper para compatibilidad con código existente
export const fetchAuth = (endpoint, options) => apiClient.fetchWithAuth(endpoint, options);