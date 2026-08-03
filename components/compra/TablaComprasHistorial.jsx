import { useMemo } from 'react';
import { MdRemoveRedEye } from 'react-icons/md';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/StateViews';
import { Paginacion } from '@/components/Paginacion';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    parseFloat(value) || 0
  );

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function TarjetasCompras({ compras, seleccion, onToggleSeleccion, onVerDetalle, onComprobante }) {
  return (
    <div className="md:hidden">
      {compras.length > 0 ? (
        <div className="divide-y rounded-lg border bg-card">
          {compras.map((compra) => (
            <div key={compra.id} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <input
                  type="checkbox"
                  checked={seleccion.includes(compra.id)}
                  onChange={() => onToggleSeleccion(compra.id)}
                  className="h-4 w-4"
                />
                <Button size="sm" variant="outline" onClick={() => onComprobante(compra.id)}>
                  <MdRemoveRedEye size={18} />
                </Button>
              </div>
              <button type="button" className="w-full text-left" onClick={() => onVerDetalle(compra)}>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-medium">{compra.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha</span>
                    <span>{formatDate(compra.fecha)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proveedor</span>
                    <span>{compra.proveedor_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(compra.total)}
                    </span>
                  </div>
                  <Badge variant="outline">{compra.estado}</Badge>
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-4 text-center text-muted-foreground">
          No hay compras registradas
        </div>
      )}
    </div>
  );
}

export default function TablaComprasHistorial({
  compras,
  totalCompras,
  loading,
  seleccion,
  onToggleSeleccion,
  onSelectAll,
  onVerDetalle,
  onComprobante,
  paginacion,
  totalPaginas,
  indexOfPrimero,
  indexOfUltimo,
  onCambiarPagina,
  onCambiarRegistrosPorPagina,
  showTitle = false,
}) {
  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={compras.length > 0 && compras.every((c) => seleccion.includes(c.id))}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="h-4 w-4"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={seleccion.includes(row.original.id)}
            onChange={() => onToggleSeleccion(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4"
          />
        ),
        enableSorting: false,
      },
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => formatDate(row.original.fecha),
      },
      { accessorKey: 'proveedor_nombre', header: 'Proveedor' },
      { accessorKey: 'proveedor_cuit', header: 'CUIT' },
      {
        accessorKey: 'total',
        header: 'Total ($)',
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => <Badge variant="outline">{row.original.estado}</Badge>,
      },
      {
        id: 'comprobante',
        header: 'Comprobante',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onComprobante(row.original.id);
            }}
          >
            <MdRemoveRedEye size={18} />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [compras, seleccion, onSelectAll, onToggleSeleccion, onComprobante]
  );

  return (
    <div className="mb-8 overflow-hidden rounded-lg border bg-card shadow-sm">
      {showTitle && (
        <div className="border-b bg-emerald-50 px-4 py-3">
          <h2 className="text-lg font-semibold text-emerald-800">Compras a Proveedores</h2>
        </div>
      )}

      {loading ? (
        <LoadingState message="Cargando compras..." />
      ) : (
        <>
          <div className="hidden p-4 md:block">
            <DataTable
              columns={columns}
              data={compras}
              enablePagination={false}
              onRowClick={onVerDetalle}
            />
          </div>
          <TarjetasCompras
            compras={compras}
            seleccion={seleccion}
            onToggleSeleccion={onToggleSeleccion}
            onVerDetalle={onVerDetalle}
            onComprobante={onComprobante}
          />
          {totalCompras > 0 && (
            <Paginacion
              datosOriginales={{ length: totalCompras }}
              totalRegistros={totalCompras}
              paginaActual={paginacion.paginaActual}
              registrosPorPagina={paginacion.registrosPorPagina}
              totalPaginas={totalPaginas}
              indexOfPrimero={indexOfPrimero}
              indexOfUltimo={indexOfUltimo}
              onCambiarPagina={onCambiarPagina}
              onCambiarRegistrosPorPagina={onCambiarRegistrosPorPagina}
            />
          )}
        </>
      )}
    </div>
  );
}
