import { useMemo } from 'react';
import { MdArrowDownward, MdArrowUpward, MdSwapHoriz, MdHistory } from 'react-icons/md';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/StateViews';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

export default function TablaCuentas({
  cuentas,
  totalSaldos,
  loading = false,
  onIngreso,
  onEgreso,
  onTransferencia,
  onVerDetalle,
}) {
  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'nombre', header: 'Nombre' },
      {
        accessorKey: 'saldo',
        header: 'Saldo',
        cell: ({ row }) => (
          <span
            className={
              parseFloat(row.original.saldo) >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'
            }
          >
            {formatCurrency(row.original.saldo)}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex justify-center gap-1">
            <Button size="sm" variant="outline" onClick={() => onIngreso(row.original.id)} title="Ingreso">
              <MdArrowDownward />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEgreso(row.original.id)} title="Egreso">
              <MdArrowUpward />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onTransferencia(row.original.id)} title="Transferir">
              <MdSwapHoriz />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onVerDetalle(row.original)} title="Historial">
              <MdHistory />
            </Button>
          </div>
        ),
      },
    ],
    [onIngreso, onEgreso, onTransferencia, onVerDetalle]
  );

  if (loading) return <LoadingState message="Cargando cuentas..." />;

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={cuentas}
          enablePagination={false}
          emptyMessage="No hay cuentas registradas"
        />
      </div>
      <div className="md:hidden space-y-3">
        {cuentas.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay cuentas registradas</p>
        ) : (
          cuentas.map((cuenta) => (
            <div key={cuenta.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{cuenta.nombre}</span>
                <Badge variant="outline">#{cuenta.id}</Badge>
              </div>
              <p className={`mb-3 text-lg font-bold ${parseFloat(cuenta.saldo) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(cuenta.saldo)}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={() => onIngreso(cuenta.id)}>Ingreso</Button>
                <Button size="sm" variant="danger" onClick={() => onEgreso(cuenta.id)}>Egreso</Button>
                <Button size="sm" variant="secondary" onClick={() => onTransferencia(cuenta.id)}>Transferir</Button>
                <Button size="sm" variant="outline" onClick={() => onVerDetalle(cuenta)}>Historial</Button>
              </div>
            </div>
          ))
        )}
      </div>
      {cuentas.length > 0 && (
        <div className="flex justify-end rounded-md bg-muted/50 p-3 text-sm font-semibold">
          Total:{' '}
          <span className={totalSaldos >= 0 ? 'ml-2 text-emerald-600' : 'ml-2 text-red-600'}>
            {formatCurrency(totalSaldos)}
          </span>
        </div>
      )}
    </div>
  );
}
