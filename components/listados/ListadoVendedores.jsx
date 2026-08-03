import toast from '@/components/shared/toast';
import { useGenerarListados } from '../../hooks/listados/useGenerarListados';
import { ModalPDFUniversal } from '../../components/shared/ModalPDFUniversal';
import { PanelCard } from '@/components/shared/PanelCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MonthYearPicker } from '@/components/shared/MonthYearPicker';
import { LoadingState, EmptyState } from '@/components/shared/StateViews';
import { useListadosUIStore } from '@/stores/listadosUIStore';
import { useListadosEmpleadosQuery } from '@/hooks/queries/finanzasQueries';
import { useEffect } from 'react';

export default function ListadoVendedores() {
  const {
    loading,
    generarPdfListadoVendedores,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
  } = useGenerarListados();

  const { listadoVendedores, setListadoVendedores } = useListadosUIStore();
  const {
    data: empleados = [],
    isLoading: loadingEmpleados,
    isError,
    error,
  } = useListadosEmpleadosQuery();

  useEffect(() => {
    if (isError) {
      toast.error(error?.message || 'Error al cargar vendedores');
    }
  }, [isError, error]);

  const handleGenerarListadoVendedores = () => {
    const { vendedorId, mes, anio } = listadoVendedores;
    if (!vendedorId || !mes || !anio) {
      toast.error('Debe seleccionar vendedor, mes y año');
      return;
    }
    generarPdfListadoVendedores(
      parseInt(vendedorId, 10),
      parseInt(mes, 10),
      parseInt(anio, 10)
    );
  };

  return (
    <PanelCard
      title="LISTADO DE VENDEDORES"
      description="Genera un listado con todas las ventas (A, B, X) de un vendedor específico en el mes seleccionado."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Vendedor</Label>
          {loadingEmpleados ? (
            <LoadingState message="Cargando vendedores..." />
          ) : isError ? (
            <EmptyState message="No se pudieron cargar los vendedores" />
          ) : empleados.length === 0 ? (
            <EmptyState message="No hay vendedores activos disponibles" />
          ) : (
            <Select
              value={listadoVendedores.vendedorId}
              onValueChange={(vendedorId) => setListadoVendedores({ vendedorId })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un vendedor" />
              </SelectTrigger>
              <SelectContent>
                {empleados.map((empleado) => (
                  <SelectItem key={empleado.id} value={String(empleado.id)}>
                    {empleado.nombre} {empleado.apellido}
                    {empleado.rol ? ` (${empleado.rol})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <MonthYearPicker
          mes={listadoVendedores.mes}
          anio={listadoVendedores.anio}
          onMesChange={(mes) => setListadoVendedores({ mes })}
          onAnioChange={(anio) => setListadoVendedores({ anio })}
          disabled={loading}
        />

        <Button
          className="w-full"
          variant="secondary"
          onClick={handleGenerarListadoVendedores}
          disabled={loading || loadingEmpleados || isError || empleados.length === 0}
        >
          {loading ? 'Generando...' : 'Generar Listado de Vendedores'}
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
