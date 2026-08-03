import { useMemo } from 'react';
import { MdRemoveRedEye } from 'react-icons/md';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
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

function TarjetasGastos({ gastos, seleccion, onToggleSeleccion, onVerDetalle, onComprobante }) {
  return (
    <div className="md:hidden">
      {gastos.length > 0 ? (
        <div className="divide-y rounded-lg border bg-card">
          {gastos.map((gasto) => (
            <div key={gasto.id} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <input
                  type="checkbox"
                  checked={seleccion.includes(gasto.id)}
                  onChange={() => onToggleSeleccion(gasto.id)}
                  className="h-4 w-4"
                />
                <Button size="sm" variant="outline" onClick={() => onComprobante(gasto.id)}>
                  <MdRemoveRedEye size={18} />
                </Button>
              </div>
              <button type="button" className="w-full text-left" onClick={() => onVerDetalle(gasto)}>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-medium">{gasto.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descripción</span>
                    <span>{gasto.descripcion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(gasto.monto)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forma de pago</span>
                    <span>{gasto.forma_pago}</span>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-4 text-center text-muted-foreground">
          No hay gastos registrados
        </div>
      )}
    </div>
  );
}

export default function TablaGastosHistorial({
  gastos,
  totalGastos,
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
            checked={gastos.length > 0 && gastos.every((g) => seleccion.includes(g.id))}
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
      { accessorKey: 'descripcion', header: 'Descripción' },
      {
        accessorKey: 'monto',
        header: 'Monto ($)',
        cell: ({ row }) => formatCurrency(row.original.monto),
      },
      { accessorKey: 'forma_pago', header: 'Forma de Pago' },
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
    [gastos, seleccion, onSelectAll, onToggleSeleccion, onComprobante]
  );

  return (
    <div className="mb-6 overflow-hidden rounded-lg border bg-card shadow-sm">
      {showTitle && (
        <div className="border-b bg-blue-50 px-4 py-3">
          <h2 className="text-lg font-semibold text-blue-800">Gastos Generales</h2>
        </div>
      )}

      {loading ? (
        <LoadingState message="Cargando gastos..." />
      ) : (
        <>
          <div className="hidden p-4 md:block">
            <DataTable
              columns={columns}
              data={gastos}
              enablePagination={false}
              onRowClick={onVerDetalle}
            />
          </div>
          <TarjetasGastos
            gastos={gastos}
            seleccion={seleccion}
            onToggleSeleccion={onToggleSeleccion}
            onVerDetalle={onVerDetalle}
            onComprobante={onComprobante}
          />
          {totalGastos > 0 && (
            <Paginacion
              datosOriginales={{ length: totalGastos }}
              totalRegistros={totalGastos}
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
