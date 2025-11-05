import { ModalPDFUniversal, BotonGenerarPDFUniversal } from '../shared/ModalPDFUniversal';

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
  
  // ✅ NUEVA PROP: Ventas completas para verificar tipo
  ventasSeleccionadasCompletas = []
}) {
  
  // ✅ NUEVA LÓGICA: Verificar si hay facturas tipo X
  const tieneFacturasTipoX = ventasSeleccionadasCompletas.some(venta => {
    const tipoF = (venta.tipo_f || '').toString().trim().toUpperCase();
    return tipoF === 'X';
  });
  
  // ✅ NUEVA LÓGICA: Verificar si TODAS son tipo X
  const todasSonTipoX = ventasSeleccionadasCompletas.length > 0 && 
                        ventasSeleccionadasCompletas.every(venta => {
                          const tipoF = (venta.tipo_f || '').toString().trim().toUpperCase();
                          return tipoF === 'X';
                        });
  
  // ✅ NUEVA LÓGICA: Verificar si hay facturas que ya tienen CAE
  const ventasSinCAE = ventasSeleccionadasCompletas.filter(venta => !venta.cae_id);
  const todasTienenCAE = ventasSeleccionadasCompletas.length > 0 && ventasSinCAE.length === 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        {/* Botón RANKING VENTAS - A la izquierda */}
        <div className="flex justify-start">
          <BotonGenerarPDFUniversal
            onGenerar={onGenerarRankingVentas}
            loading={generandoRanking}
            texto="RANKING VENTAS"
            className="bg-orange-600 hover:bg-orange-800 px-6 py-2"
            disabled={selectedVentas.length === 0 || generandoRanking}
            icono="📊"
          />
        </div>

        {/* Botones de la derecha */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* ✅ BOTÓN SOLICITAR CAE MEJORADO */}
          <div className="relative">
            <button 
              className={`px-6 py-2 rounded text-white font-semibold transition-colors ${
                solicitando || todasSonTipoX || todasTienenCAE
                  ? "bg-gray-400 cursor-not-allowed" 
                  : tieneFacturasTipoX
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-blue-600 hover:bg-blue-800"
              }`}
              onClick={onSolicitarCAE}
              disabled={selectedVentas.length === 0 || solicitando || todasSonTipoX || todasTienenCAE}
              title={
                todasSonTipoX 
                  ? "Las facturas tipo X no requieren CAE" 
                  : todasTienenCAE
                  ? "Todas las ventas seleccionadas ya tienen CAE"
                  : tieneFacturasTipoX
                  ? "Algunas facturas son tipo X y no requieren CAE"
                  : "Solicitar CAE para las ventas seleccionadas"
              }
            >
              {solicitando ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SOLICITANDO...
                </div>
              ) : todasSonTipoX ? (
                <div className="flex items-center justify-center gap-2">
                  <span>🚫</span>
                  <span>TIPO X - SIN CAE</span>
                </div>
              ) : todasTienenCAE ? (
                <div className="flex items-center justify-center gap-2">
                  <span>✅</span>
                  <span>YA TIENEN CAE ({selectedVentas.length})</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {tieneFacturasTipoX && <span className="text-yellow-200">⚠️</span>}
                  <span>
                    SOLICITAR CAE ({ventasSinCAE.length})
                    {tieneFacturasTipoX && ` de ${selectedVentas.length}`}
                  </span>
                </div>
              )}
            </button>
            
            {/* ✅ TOOLTIP DE ADVERTENCIA */}
            {tieneFacturasTipoX && !todasSonTipoX && (
              <div className="absolute -bottom-8 left-0 right-0 text-center">
                <p className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                  ⚠️ Facturas tipo X serán omitidas
                </p>
              </div>
            )}
          </div>
          
          {/* Botón IMPRIMIR */}
          <BotonGenerarPDFUniversal
            onGenerar={onImprimirMultiple}
            loading={imprimiendo}
            texto={`IMPRIMIR (${selectedVentas.length})`}
            className="bg-purple-600 hover:bg-purple-800 px-6 py-2"
            disabled={selectedVentas.length === 0 || imprimiendo}
          />
          
          {/* Botón VOLVER */}
          <button 
            className="bg-red-600 hover:bg-red-800 px-6 py-2 rounded text-white font-semibold"
            onClick={onVolverMenu}
          >
            Volver al Menú
          </button>
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