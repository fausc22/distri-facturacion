// hooks/useClientesQuery.js - Hook con React Query para clientes (PWA-safe)
// ✅ FASE 2: React Query solo en memoria, NO interfiere con Service Worker offline

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosAuth } from '../utils/apiClient';
import { queryOptionsWithOfflineSupport } from '../utils/queryClient';
import { toast } from 'react-hot-toast';

// ✅ Query keys para React Query
export const clienteKeys = {
  all: ['clientes'] as const,
  lists: () => [...clienteKeys.all, 'list'] as const,
  list: (filters: string) => [...clienteKeys.lists(), { filters }] as const,
  details: () => [...clienteKeys.all, 'detail'] as const,
  detail: (id: number) => [...clienteKeys.details(), id] as const,
  search: (searchTerm: string, limit?: number, offset?: number) => 
    [...clienteKeys.all, 'search', searchTerm, limit, offset] as const,
};

/**
 * Hook para buscar clientes con React Query
 * ✅ Compatible con offline: Si está offline, falla silenciosamente
 * El Service Worker entregará datos desde su caché
 */
export const useClientesSearch = (searchTerm = '', limit = 100, offset = 0) => {
  return useQuery(
    queryOptionsWithOfflineSupport(
      clienteKeys.search(searchTerm, limit, offset),
      async () => {
        const response = await axiosAuth.get(
          `/personas/buscar-cliente?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`
        );
        if (response.data.success) {
          return response.data.data;
        }
        throw new Error('Error al buscar clientes');
      },
      {
        staleTime: 60 * 1000, // 60 segundos
        enabled: true, // Siempre habilitado, pero falla silenciosamente si está offline
      }
    )
  );
};

/**
 * Hook para actualizar cliente (mutation)
 * ✅ Invalida caché después de actualizar
 */
export const useActualizarCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clienteData }) => {
      const response = await axiosAuth.put(`/personas/actualizar-cliente/${id}`, clienteData);
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Error al actualizar cliente');
    },
    onSuccess: () => {
      // ✅ Invalidar caché de clientes después de actualizar
      queryClient.invalidateQueries({ queryKey: clienteKeys.all });
      toast.success('Cliente actualizado correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar cliente');
    },
  });
};

