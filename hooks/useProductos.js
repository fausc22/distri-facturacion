// hooks/useProductos.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';

export const useProductos = () => {
  const [loading, setLoading] = useState(false);

  // Crear producto
  const crearProducto = async (productoData) => {
    setLoading(true);
    try {
      const response = await axiosAuth.post('/productos/crear-producto', productoData);

      if (response.data.success) {
        toast.success('Producto creado correctamente');
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error al crear producto:', error);
      const message = error.response?.data?.message || 'Error al crear producto';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Buscar productos
  const buscarProductos = async (searchTerm) => {
    setLoading(true);
    try {
      const response = await axiosAuth.get(`/productos/buscar-producto?search=${encodeURIComponent(searchTerm || '')}`);

      if (response.data.success) {
        // El backend ya trae la categoría incluida
        return { success: true, data: response.data.data };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Error al buscar productos:', error);
      toast.error('Error al buscar productos');
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar producto
  const actualizarProducto = async (id, productoData) => {
    setLoading(true);
    try {
      const response = await axiosAuth.put(`/productos/actualizar-producto/${id}`, productoData);

      if (response.data.success) {
        toast.success('Producto actualizado correctamente');
        return { success: true, data: response.data.data || response.data };
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      const message = error.response?.data?.message || 'Error al actualizar producto';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Obtener categorías
  const obtenerCategorias = async () => {
    try {
      const response = await axiosAuth.get('/productos/categorias');

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      toast.error('Error al obtener categorías');
      return { success: false, data: [] };
    }
  };

  // Validar datos de producto
  const validarDatosProducto = (datos) => {
    const errores = [];

    // Campos obligatorios
    if (!datos.nombre?.trim()) {
      errores.push('El nombre es obligatorio');
    }

    if (!datos.categoria_id) {
      errores.push('La categoría es obligatoria');
    }

    if (!datos.unidad_medida?.trim()) {
      errores.push('La unidad de medida es obligatoria');
    }

    // Validaciones numéricas
    const costo = parseFloat(datos.costo);
    if (isNaN(costo) || costo < 0) {
      errores.push('El costo debe ser un número válido mayor o igual a 0');
    }

    const precio = parseFloat(datos.precio);
    if (isNaN(precio) || precio < 0) {
      errores.push('El precio debe ser un número válido mayor o igual a 0');
    }

    const iva = parseFloat(datos.iva);
    if (isNaN(iva) || iva < 0 || iva > 100) {
      errores.push('El IVA debe ser un porcentaje válido entre 0 y 100');
    }

    const stock = parseFloat(datos.stock_actual);
    if (isNaN(stock) || stock < 0) {
      errores.push('El stock debe ser un número válido mayor o igual a 0');
    }

    // Validación de lógica de negocio
    if (!isNaN(costo) && !isNaN(precio) && precio < costo) {
      errores.push('Advertencia: El precio de venta es menor que el costo');
    }

    return errores;
  };

  return {
    loading,
    crearProducto,
    buscarProductos,
    actualizarProducto,
    obtenerCategorias,
    validarDatosProducto
  };
};
