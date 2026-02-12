import { MdKeyboardArrowDown } from 'react-icons/md';
import { Z_INDEX } from '../../constants/zIndex';

export function BotonFlotanteAcciones({ cantidadSeleccionados, onScrollToActions }) {
  if (cantidadSeleccionados === 0) return null;

  return (
    <>
      {/* Solo visible en móvil y tablet */}
      <div
        className="lg:hidden fixed right-4"
        style={{
          zIndex: Z_INDEX.FAB,
          bottom: 'calc(5rem + env(safe-area-inset-bottom))'
        }}
      >
        <button
          onClick={onScrollToActions}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 transition-all transform hover:scale-105 active:scale-95"
          aria-label="Ir a botones de acción"
        >
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg">{cantidadSeleccionados}</span>
            <MdKeyboardArrowDown size={24} className="animate-bounce" />
          </div>
          <span className="text-xs font-medium">ACCIONES</span>
        </button>
      </div>
    </>
  );
}