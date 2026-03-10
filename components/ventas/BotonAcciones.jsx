import { ModalPDFUniversal, BotonGenerarPDFUniversal } from '../shared/ModalPDFUniversal';

const btnBase = 'min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 touch-manipulation active:scale-[0.98] disabled:active:scale-100';

export function BotonAcciones({ 
  selectedVentas, 
  onImprimirMultiple, 
  imprimiendo,
  onVolverMenu,
  solicitando,
  onSolicitarCAE,
  
  // Props para modal PDF múltiple
  mostrarModalPDFMultiple = false,
  pdfURLMultiple = null,
  nombreArchivoMultiple = '',
  tituloModalMultiple = 'Facturas Generadas Exitosamente',
  subtituloModalMultiple = '',
  onDescargarPDFMultiple,
  onCompartirPDFMultiple,
  onCerrarModalPDFMultiple,

  // Props para ranking de ventas
  onGenerarRankingVentas,
  generandoRanking = false,
  mostrarModalRanking = false,
  pdfURLRanking = null,
  nombreArchivoRanking = '',
  tituloModalRanking = 'Ranking de Ventas Generado',
  subtituloModalRanking = '',
  onDescargarRanking,
  onCompartirRanking,
  onCerrarModalRanking,
  
  ventasSeleccionadasCompletas = []
}) {
  const tieneFacturasTipoX = ventasSeleccionadasCompletas.some(venta => {
    const tipoF = (venta.tipo_f || '').toString().trim().toUpperCase();
    return tipoF === 'X';
  });
  
  const todasSonTipoX = ventasSeleccionadasCompletas.length > 0 && 
                        ventasSeleccionadasCompletas.every(venta => {
                          const tipoF = (venta.tipo_f || '').toString().trim().toUpperCase();
                          return tipoF === 'X';
                        });
  
  const ventasSinCAE = ventasSeleccionadasCompletas.filter(venta => !venta.cae_id);
  const todasTienenCAE = ventasSeleccionadasCompletas.length > 0 && ventasSinCAE.length === 0;

  const count = selectedVentas.length;
  const haySeleccion = count > 0;

  return (
    <>
      {/* Etapa 3: Barra de acciones con resumen y transiciones */}
      <div
        className={`mt-6 rounded-xl border-2 transition-all duration-200 ${
          haySeleccion ? 'bg-blue-50/80 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="px-4 py-3 sm:px-5 sm:py-4">
          {/* Resumen de selección */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            {haySeleccion ? (
              <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold tabular-nums">
                  {count}
                </span>
                ventas seleccionadas — Imprimir, solicitar CAE o generar ranking
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Selecciona ventas en la tabla para imprimir facturas, solicitar CAE o generar el ranking.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
              {/* RANKING VENTAS */}
              <BotonGenerarPDFUniversal
                onGenerar={onGenerarRankingVentas}
                loading={generandoRanking}
                texto="RANKING VENTAS"
                className={`${btnBase} bg-orange-600 hover:bg-orange-700 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={!haySeleccion || generandoRanking}
                icono="📊"
              />

              {/* SOLICITAR CAE */}
              <div className="relative">
                <button 
                  className={`${btnBase} ${
                    solicitando || todasSonTipoX || todasTienenCAE
                      ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                      : tieneFacturasTipoX
                      ? 'bg-amber-500 hover:bg-amber-600 hover:shadow-md text-white'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md text-white'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                  onClick={onSolicitarCAE}
                  disabled={!haySeleccion || solicitando || todasSonTipoX || todasTienenCAE}
                  title={
                    todasSonTipoX 
                      ? 'Las facturas tipo X no requieren CAE' 
                      : todasTienenCAE
                      ? 'Todas las ventas seleccionadas ya tienen CAE'
                      : tieneFacturasTipoX
                      ? 'Algunas facturas son tipo X y no requieren CAE'
                      : 'Solicitar CAE para las ventas seleccionadas'
                  }
                >
                  {solicitando ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      SOLICITANDO...
                    </span>
                  ) : todasSonTipoX ? (
                    <span className="flex items-center gap-2">🚫 TIPO X — SIN CAE</span>
                  ) : todasTienenCAE ? (
                    <span className="flex items-center gap-2">✅ YA TIENEN CAE ({count})</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {tieneFacturasTipoX && '⚠️ '}
                      SOLICITAR CAE ({ventasSinCAE.length}
                      {tieneFacturasTipoX ? ` de ${count})` : ')'}
                    </span>
                  )}
                </button>
                {tieneFacturasTipoX && !todasSonTipoX && (
                  <p className="absolute -bottom-6 left-0 right-0 text-center text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 mt-1">
                    Facturas tipo X serán omitidas
                  </p>
                )}
              </div>

              {/* IMPRIMIR */}
              <BotonGenerarPDFUniversal
                onGenerar={onImprimirMultiple}
                loading={imprimiendo}
                texto={haySeleccion ? `IMPRIMIR (${count})` : 'IMPRIMIR'}
                className={`${btnBase} bg-purple-600 hover:bg-purple-700 hover:shadow-md text-white disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={!haySeleccion || imprimiendo}
              />

              {/* VOLVER AL MENÚ */}
              <button
                type="button"
                className={`${btnBase} bg-gray-600 hover:bg-gray-700 hover:shadow-md text-white`}
                onClick={onVolverMenu}
                aria-label="Volver al menú"
              >
                Volver al Menú
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal PDF para impresiones múltiples */}
      <ModalPDFUniversal
        mostrar={mostrarModalPDFMultiple}
        pdfURL={pdfURLMultiple}
        nombreArchivo={nombreArchivoMultiple}
        titulo={tituloModalMultiple}
        subtitulo={subtituloModalMultiple}
        onDescargar={onDescargarPDFMultiple}
        onCompartir={onCompartirPDFMultiple}
        onCerrar={onCerrarModalPDFMultiple}
        zIndex={60}
      />

      {/* Modal PDF para ranking de ventas */}
      <ModalPDFUniversal
        mostrar={mostrarModalRanking}
        pdfURL={pdfURLRanking}
        nombreArchivo={nombreArchivoRanking}
        titulo={tituloModalRanking}
        subtitulo={subtituloModalRanking}
        onDescargar={onDescargarRanking}
        onCompartir={onCompartirRanking}
        onCerrar={onCerrarModalRanking}
        zIndex={70}
      />
    </>
  );
}