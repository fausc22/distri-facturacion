import { useMemo } from 'react';
import { MdRemoveRedEye } from 'react-icons/md';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/StateViews';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

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

const obtenerIdParaDetalle = (egreso) =>
  egreso.tipo === 'Compra' || egreso.tipo === 'Gasto' ? egreso.referencia : egreso.id;

const tipoBadgeVariant = (tipo) => {
  if (tipo === 'Compra') return 'info';
  if (tipo === 'Gasto') return 'destructive';
  return 'warning';
};

function ResumenEgresos({ totalEgresos }) {
  return (
    <div className="bg-destructive p-4 text-destructive-foreground">
      <div className="flex flex-col justify-between md:flex-row">
        <h2 className="text-xl font-semibold">Resumen de Egresos</h2>
        <div className="mt-2 md:mt-0">
          <span className="mr-2">Total:</span>
          <span className="text-lg font-bold">{formatCurrency(totalEgresos)}</span>
        </div>
      </div>
    </div>
  );
}

function TarjetasMoviles({ egresos, onVerDetalle }) {
  return (
    <div className="md:hidden">
      {egresos.length > 0 ? (
        <div className="divide-y">
          {egresos.map((egreso, index) => (
            <div key={index} className="p-4 hover:bg-muted/30">
              <div className="mb-2 flex items-start justify-between">
                <Badge variant={tipoBadgeVariant(egreso.tipo)}>{egreso.tipo}</Badge>
                <span className="font-semibold text-red-600">{formatCurrency(egreso.monto)}</span>
              </div>
              <div className="mb-2 space-y-1">
                <p className="text-sm text-muted-foreground">{formatDate(egreso.fecha)}</p>
                <p className="font-medium">{egreso.descripcion || egreso.origen || '-'}</p>
                <p className="text-sm">Cuenta: {egreso.cuenta || '-'}</p>
                {egreso.referencia && <p className="text-sm">Ref: {egreso.referencia}</p>}
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVerDetalle(obtenerIdParaDetalle(egreso), egreso.tipo)}
                >
                  <MdRemoveRedEye size={18} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">No hay egresos registrados</div>
      )}
    </div>
  );
}

export default function TablaEgresos({ egresos, totalEgresos, loading = false, onVerDetalle }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => formatDate(row.original.fecha),
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => (
          <Badge variant={tipoBadgeVariant(row.original.tipo)}>{row.original.tipo}</Badge>
        ),
      },
      {
        accessorKey: 'referencia',
        header: 'Referencia',
        cell: ({ row }) => row.original.referencia || '-',
      },
      {
        id: 'descripcion',
        header: 'Descripción/Origen',
        cell: ({ row }) => row.original.descripcion || row.original.origen || '-',
      },
      {
        accessorKey: 'cuenta',
        header: 'Cuenta',
        cell: ({ row }) => row.original.cuenta || '-',
      },
      {
        accessorKey: 'monto',
        header: 'Monto',
        cell: ({ row }) => (
          <span className="font-semibold text-red-600">{formatCurrency(row.original.monto)}</span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onVerDetalle(obtenerIdParaDetalle(row.original), row.original.tipo)
            }
          >
            <MdRemoveRedEye size={18} />
          </Button>
        ),
      },
    ],
    [onVerDetalle]
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <ResumenEgresos totalEgresos={totalEgresos} />

      {loading ? (
        <LoadingState message="Cargando egresos..." />
      ) : (
        <>
          <div className="hidden p-4 md:block">
            <DataTable
              columns={columns}
              data={egresos}
              enablePagination={false}
              emptyMessage="No hay egresos registrados"
            />
          </div>
          <TarjetasMoviles egresos={egresos} onVerDetalle={onVerDetalle} />
        </>
      )}
    </div>
  );
}
