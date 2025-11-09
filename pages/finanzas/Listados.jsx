import { useState, useEffect } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { useGenerarListados } from '../../hooks/listados/useGenerarListados';
import { ModalPDFUniversal } from '../../components/shared/ModalPDFUniversal';
import { axiosAuth } from '../../utils/apiClient';

export default function Listados() {
  useAuth();

  const {
    loading,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    generarPdfLibroIva,
    generarPdfListaPrecios,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF
  } = useGenerarListados();

  // Estados para Libro IVA
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [anioSeleccionado, setAnioSeleccionado] = useState('');

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

  // Handler para generar Libro IVA
  const handleGenerarLibroIva = () => {
    if (!mesSeleccionado || !anioSeleccionado) {
      toast.error('Debe seleccionar mes y año');
      return;
    }
    generarPdfLibroIva(parseInt(mesSeleccionado), parseInt(anioSeleccionado));
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

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Head>
        <title>VERTIMAR | LISTADOS</title>
        <meta name="description" content="Generador de listados gerenciales" />
      </Head>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">LISTADOS GERENCIALES</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECCIÓN LIBRO IVA */}
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
              LIBRO IVA VENTAS
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Genera el libro de IVA con las ventas tipo A y B del mes seleccionado.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un mes</option>
                  {meses.map(mes => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un año</option>
                  {anios.map(anio => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerarLibroIva}
                disabled={loading}
                className={`w-full py-3 rounded-md font-semibold text-white transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Generando...' : 'Generar Libro IVA'}
              </button>
            </div>
          </div>

          {/* SECCIÓN LISTA DE PRECIOS */}
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
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
        </div>

        {/* Botón Volver */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => (window.location.href = '/inicio')}
            className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-md text-white font-semibold transition-colors"
          >
            Volver al Menú
          </button>
        </div>
      </div>

      {/* Modal PDF Unificado */}
      <ModalPDFUniversal
        mostrar={mostrarModalPDF}
        pdfURL={pdfURL}
        nombreArchivo={nombreArchivo}
        titulo={tituloModal}
        subtitulo={subtituloModal}
        onDescargar={descargarPDF}
        onCompartir={compartirPDF}
        onCerrar={cerrarModalPDF}
        zIndex={70}
      />
    </div>
  );
}
