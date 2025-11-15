import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useControlStock } from '../../context/ControlStockContext';
import { useGenerarPDFControlStock } from '../../hooks/listados/useGenerarPDFControlStock';
import { BotonGenerarPDFUniversal, ModalPDFUniversal } from '../../components/shared/ModalPDFUniversal';
import SelectorCategoriasStock from './SelectorCategoriasStock';
import SelectorProductosStock from './SelectorProductosStock';
import ListaProductosStock from './ListaProductosStock';
import FiltroStock from './FiltroStock';

export default function ControlStock() {
  const { 
    productos, 
    filtroTipo, 
    cantidadFiltro,
    clearProductos 
  } = useControlStock();

  const {
    loading,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    generarPdfPorFiltro,
    generarPdfPorSeleccion,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF
  } = useGenerarPDFControlStock();

  const [modoGeneracion, setModoGeneracion] = useState('seleccion'); // 'seleccion' o 'filtro'
  const [modoSeleccion, setModoSeleccion] = useState('categorias'); // 'categorias' o 'manual'
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);

  const handleGenerarPDF = () => {
    if (modoGeneracion === 'filtro') {
      generarPdfPorFiltro(filtroTipo, cantidadFiltro);
    } else {
      if (productos.length === 0) {
        toast.error('Debe seleccionar al menos un producto');
        return;
      }
      generarPdfPorSeleccion(productos);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="border border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
          CONTROL DE STOCK
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Genera un listado de productos con su stock actual. Puedes seleccionar productos manualmente o usar filtros automáticos.
        </p>

        {/* Selector de modo de generación */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modo de Generación
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setModoGeneracion('seleccion')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                modoGeneracion === 'seleccion'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Selección Manual
            </button>
            <button
              onClick={() => setModoGeneracion('filtro')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                modoGeneracion === 'filtro'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Filtro Automático
            </button>
          </div>
        </div>

        {/* Contenido según el modo */}
        {modoGeneracion === 'seleccion' ? (
          <div className="space-y-4">
            {/* Selector de método de selección manual */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Selección
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setModoSeleccion('categorias');
                    setCategoriasSeleccionadas([]);
                    clearProductos();
                  }}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    modoSeleccion === 'categorias'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Por Categorías
                </button>
                <button
                  onClick={() => {
                    setModoSeleccion('manual');
                    setCategoriasSeleccionadas([]);
                    clearProductos();
                  }}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    modoSeleccion === 'manual'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Búsqueda Individual
                </button>
              </div>
            </div>

            {/* Contenido según el método de selección */}
            {modoSeleccion === 'categorias' ? (
              <SelectorCategoriasStock onCategoriasChange={setCategoriasSeleccionadas} />
            ) : (
              <div className="space-y-4">
                <SelectorProductosStock />
                {/* Solo mostrar lista cuando se busca manualmente */}
                <ListaProductosStock />
              </div>
            )}
          </div>
        ) : (
          <FiltroStock />
        )}

        {/* Botón para generar PDF */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <BotonGenerarPDFUniversal
            onGenerar={handleGenerarPDF}
            loading={loading}
            texto={
              modoGeneracion === 'filtro'
                ? `Generar PDF (${filtroTipo === 'menor' ? 'Menor' : 'Mayor'} Stock)`
                : 'Generar PDF Control de Stock'
            }
            disabled={
              modoGeneracion === 'filtro' ? false :
              modoSeleccion === 'categorias' 
                ? categoriasSeleccionadas.length === 0 || productos.length === 0
                : productos.length === 0
            }
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded text-white font-semibold"
          />
          {modoGeneracion === 'seleccion' && modoSeleccion === 'manual' && productos.length > 0 && (
            <button
              onClick={clearProductos}
              className="bg-gray-500 hover:bg-gray-600 px-6 py-2 rounded text-white font-semibold"
            >
              Limpiar Lista
            </button>
          )}
        </div>
      </div>

      {/* Modal PDF para Control de Stock */}
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

