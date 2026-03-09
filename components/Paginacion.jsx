import { Fragment } from 'react';

export function Paginacion({
  datosOriginales,
  totalRegistros,
  paginaActual,
  registrosPorPagina,
  totalPaginas,
  indexOfPrimero,
  indexOfUltimo,
  onCambiarPagina,
  onCambiarRegistrosPorPagina
}) {
  const total = totalRegistros !== undefined ? totalRegistros : (datosOriginales?.length ?? 0);
  if (total === 0 && (!datosOriginales || datosOriginales.length === 0)) return null;

  return (
    <>
      {/* Paginación para escritorio */}
      <div className="hidden md:flex items-center justify-between p-4 border-t bg-white rounded-b">
        <div className="flex items-center gap-2">
          <span className="text-sm">Mostrar</span>
          <select
            className="border rounded px-2 py-2 min-h-[44px] text-sm"
            value={registrosPorPagina}
            onChange={(e) => onCambiarRegistrosPorPagina(Number(e.target.value))}
            aria-label="Registros por página"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm">registros por página</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm mr-2">
            {indexOfPrimero + 1}–{Math.min(indexOfUltimo, total)} de {total}
          </span>
          <div className="flex rounded overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => onCambiarPagina(1)}
              disabled={paginaActual === 1}
              className={`min-h-[44px] min-w-[44px] px-3 flex items-center justify-center text-sm ${paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}
              aria-label="Primera página"
            >
              ⟪
            </button>
            <button
              type="button"
              onClick={() => onCambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className={`min-h-[44px] min-w-[44px] px-3 flex items-center justify-center border-l border-gray-300 text-sm ${paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}
              aria-label="Página anterior"
            >
              ⟨
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(num =>
                num === 1 ||
                num === totalPaginas ||
                (num >= paginaActual - 1 && num <= paginaActual + 1)
              )
              .map((numero, index, array) => {
                const mostrarPuntosSuspensivos = index > 0 && numero - array[index - 1] > 1;
                return (
                  <Fragment key={numero}>
                    {mostrarPuntosSuspensivos && (
                      <span className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center border-l border-gray-300 text-sm">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => onCambiarPagina(numero)}
                      className={`min-h-[44px] min-w-[44px] px-3 flex items-center justify-center border-l border-gray-300 text-sm ${
                        paginaActual === numero ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'
                      }`}
                      aria-label={`Página ${numero}`}
                      aria-current={paginaActual === numero ? 'page' : undefined}
                    >
                      {numero}
                    </button>
                  </Fragment>
                );
              })}
            <button
              type="button"
              onClick={() => onCambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className={`min-h-[44px] min-w-[44px] px-3 flex items-center justify-center border-l border-gray-300 text-sm ${paginaActual === totalPaginas ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}
              aria-label="Página siguiente"
            >
              ⟩
            </button>
            <button
              type="button"
              onClick={() => onCambiarPagina(totalPaginas)}
              disabled={paginaActual === totalPaginas}
              className={`min-h-[44px] min-w-[44px] px-3 flex items-center justify-center border-l border-gray-300 text-sm ${paginaActual === totalPaginas ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}
              aria-label="Última página"
            >
              ⟫
            </button>
          </div>
        </div>
      </div>

      {/* Paginación para móvil: áreas táctiles ≥44px (Fase 4) */}
      <div className="md:hidden bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={() => onCambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className={`min-h-[44px] min-w-[44px] flex-1 max-w-[140px] flex items-center justify-center rounded-lg font-medium text-sm touch-manipulation ${paginaActual === 1 ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white active:bg-blue-600'}`}
            aria-label="Página anterior"
          >
            Anterior
          </button>
          <span className="text-sm font-medium text-gray-700 shrink-0">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => onCambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className={`min-h-[44px] min-w-[44px] flex-1 max-w-[140px] flex items-center justify-center rounded-lg font-medium text-sm touch-manipulation ${paginaActual === totalPaginas ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white active:bg-blue-600'}`}
            aria-label="Página siguiente"
          >
            Siguiente
          </button>
        </div>
        <div className="mt-3">
          <select
            className="border border-gray-300 rounded-lg w-full p-3 min-h-[44px] text-base touch-manipulation"
            value={registrosPorPagina}
            onChange={(e) => onCambiarRegistrosPorPagina(Number(e.target.value))}
            aria-label="Registros por página"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      </div>
    </>
  );
}