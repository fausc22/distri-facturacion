// utils/queryClient.js - Configuración de React Query (solo memoria, PWA-safe)
// ✅ FASE 2: React Query solo como caché en memoria, NO persiste offline
// El Service Worker sigue siendo responsable del offline

import { QueryClient } from '@tanstack/react-query';

// ✅ Configuración conservadora para PWA
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ staleTime: 60s - Los datos se consideran frescos por 60 segundos
      staleTime: 60 * 1000,
      
      // ✅ cacheTime: 5 minutos - Los datos se mantienen en caché 5 minutos
      cacheTime: 5 * 60 * 1000,
      
      // ✅ refetchOnWindowFocus: false - No refetch automático al enfocar ventana
      // Esto evita interrupciones en PWA
      refetchOnWindowFocus: false,
      
      // ✅ refetchOnMount: true - Refetch al montar componente (datos pueden estar stale)
      refetchOnMount: true,
      
      // ✅ refetchOnReconnect: true - Refetch cuando se recupera conexión
      refetchOnReconnect: true,
      
      // ✅ retry: 1 - Solo 1 reintento en caso de error
      retry: 1,
      
      // ✅ retryDelay: 1000ms - Esperar 1 segundo antes de reintentar
      retryDelay: 1000,
      
      // ✅ IMPORTANTE: No usar persistencia offline
      // El Service Worker maneja el offline, React Query solo cachea en memoria
      // Si está offline, el fetch fallará y el SW entregará datos cacheados
    },
    mutations: {
      // ✅ retry: false - No reintentar mutaciones
      retry: false,
    },
  },
});

// ✅ Helper para verificar si está online antes de hacer query
export const isOnline = () => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// ✅ Helper para queries que deben fallar silenciosamente si está offline
export const queryOptionsWithOfflineSupport = (queryKey, queryFn, options = {}) => {
  return {
    queryKey,
    queryFn: async () => {
      // Si está offline, lanzar error silencioso
      // El Service Worker manejará la respuesta desde caché
      if (!isOnline()) {
        throw new Error('Offline - Service Worker will handle this');
      }
      return queryFn();
    },
    // ✅ No retry si está offline
    retry: (failureCount, error) => {
      if (!isOnline() || error?.message?.includes('Offline')) {
        return false;
      }
      return failureCount < 1;
    },
    ...options,
  };
};

