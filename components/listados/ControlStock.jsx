import { useCallback } from 'react';
import toast from '@/components/shared/toast';
import { useControlStock } from '../../context/ControlStockContext';
import { useGenerarPDFControlStock } from '../../hooks/listados/useGenerarPDFControlStock';
import { BotonGenerarPDFUniversal, ModalPDFUniversal } from '../../components/shared/ModalPDFUniversal';
import SelectorCategoriasStock from './SelectorCategoriasStock';
import SelectorProductosStock from './SelectorProductosStock';
import ListaProductosStock from './ListaProductosStock';
import FiltroStock from './FiltroStock';
import { PanelCard } from '@/components/shared/PanelCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useListadosUIStore } from '@/stores/listadosUIStore';
import { cn } from '@/lib/utils';

export default function ControlStock() {
  const { productos, filtroTipo, cantidadFiltro, clearProductos } = useControlStock();

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
    cerrarModalPDF,
  } = useGenerarPDFControlStock();

  const { controlStock, setControlStock } = useListadosUIStore();
  const { modoGeneracion, modoSeleccion, categoriasSeleccionadas } = controlStock;

  const setModoGeneracion = useCallback(
    (modo) => setControlStock({ modoGeneracion: modo }),
    [setControlStock]
  );
  const setModoSeleccion = useCallback(
    (modo) => setControlStock({ modoSeleccion: modo }),
    [setControlStock]
  );
  const setCategoriasSeleccionadas = useCallback(
    (categorias) => setControlStock({ categoriasSeleccionadas: categorias }),
    [setControlStock]
  );

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

  const ModeButton = ({ active, onClick, children }) => (
    <Button
      type="button"
      variant={active ? 'primary' : 'outline'}
      className={cn('flex-1', active && 'shadow-sm')}
      onClick={onClick}
    >
      {children}
    </Button>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PanelCard
        title="CONTROL DE STOCK"
        description="Genera un listado de productos con su stock actual. Puedes seleccionar productos manualmente o usar filtros automáticos."
      >
        <div className="mb-6 space-y-2">
          <Label>Modo de Generación</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ModeButton active={modoGeneracion === 'seleccion'} onClick={() => setModoGeneracion('seleccion')}>
              Selección Manual
            </ModeButton>
            <ModeButton active={modoGeneracion === 'filtro'} onClick={() => setModoGeneracion('filtro')}>
              Filtro Automático
            </ModeButton>
          </div>
        </div>

        {modoGeneracion === 'seleccion' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Método de Selección</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ModeButton
                  active={modoSeleccion === 'categorias'}
                  onClick={() => {
                    setModoSeleccion('categorias');
                    setCategoriasSeleccionadas([]);
                    clearProductos();
                  }}
                >
                  Por Categorías
                </ModeButton>
                <ModeButton
                  active={modoSeleccion === 'manual'}
                  onClick={() => {
                    setModoSeleccion('manual');
                    setCategoriasSeleccionadas([]);
                    clearProductos();
                  }}
                >
                  Búsqueda Individual
                </ModeButton>
              </div>
            </div>

            {modoSeleccion === 'categorias' ? (
              <SelectorCategoriasStock onCategoriasChange={setCategoriasSeleccionadas} />
            ) : (
              <div className="space-y-4">
                <SelectorProductosStock />
                <ListaProductosStock />
              </div>
            )}
          </div>
        ) : (
          <FiltroStock />
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <BotonGenerarPDFUniversal
            onGenerar={handleGenerarPDF}
            loading={loading}
            texto={
              modoGeneracion === 'filtro'
                ? `Generar PDF (${filtroTipo === 'menor' ? 'Menor' : 'Mayor'} Stock)`
                : 'Generar PDF Control de Stock'
            }
            disabled={
              modoGeneracion === 'filtro'
                ? false
                : modoSeleccion === 'categorias'
                  ? categoriasSeleccionadas.length === 0 || productos.length === 0
                  : productos.length === 0
            }
            className="bg-primary px-6 py-2 font-semibold text-primary-foreground"
          />
          {modoGeneracion === 'seleccion' && modoSeleccion === 'manual' && productos.length > 0 && (
            <Button variant="outline" onClick={clearProductos}>
              Limpiar Lista
            </Button>
          )}
        </div>
      </PanelCard>

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
