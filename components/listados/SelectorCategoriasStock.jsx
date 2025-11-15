import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { useControlStock } from '../../context/ControlStockContext';

export default function SelectorCategoriasStock({ onCategoriasChange }) {
  const { addMultipleProductos, clearProductos } = useControlStock();
  const [categorias, setCategorias] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const isInitialMount = useRef(true);
  const prevCategoriasRef = useRef([]);

  useEffect(() => {
    cargarCategorias();
  }, []);

  // Cargar productos automáticamente cuando cambien las categorías seleccionadas
  useEffect(() => {
    // Notificar al componente padre sobre el cambio siempre
    if (onCategoriasChange) {
      onCategoriasChange(categoriasSeleccionadas);
    }

    // No cargar en el primer render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCategoriasRef.current = categoriasSeleccionadas;
      return;
    }

    // Solo cargar si las categorías realmente cambiaron
    if (JSON.stringify(categoriasSeleccionadas) !== JSON.stringify(prevCategoriasRef.current)) {
      prevCategoriasRef.current = categoriasSeleccionadas;

      // Si hay categorías seleccionadas, cargar productos automáticamente
      if (categoriasSeleccionadas.length > 0) {
        cargarProductosAutomaticamente();
      } else {
        // Si no hay categorías seleccionadas, limpiar productos
        clearProductos();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriasSeleccionadas, onCategoriasChange]);

  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const response = await axiosAuth.get('/productos/categorias');
      const categoriasData = response.data.data || response.data;
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.error('Error al cargar categorías');
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Handler para cambiar selección de categorías
  const handleToggleCategoria = (categoriaId) => {
    setCategoriasSeleccionadas(prev => {
      if (prev.includes(categoriaId)) {
        return prev.filter(id => id !== categoriaId);
      } else {
        return [...prev, categoriaId];
      }
    });
  };

  // Handler para seleccionar/deseleccionar todas las categorías
  const handleToggleTodasCategorias = () => {
    if (categoriasSeleccionadas.length === categorias.length) {
      setCategoriasSeleccionadas([]);
    } else {
      setCategoriasSeleccionadas(categorias.map(c => c.id));
    }
  };

  // Cargar productos automáticamente cuando hay categorías seleccionadas
  const cargarProductosAutomaticamente = async () => {
    if (categoriasSeleccionadas.length === 0) {
      return;
    }

    setLoadingProductos(true);
    clearProductos(); // Limpiar productos anteriores
    
    try {
      // Obtener todos los productos y filtrar por categorías seleccionadas
      const response = await axiosAuth.get('/productos/obtener-todos-productos');
      const todosProductos = response.data.data || response.data || [];
      
      // Filtrar productos por categorías seleccionadas
      const productos = todosProductos.filter(p => 
        categoriasSeleccionadas.includes(p.categoria_id)
      );
      
      if (productos.length === 0) {
        // No mostrar error si no hay productos, solo dejar vacío
        return;
      }

      // Formatear productos para agregar al contexto
      const productosFormateados = productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidad_medida: p.unidad_medida || 'Unidad',
        stock_actual: parseFloat(p.stock_actual) || 0,
        categoria_id: p.categoria_id || null,
        categoria_nombre: p.categoria_nombre || 'Sin Categoría'
      }));

      addMultipleProductos(productosFormateados);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos de las categorías');
    } finally {
      setLoadingProductos(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Categorías
          </label>
          <button
            onClick={handleToggleTodasCategorias}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {categoriasSeleccionadas.length === categorias.length
              ? 'Deseleccionar todas'
              : 'Seleccionar todas'}
          </button>
        </div>

        <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
          {loadingCategorias ? (
            <p className="text-sm text-gray-500">Cargando categorías...</p>
          ) : categorias.length === 0 ? (
            <p className="text-sm text-gray-500">No hay categorías disponibles</p>
          ) : (
            <div className="space-y-2">
              {categorias.map(categoria => (
                <label
                  key={categoria.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={categoriasSeleccionadas.includes(categoria.id)}
                    onChange={() => handleToggleCategoria(categoria.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{categoria.nombre}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {loadingProductos ? (
            <span className="text-blue-600">Cargando productos...</span>
          ) : categoriasSeleccionadas.length === 0 ? (
            'Seleccione categorías para incluir en el reporte'
          ) : (
            `${categoriasSeleccionadas.length} categoría(s) seleccionada(s)`
          )}
        </p>
      </div>
    </div>
  );
}
