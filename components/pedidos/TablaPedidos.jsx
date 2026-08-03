import React, { useMemo } from 'react';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { LoadingState, EmptyState } from '@/components/shared/StateViews';
import { formatearMoneda } from '@/utils/formatearMoneda';
import { cn } from '@/lib/utils';

const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const estadoVariant = (estado) => {
  switch (estado) {
    case 'Exportado':
      return 'warning';
    case 'Facturado':
      return 'success';
    case 'Anulado':
      return 'destructive';
    default:
      return 'secondary';
  }
};

function ResumenPedidos({ pedidos, selectedPedidos }) {
  const montoTotal = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  return (
    <div className="bg-primary p-4 text-primary-foreground">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <h2 className="text-xl font-semibold">Resumen de Pedidos</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            Total pedidos: <strong>{pedidos.length}</strong>
          </span>
          <span>
            Monto total: <strong>{formatearMoneda(montoTotal)}</strong>
          </span>
          {selectedPedidos.length > 0 && (
            <span>
              Seleccionados: <strong>{selectedPedidos.length}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TarjetasMoviles({
  pedidos,
  selectedPedidos,
  onSelectPedido,
  onSelectAll,
  onRowDoubleClick,
  mostrarPermisos = false,
  verificarPermisos = () => true,
}) {
  const todosSeleccionados = pedidos.length > 0 && selectedPedidos.length === pedidos.length;

  return (
    <div className="lg:hidden">
      <div className="mb-4 flex min-h-[52px] items-center justify-between rounded-t-lg bg-muted/50 p-3">
        <label className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 py-2">
          <input
            type="checkbox"
            checked={todosSeleccionados}
            onChange={() => onSelectAll()}
            className="h-4 w-4 rounded border-input"
            aria-label="Seleccionar todos los pedidos"
          />
          <span className="text-sm font-medium">Seleccionar todos ({pedidos.length})</span>
        </label>
        {selectedPedidos.length > 0 && (
          <span className="text-sm font-medium text-primary">
            {selectedPedidos.length} seleccionados
          </span>
        )}
      </div>

      <div className="space-y-3">
        {pedidos.map((pedido) => (
          <div
            key={pedido.id}
            role="button"
            tabIndex={0}
            className={cn(
              'touch-manipulation cursor-pointer rounded-lg border-2 p-4 transition-all select-none active:scale-[0.98] active:shadow-none',
              selectedPedidos.includes(pedido.id)
                ? 'border-primary/40 bg-primary/5 shadow-md'
                : 'border-border hover:border-muted-foreground/30 hover:shadow-sm',
              mostrarPermisos && !verificarPermisos(pedido) && 'opacity-75'
            )}
            onClick={() => onRowDoubleClick(pedido)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRowDoubleClick(pedido);
              }
            }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex min-h-[44px] items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedPedidos.includes(pedido.id)}
                  onChange={() => onSelectPedido(pedido.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-input"
                  aria-label={`Seleccionar pedido ${pedido.id}`}
                />
                <div>
                  <h3 className="text-lg font-bold text-primary">#{pedido.id}</h3>
                  <p className="text-xs text-muted-foreground">{formatearFecha(pedido.fecha)}</p>
                </div>
              </div>
              <Badge variant={estadoVariant(pedido.estado)}>{pedido.estado || 'Sin estado'}</Badge>
            </div>

            <div className="mb-3 rounded-lg bg-muted/30 p-3">
              <h4 className="font-semibold">{pedido.cliente_nombre || 'Cliente no especificado'}</h4>
              {pedido.cliente_ciudad && (
                <p className="text-sm text-muted-foreground">{pedido.cliente_ciudad}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded bg-emerald-50 p-2 text-center dark:bg-emerald-950/30">
                <div className="text-lg font-bold text-emerald-600">
                  {formatearMoneda(pedido.total || 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="rounded bg-blue-50 p-2 text-center dark:bg-blue-950/30">
                <div className="text-sm font-bold text-blue-600">
                  {pedido.empleado_nombre || 'No especificado'}
                </div>
                <div className="text-xs text-muted-foreground">Vendedor</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TablaPedidos = React.memo(function TablaPedidos({
  pedidos,
  selectedPedidos,
  onSelectPedido,
  onSelectAll,
  onRowDoubleClick,
  loading,
  mostrarPermisos = false,
  verificarPermisos = () => true,
}) {
  const todosSeleccionados = pedidos.length > 0 && selectedPedidos.length === pedidos.length;

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={todosSeleccionados}
            onChange={() => onSelectAll()}
            className="h-4 w-4 rounded border-input"
            aria-label="Seleccionar todos"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedPedidos.includes(row.original.id)}
            onChange={() => onSelectPedido(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-input"
            aria-label={`Seleccionar pedido ${row.original.id}`}
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold text-primary">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => formatearFecha(row.original.fecha),
      },
      {
        accessorKey: 'cliente_nombre',
        header: 'Cliente',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.cliente_nombre || 'Cliente no especificado'}
            </div>
            {row.original.cliente_ciudad && (
              <div className="text-xs text-muted-foreground">{row.original.cliente_ciudad}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600">
            {formatearMoneda(row.original.total || 0)}
          </span>
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant={estadoVariant(row.original.estado)}>
            {row.original.estado || 'Sin estado'}
          </Badge>
        ),
      },
      {
        accessorKey: 'empleado_nombre',
        header: 'Vendedor',
        cell: ({ row }) => row.original.empleado_nombre || 'No especificado',
      },
    ],
    [selectedPedidos, todosSeleccionados, onSelectAll, onSelectPedido]
  );

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <LoadingState message="Cargando pedidos..." />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <EmptyState message="No hay pedidos registrados" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <ResumenPedidos pedidos={pedidos} selectedPedidos={selectedPedidos} />

      <div className="hidden p-4 lg:block">
        <DataTable
          columns={columns}
          data={pedidos}
          enablePagination={false}
          enableSorting
          onRowClick={(pedido) => onSelectPedido(pedido.id)}
          onRowDoubleClick={onRowDoubleClick}
          getRowClassName={(pedido) =>
            selectedPedidos.includes(pedido.id) ? 'bg-primary/5' : undefined
          }
          getRowId={(row) => String(row.id)}
          emptyMessage="No hay pedidos registrados"
        />
      </div>

      <div className="p-4 lg:hidden">
        <TarjetasMoviles
          pedidos={pedidos}
          selectedPedidos={selectedPedidos}
          onSelectPedido={onSelectPedido}
          onSelectAll={onSelectAll}
          onRowDoubleClick={onRowDoubleClick}
          mostrarPermisos={mostrarPermisos}
          verificarPermisos={verificarPermisos}
        />
      </div>
    </div>
  );
});

export default TablaPedidos;
