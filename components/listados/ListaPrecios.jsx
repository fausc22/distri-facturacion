import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { useGenerarListados } from '../../hooks/listados/useGenerarListados';

export default function ListaPrecios() {
  const { loading, generarPdfListaPrecios } = useGenerarListados();

  // Estados para Lista de Precios
  const [categorias, setCategorias] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias();
  }, []);

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

  // Handler para generar Lista de Precios
  const handleGenerarListaPrecios = () => {
    generarPdfListaPrecios(categoriasSeleccionadas);
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

  return (
    <div className="border border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
        LISTA DE PRECIOS
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Genera la lista de precios por categoría. Puedes filtrar por categorías específicas.
      </p>

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
            {categoriasSeleccionadas.length === 0
              ? 'Se incluirán todas las categorías'
              : `${categoriasSeleccionadas.length} categoría(s) seleccionada(s)`}
          </p>
        </div>

        <button
          onClick={handleGenerarListaPrecios}
          disabled={loading || loadingCategorias}
          className={`w-full py-3 rounded-md font-semibold text-white transition-colors ${
            loading || loadingCategorias
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Generando...' : 'Generar Lista de Precios'}
        </button>
      </div>
    </div>
  );
}

