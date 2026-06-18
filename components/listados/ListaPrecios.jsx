import toast from '@/components/shared/toast';
import { useGenerarListados } from '../../hooks/listados/useGenerarListados';
import { ModalPDFUniversal } from '../../components/shared/ModalPDFUniversal';
import { PanelCard } from '@/components/shared/PanelCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingState, EmptyState } from '@/components/shared/StateViews';
import { useListadosCategoriasQuery } from '@/hooks/queries/finanzasQueries';
import { useListadosUIStore } from '@/stores/listadosUIStore';

export default function ListaPrecios() {
  const {
    loading,
    generarPdfListaPrecios,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
  } = useGenerarListados();

  const { listaPrecios, setCategoriasSeleccionadas, toggleCategoria } = useListadosUIStore();
  const { categoriasSeleccionadas } = listaPrecios;

  const { data: categorias = [], isLoading: loadingCategorias } = useListadosCategoriasQuery();

  const handleGenerarListaPrecios = () => {
    generarPdfListaPrecios(categoriasSeleccionadas);
  };

  const handleToggleTodasCategorias = () => {
    if (categoriasSeleccionadas.length === categorias.length) {
      setCategoriasSeleccionadas([]);
    } else {
      setCategoriasSeleccionadas(categorias.map((c) => c.id));
    }
  };

  return (
    <PanelCard
      title="LISTA DE PRECIOS"
      description="Genera la lista de precios por categoría. Puedes filtrar por categorías específicas."
    >
      <div className="space-y-4">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label>Categorías</Label>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={handleToggleTodasCategorias}>
              {categoriasSeleccionadas.length === categorias.length
                ? 'Deseleccionar todas'
                : 'Seleccionar todas'}
            </Button>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-md border bg-background p-3">
            {loadingCategorias ? (
              <LoadingState message="Cargando categorías..." />
            ) : categorias.length === 0 ? (
              <EmptyState message="No hay categorías disponibles" />
            ) : (
              <div className="space-y-2">
                {categorias.map((categoria) => (
                  <label
                    key={categoria.id}
                    className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={categoriasSeleccionadas.includes(categoria.id)}
                      onChange={() => toggleCategoria(categoria.id)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    />
                    <span className="text-sm">{categoria.nombre}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {categoriasSeleccionadas.length === 0
              ? 'Se incluirán todas las categorías'
              : `${categoriasSeleccionadas.length} categoría(s) seleccionada(s)`}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleGenerarListaPrecios}
          disabled={loading || loadingCategorias}
        >
          {loading ? 'Generando...' : 'Generar Lista de Precios'}
        </Button>
      </div>

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
    </PanelCard>
  );
}
