import { MdKeyboardArrowDown } from 'react-icons/md';
import { Z_INDEX } from '../../constants/zIndex';

export function BotonFlotanteAcciones({
  cantidadSeleccionados,
  onScrollToActions,
  entityLabel = 'elementos',
}) {
  if (cantidadSeleccionados === 0) return null;

  return (
    <div
      className="fab-acciones-enter fixed right-4 lg:hidden"
      style={{
        zIndex: Z_INDEX.FAB,
        bottom: 'calc(5rem + env(safe-area-inset-bottom))',
      }}
    >
      <button
        type="button"
        onClick={onScrollToActions}
        className="flex min-h-[56px] min-w-[56px] transform touch-manipulation flex-col items-center justify-center gap-0.5 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
        aria-label={`${cantidadSeleccionados} ${entityLabel} seleccionados. Ir a acciones`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <span className="flex h-6 min-w-[22px] items-center justify-center rounded-full bg-white/25 px-1.5 text-sm font-bold tabular-nums">
            {cantidadSeleccionados}
          </span>
          <MdKeyboardArrowDown size={22} className="animate-bounce" aria-hidden />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-95">
          Acciones
        </span>
      </button>
    </div>
  );
}
