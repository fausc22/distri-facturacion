import { MdKeyboardArrowDown } from 'react-icons/md';
import { Z_INDEX } from '../../constants/zIndex';

export function BotonFlotanteAcciones({ cantidadSeleccionados, onScrollToActions }) {
  if (cantidadSeleccionados === 0) return null;

  return (
    <div
      className="fab-acciones-enter lg:hidden fixed right-4"
      style={{
        zIndex: Z_INDEX.FAB,
        bottom: 'calc(5rem + env(safe-area-inset-bottom))'
      }}
    >
      <button
        onClick={onScrollToActions}
        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg hover:shadow-xl min-h-[56px] min-w-[56px] flex flex-col items-center justify-center gap-0.5 py-3 px-4 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation"
        aria-label={`${cantidadSeleccionados} ventas seleccionadas. Ir a acciones`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <span className="flex items-center justify-center min-w-[22px] h-6 px-1.5 rounded-full bg-white/25 text-sm font-bold tabular-nums">
            {cantidadSeleccionados}
          </span>
          <MdKeyboardArrowDown size={22} className="animate-bounce" aria-hidden />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-95">Acciones</span>
      </button>
    </div>
  );
}