// hooks/useProductosQuery.js - Hook con React Query para productos (PWA-safe)
// ✅ FASE 2: React Query solo en memoria, NO interfiere con Service Worker offline

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosAuth } from '../utils/apiClient';
import { queryOptionsWithOfflineSupport } from '../utils/queryClient';
import { toast } from 'react-hot-toast';

// ✅ Query keys para React Query
export const productoKeys = {
  all: ['productos'] as const,
  lists: () => [...productoKeys.all, 'list'] as const,
  list: (filters: string) => [...productoKeys.lists(), { filters }] as const,
  details: () => [...productoKeys.all, 'detail'] as const,
  detail: (id: number) => [...productoKeys.details(), id] as const,
  search: (searchTerm: string, limit?: number, offset?: number) => 
    [...productoKeys.all, 'search', searchTerm, limit, offset] as const,
  categorias: () => [...productoKeys.all, 'categorias'] as const,
};

/**
 * Hook para buscar productos con React Query
 * ✅ Compatible con offline: Si está offline, falla silenciosamente
 * El Service Worker entregará datos desde su caché
 */
export const useProductosSearch = (searchTerm = '', limit = 100, offset = 0) => {
  return useQuery(
    queryOptionsWithOfflineSupport(
      productoKeys.search(searchTerm, limit, offset),
      async () => {
        const response = await axiosAuth.get(
          `/productos/buscar-producto?search=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`
        );
        if (response.data.success) {
          return response.data.data;
        }
        throw new Error('Error al buscar productos');
      },
      {
        staleTime: 60 * 1000, // 60 segundos
        enabled: true, // Siempre habilitado, pero falla silenciosamente si está offline
      }
    )
  );
};

/**
 * Hook para obtener todas las categorías
 * ✅ Compatible con offline
 */
export const useCategorias = () => {
  return useQuery(
    queryOptionsWithOfflineSupport(
      productoKeys.categorias(),
      async () => {
        const response = await axiosAuth.get('/productos/categorias');
        if (response.data.success) {
          return response.data.data;
        }
        throw new Error('Error al obtener categorías');
      },
      {
        staleTime: 5 * 60 * 1000, // 5 minutos (categorías cambian poco)
      }
    )
  );
};

/**
 * Hook para crear producto (mutation)
 * ✅ Invalida caché después de crear
 */
export const useCrearProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productoData) => {
      const response = await axiosAuth.post('/productos/crear-producto', productoData);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al crear producto');
    },
    onSuccess: () => {
      // ✅ Invalidar caché de productos después de crear
      queryClient.invalidateQueries({ queryKey: productoKeys.all });
      toast.success('Producto creado correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear producto');
    },
  });
};

/**
 * Hook para actualizar producto (mutation)
 * ✅ Invalida caché después de actualizar
 */
export const useActualizarProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productoData }) => {
      const response = await axiosAuth.put(`/productos/actualizar-producto/${id}`, productoData);
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Error al actualizar producto');
    },
    onSuccess: () => {
      // ✅ Invalidar caché de productos después de actualizar
      queryClient.invalidateQueries({ queryKey: productoKeys.all });
      toast.success('Producto actualizado correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar producto');
    },
  });
};

