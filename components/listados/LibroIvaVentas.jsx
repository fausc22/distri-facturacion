import toast from '@/components/shared/toast';
import { useGenerarListados } from '../../hooks/listados/useGenerarListados';
import { ModalPDFUniversal } from '../../components/shared/ModalPDFUniversal';
import { PanelCard } from '@/components/shared/PanelCard';
import { Button } from '@/components/ui/button';
import { MonthYearPicker } from '@/components/shared/MonthYearPicker';
import { useListadosUIStore } from '@/stores/listadosUIStore';

export default function LibroIvaVentas() {
  const {
    loading,
    generarPdfLibroIva,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
  } = useGenerarListados();

  const { libroIva, setLibroIva } = useListadosUIStore();

  const handleGenerarLibroIva = () => {
    if (!libroIva.mes || !libroIva.anio) {
      toast.error('Debe seleccionar mes y año');
      return;
    }
    generarPdfLibroIva(parseInt(libroIva.mes, 10), parseInt(libroIva.anio, 10));
  };

  return (
    <PanelCard
      title="LIBRO IVA VENTAS"
      description="Genera el libro de IVA con las ventas tipo A y B del mes seleccionado."
    >
      <div className="space-y-4">
        <MonthYearPicker
          mes={libroIva.mes}
          anio={libroIva.anio}
          onMesChange={(mes) => setLibroIva({ mes })}
          onAnioChange={(anio) => setLibroIva({ anio })}
          disabled={loading}
        />

        <Button className="w-full" onClick={handleGenerarLibroIva} disabled={loading}>
          {loading ? 'Generando...' : 'Generar Libro IVA'}
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
