import { useCallback, useEffect, useMemo } from 'react';
import toast from '@/components/shared/toast';
import ClienteSelector from '../pedidos/SelectorClientes';
import { ModalPDFUniversal } from '../shared/ModalPDFUniversal';
import { PanelCard } from '@/components/shared/PanelCard';
import { Button } from '@/components/ui/button';
import { LoadingState, EmptyState } from '@/components/shared/StateViews';
import { useResumenCuenta } from '../../hooks/listados/useResumenCuenta';
import { useListadosUIStore } from '@/stores/listadosUIStore';
import { formatearMoneda } from '../../utils/formatearMoneda';
import { cn } from '@/lib/utils';

const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getTipoLabel = (tipoDoc, tipoF) => {
  const doc = (tipoDoc || '').toUpperCase();
  const fiscal = (tipoF || '').toUpperCase();
  if (doc === 'NOTA_DEBITO') return `ND ${fiscal}`;
  if (doc === 'NOTA_CREDITO') return `NC ${fiscal}`;
  return `Factura ${fiscal}`;
};

export default function ResumenCuenta() {
  const { resumenCuenta, setResumenCuentaCliente, clearResumenCuentaCliente } = useListadosUIStore();
  const cliente = resumenCuenta.cliente;

  const {
    ventas,
    selectedIds,
    loadingVentas,
    loadingPDF,
    totalDisponibles,
    totalSeleccionado,
    todasSeleccionadas,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    cargarVentasCliente,
    limpiarVentas,
    toggleVenta,
    toggleTodas,
    generarResumen,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
  } = useResumenCuenta();

  const contextAdapter = useMemo(() => ({
    cliente,
    setCliente: setResumenCuentaCliente,
    clearCliente: () => {
      clearResumenCuentaCliente();
      limpiarVentas();
    },
  }), [cliente, setResumenCuentaCliente, clearResumenCuentaCliente, limpiarVentas]);

  useEffect(() => {
    if (cliente?.id || cliente?.nombre) {
      cargarVentasCliente(cliente);
    } else {
      limpiarVentas();
    }
  }, [cliente, cargarVentasCliente, limpiarVentas]);

  const handleGenerarResumen = useCallback(async () => {
    if (!cliente) {
      toast.error('Seleccione un cliente primero');
      return;
    }
    await generarResumen(cliente);
  }, [cliente, generarResumen]);

  const haySeleccion = selectedIds.length > 0;

  return (
    <PanelCard
      title="RESUMEN DE CUENTA"
      description="Seleccione un cliente y los comprobantes a incluir. El PDF consolidará los totales en un único documento informativo."
    >
      <div className="space-y-6">
        <ClienteSelector
          contextAdapter={contextAdapter}
          allowCreate={false}
          containerClassName="bg-primary-dark text-white p-4 sm:p-6 rounded-lg"
          title="Cliente"
        />

        {cliente && (
          <div className="space-y-4">
            {loadingVentas ? (
              <LoadingState message="Cargando comprobantes del cliente..." />
            ) : ventas.length === 0 ? (
              <EmptyState message="No hay comprobantes facturados para este cliente." />
            ) : (
              <>
                {totalDisponibles > 200 && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    El cliente tiene {totalDisponibles} comprobantes. Se muestran los 200 más recientes.
                  </p>
                )}

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={todasSeleccionadas}
                            onChange={toggleTodas}
                            aria-label="Seleccionar todos los comprobantes"
                            className="h-4 w-4"
                          />
                        </th>
                        <th className="p-3 text-left">Fecha</th>
                        <th className="p-3 text-left">Nº Comprobante</th>
                        <th className="p-3 text-left">Tipo</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventas.map((venta) => {
                        const isSelected = selectedIds.includes(venta.id);
                        return (
                          <tr
                            key={venta.id}
                            className={cn(
                              'border-t cursor-pointer transition-colors',
                              isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                            )}
                            onClick={() => toggleVenta(venta.id)}
                          >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleVenta(venta.id)}
                                aria-label={`Seleccionar comprobante ${venta.numero_factura}`}
                                className="h-4 w-4"
                              />
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {formatearFecha(venta.fecha_fiscal || venta.fecha)}
                            </td>
                            <td className="p-3 font-medium">{venta.numero_factura || '-'}</td>
                            <td className="p-3">{getTipoLabel(venta.tipo_doc, venta.tipo_f)}</td>
                            <td className="p-3 text-right font-semibold text-green-700">
                              {formatearMoneda(venta.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div
                  className={cn(
                    'rounded-xl border-2 px-4 py-4 transition-colors',
                    haySeleccion ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Comprobantes seleccionados</p>
                      <p className="text-lg font-semibold">
                        {selectedIds.length} de {ventas.length}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-muted-foreground">Total acumulado</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatearMoneda(totalSeleccionado)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleGenerarResumen}
          disabled={!cliente || !haySeleccion || loadingPDF || loadingVentas}
        >
          {loadingPDF ? 'Generando...' : 'Generar Resumen de Cuenta'}
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
