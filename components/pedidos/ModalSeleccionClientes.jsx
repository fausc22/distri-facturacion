import { useEffect } from 'react';
import { MdEdit, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';

export default function ModalSeleccionClientes({
  resultados,
  onSeleccionar,
  onCerrar,
  loading,
  isPWA,
  isOnline,
  onVerMas,
  hasMore,
  titulo = 'Seleccionar Cliente',
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 sm:p-4">
      <div className="flex h-[100dvh] w-screen flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-lg sm:shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
          {isPWA && (
            <div className="flex items-center gap-1.5 text-sm">
              <span
                className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
              <span className={isOnline ? 'text-emerald-700' : 'text-amber-700'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          )}
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          {loading ? (
            <li className="py-8 text-center text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                Buscando...
              </div>
            </li>
          ) : resultados.length > 0 ? (
            resultados.map((cliente, idx) => (
              <li
                key={cliente.id ?? idx}
                className="cursor-pointer rounded-lg border-b px-3 py-3 transition-colors last:border-0 hover:bg-muted/60 active:bg-primary/10"
                onClick={() => onSeleccionar(cliente)}
              >
                <div className="font-medium text-foreground">{cliente.nombre}</div>
                {cliente.ciudad && (
                  <div className="text-sm text-muted-foreground">{cliente.ciudad}</div>
                )}
                {cliente.telefono && (
                  <div className="text-xs text-muted-foreground">{cliente.telefono}</div>
                )}
              </li>
            ))
          ) : (
            <li className="py-8 text-center text-muted-foreground">
              {isPWA && !isOnline
                ? 'No se encontraron clientes en datos offline.'
                : 'No se encontraron resultados.'}
            </li>
          )}
        </ul>

        <div
          className="shrink-0 space-y-2 border-t bg-background p-4"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          {hasMore && (
            <button
              type="button"
              onClick={onVerMas}
              disabled={loading}
              className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Ver más resultados'}
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function PanelDetalleCliente({
  cliente,
  expandido,
  onToggle,
  onEditar,
  puedeEditar = false,
  className = 'bg-primary-dark p-4 rounded mt-2 text-sm text-white',
}) {
  if (!cliente) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center justify-between text-left"
          onClick={onToggle}
        >
          <p>
            <strong>Cliente:</strong> {cliente.nombre || '-'}
          </p>
          {expandido ? (
            <MdKeyboardArrowUp size={22} className="shrink-0 opacity-80" />
          ) : (
            <MdKeyboardArrowDown size={22} className="shrink-0 opacity-80" />
          )}
        </button>
        {puedeEditar && onEditar && (
          <button
            type="button"
            onClick={onEditar}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md bg-white/15 p-2 transition-colors hover:bg-white/25"
            title="Editar cliente"
            aria-label="Editar cliente"
          >
            <MdEdit size={20} />
          </button>
        )}
      </div>

      {expandido && (
        <div className="mt-2 space-y-1 border-t border-white/20 pt-2">
          <p>
            <strong>Dirección:</strong> {cliente.direccion || '-'}
          </p>
          <p>
            <strong>Ciudad:</strong> {cliente.ciudad || '-'}
          </p>
          <p>
            <strong>Provincia:</strong> {cliente.provincia || '-'}
          </p>
          <p>
            <strong>Teléfono:</strong> {cliente.telefono || '-'}
          </p>
          <p>
            <strong>Email:</strong> {cliente.email || '-'}
          </p>
          <p>
            <strong>CUIT:</strong> {cliente.cuit || '-'}
          </p>
          <p>
            <strong>Condición IVA:</strong> {cliente.condicion_iva || '-'}
          </p>
        </div>
      )}
    </div>
  );
}
