// components/pedidos/ModalFacturacion.jsx - ✅ CON VALIDACIÓN DE CONDICIÓN IVA
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ModalBase from '../common/ModalBase';
import LoadingButton from '../common/LoadingButton';
import { Z_INDEX } from '../../constants/zIndex';
import { roundFacturacion } from '../../utils/rounding';

// ✅ MODAL DE DESCUENTOS (sin cambios)
export function ModalDescuentos({
  mostrar, 
  onClose, 
  onAplicarDescuento, 
  subtotalSinIva = 0, 
  ivaTotal = 0, 
  totalConIva = 0 
}) {
  const [tipoDescuento, setTipoDescuento] = useState('numerico');
  const [valorDescuento, setValorDescuento] = useState('');
  const [descuentoCalculado, setDescuentoCalculado] = useState(0);

  useEffect(() => {
    if (!valorDescuento || valorDescuento === '') {
      setDescuentoCalculado(0);
      return;
    }

    const valor = parseFloat(valorDescuento) || 0;
    
    if (tipoDescuento === 'numerico') {
      setDescuentoCalculado(Math.min(valor, totalConIva || 0));
    } else {
      const porcentaje = Math.min(Math.max(valor, 0), 100);
      setDescuentoCalculado(((subtotalSinIva || 0) * porcentaje) / 100);
    }
  }, [valorDescuento, tipoDescuento, subtotalSinIva, totalConIva]);

  const handleAplicar = () => {
    if (descuentoCalculado > 0) {
      onAplicarDescuento({
        tipo: tipoDescuento,
        valor: parseFloat(valorDescuento) || 0,
        descuentoCalculado: descuentoCalculado
      });
    }
    onClose();
  };

  const limpiarFormulario = () => {
    setTipoDescuento('numerico');
    setValorDescuento('');
    setDescuentoCalculado(0);
  };

  const handleClose = () => {
    limpiarFormulario();
    onClose();
  };

  if (!mostrar) return null;

  const nuevoTotal = roundFacturacion((totalConIva || 0) - descuentoCalculado);

  return (
    <ModalBase
      isOpen={mostrar}
      onClose={handleClose}
      title="Aplicar Descuento"
      size="sm"
      closeOnOverlay
      closeOnEscape
      zIndex={Z_INDEX.MODAL_NESTED}
      panelClassName="max-w-xs sm:max-w-md p-4 sm:p-6"
      showHeader={false}
    >
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-center">Aplicar Descuento</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de descuento:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoDescuento"
                  value="numerico"
                  checked={tipoDescuento === 'numerico'}
                  onChange={(e) => setTipoDescuento(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">💰 Descuento numérico (en pesos)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoDescuento"
                  value="porcentaje"
                  checked={tipoDescuento === 'porcentaje'}
                  onChange={(e) => setTipoDescuento(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">📊 Descuento porcentual (% sobre subtotal)</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tipoDescuento === 'numerico' ? 'Monto a descontar ($):' : 'Porcentaje (1-100%):'}
            </label>
            <div className="flex items-center">
              {tipoDescuento === 'numerico' && <span className="mr-2 text-gray-600">$</span>}
              <input
                type="number"
                value={valorDescuento}
                onChange={(e) => setValorDescuento(e.target.value)}
                min="0"
                max={tipoDescuento === 'numerico' ? (totalConIva || 0) : 100}
                step={tipoDescuento === 'numerico' ? '0.01' : '1'}
                className="border p-2 rounded w-full text-sm"
                placeholder={tipoDescuento === 'numerico' ? '0.00' : '0'}
              />
              {tipoDescuento === 'porcentaje' && <span className="ml-2 text-gray-600">%</span>}
            </div>
            {tipoDescuento === 'porcentaje' && (
              <p className="text-xs text-gray-500 mt-1">
                Se aplicará sobre el subtotal (importe neto): ${(subtotalSinIva || 0).toFixed(2)}
              </p>
            )}
          </div>

          {descuentoCalculado > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-medium text-sm mb-2">Vista previa del descuento:</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal (neto):</span>
                  <span>${(subtotalSinIva || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>${(ivaTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total original:</span>
                  <span>${(totalConIva || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-${descuentoCalculado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Total final:</span>
                  <span className="text-green-600">${nuevoTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <LoadingButton
              onClick={handleAplicar}
              disabled={!valorDescuento || valorDescuento === '' || parseFloat(valorDescuento) <= 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors text-sm w-full sm:w-auto"
            >
              Aplicar Descuento
            </LoadingButton>
            <button
              onClick={handleClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm w-full sm:w-auto"
            >
              Cancelar
            </button>
          </div>
    </ModalBase>
  );
}

// ✅ MODAL DE FACTURACIÓN - CON VALIDACIÓN DE CONDICIÓN IVA Y PROTECCIÓN CONTRA DOBLE CLIC
export function ModalFacturacion({ 
  mostrar, 
  onClose, 
  pedido,
  productos,
  onConfirmarFacturacion,
  loading = false // ✅ Prop para estado de carga desde el hook
}) {
  const [tipoFiscal, setTipoFiscal] = useState('A');
  const [subtotalSinIva, setSubtotalSinIva] = useState(0);
  const [ivaTotal, setIvaTotal] = useState(0);
  const [totalConIva, setTotalConIva] = useState(0);
  const [mostrarModalDescuentos, setMostrarModalDescuentos] = useState(false);
  const [descuentoAplicado, setDescuentoAplicado] = useState(null);
  const [procesando, setProcesando] = useState(false); // ✅ Estado local para bloqueo inmediato
  const [totalEditadoManual, setTotalEditadoManual] = useState(null); // ✅ Total final editado por el usuario (null = usar calculado)
  const [editandoTotalFinal, setEditandoTotalFinal] = useState(false);
  const [totalFinalTemp, setTotalFinalTemp] = useState('');

  // ✅ FUNCIÓN: Determinar tipo fiscal según condición IVA
  const determinarTipoFiscal = (condicionIva) => {
    if (!condicionIva || typeof condicionIva !== 'string') {
      return 'B';
    }

    const condicion = condicionIva.trim();
    
    switch (condicion) {
      case 'Responsable Inscripto':
      case 'Monotributo':
        return 'A';
      case 'Consumidor Final':
      case 'Exento':
        return 'B';
      default:
        return 'B';
    }
  };

  // ✅ FUNCIÓN: Verificar si una opción debe estar habilitada
  const esTipoFiscalPermitido = (tipo) => {
    // X siempre está habilitado
    if (tipo === 'X') return true;
    
    // El tipo fiscal correcto según la condición IVA está habilitado
    const tipoCorrectoPorIVA = determinarTipoFiscal(pedido?.cliente_condicion);
    return tipo === tipoCorrectoPorIVA;
  };

  // ✅ Inicializar valores cuando se abre el modal (con redondeo ,01–,59 mantienen; ,60–,99 suben)
  useEffect(() => {
    if (mostrar && productos && productos.length > 0 && pedido?.cliente_condicion !== undefined) {
      const subtotal = productos.reduce((acc, prod) => acc + (Number(prod.subtotal) || 0), 0);
      const iva = productos.reduce((acc, prod) => acc + (Number(prod.iva) || 0), 0);
      const total = subtotal + iva;

      setSubtotalSinIva(roundFacturacion(subtotal));
      setIvaTotal(roundFacturacion(iva));
      setTotalConIva(roundFacturacion(total));
      setDescuentoAplicado(null);
      setTotalEditadoManual(null);
      
      setTimeout(() => {
        const tipoFiscalAuto = determinarTipoFiscal(pedido.cliente_condicion);
        setTipoFiscal(tipoFiscalAuto);
      }, 50);
    }
  }, [mostrar, productos, pedido?.cliente_condicion]);

  const handleAplicarDescuento = (descuento) => {
    setDescuentoAplicado(descuento);
    setTotalEditadoManual(null);
  };

  const limpiarDescuento = () => {
    setDescuentoAplicado(null);
    setTotalEditadoManual(null);
  };

  const handleConfirmar = async () => {
    // ✅ BLOQUEO INMEDIATO DEL BOTÓN (antes de cualquier async)
    if (procesando || loading) {
      console.log('⚠️ Facturación ya en proceso, ignorando click');
      return;
    }

    setProcesando(true); // ✅ Deshabilitar inmediatamente

    try {
      const cuentaId = tipoFiscal === 'X' ? 2 : 1;

      const totalOriginal = subtotalSinIva + ivaTotal;
      const descuentoMonto = descuentoAplicado?.descuentoCalculado || 0;
      const totalFinalCalculado = roundFacturacion(totalOriginal - descuentoMonto);
      const totalAEnviar = totalEditadoManual !== null ? totalEditadoManual : totalFinalCalculado;

      const datosFacturacion = {
        cuentaId: cuentaId,
        tipoFiscal,
        subtotalSinIva,
        ivaTotal,
        totalConIva: totalAEnviar,
        descuentoAplicado
      };

      await onConfirmarFacturacion(datosFacturacion);
    } catch (error) {
      console.error('Error en handleConfirmar:', error);
    } finally {
      // ✅ Solo resetear si no hay loading del hook (el hook maneja su propio estado)
      // El reset final lo hace el componente padre cuando cierra el modal
      if (!loading) {
        setProcesando(false);
      }
    }
  };

  const limpiarFormulario = () => {
    setTipoFiscal('A');
    setSubtotalSinIva(0);
    setIvaTotal(0);
    setTotalConIva(0);
    setDescuentoAplicado(null);
    setProcesando(false);
    setTotalEditadoManual(null);
    setEditandoTotalFinal(false);
    setTotalFinalTemp('');
  };

  const handleClose = () => {
    limpiarFormulario();
    onClose();
  };

  // ✅ Resetear estado de procesamiento cuando el modal se cierra o loading cambia
  useEffect(() => {
    if (!mostrar) {
      setProcesando(false);
    }
    if (!loading && procesando) {
      // Si el loading del hook terminó pero procesando sigue activo, resetearlo
      setProcesando(false);
    }
  }, [mostrar, loading, procesando]);

  if (!mostrar) return null;

  const totalOriginal = subtotalSinIva + ivaTotal;
  const descuentoMonto = descuentoAplicado?.descuentoCalculado || 0;
  const totalFinalConDescuento = roundFacturacion(totalOriginal - descuentoMonto);
  const totalFinalDisplay = totalEditadoManual !== null ? totalEditadoManual : totalFinalConDescuento;

  const guardarTotalEditado = () => {
    const n = Number(totalFinalTemp);
    if (Number.isFinite(n) && n >= 0) {
      setTotalEditadoManual(Math.round(n));
      toast.success('Total actualizado');
    } else {
      toast.error('Ingrese un total válido');
    }
    setEditandoTotalFinal(false);
    setTotalFinalTemp('');
  };

  const cancelarEdicionTotal = () => {
    setEditandoTotalFinal(false);
    setTotalFinalTemp('');
  };
  
  // ✅ Determinar el tipo fiscal correcto según la condición IVA
  const tipoFiscalCorrecto = determinarTipoFiscal(pedido?.cliente_condicion);

  return (
    <>
      <ModalBase
        isOpen={mostrar}
        onClose={handleClose}
        title={`Facturar Pedido #${pedido?.id}`}
        size="2xl"
        closeOnOverlay
        closeOnEscape
        loading={procesando || loading}
        zIndex={Z_INDEX.MODAL_BASE}
        panelClassName="w-full max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[95vh] p-4 sm:p-6"
        showHeader={false}
      >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                Facturar Pedido #{pedido?.id}
              </h2>
              <button 
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-xl p-1 min-h-[44px] min-w-[44px] transition-transform active:scale-95"
                aria-label="Cerrar facturación de pedido"
              >
                ✕
              </button>
            </div>
            
            {/* Información del pedido */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Información del Pedido</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span> {pedido?.cliente_nombre}
                </div>
                <div>
                  <span className="font-medium">Productos:</span> {productos?.length || 0}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-medium">Condición IVA:</span> 
                  <span className="ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    {pedido?.cliente_condicion || 'No especificada'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* ✅ SELECT CON OPCIONES DESHABILITADAS SEGÚN CONDICIÓN IVA */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Fiscal *
              </label>
              <select
                value={tipoFiscal}
                onChange={(e) => setTipoFiscal(e.target.value)}
                className="border p-2 rounded w-full text-sm font-medium"
                required
              >
                <option 
                  value="A" 
                  disabled={!esTipoFiscalPermitido('A')}
                  className={!esTipoFiscalPermitido('A') ? 'text-gray-400 bg-gray-100' : ''}
                >
                  A - {pedido.cliente_condicion}
                  {!esTipoFiscalPermitido('A') && ' (No corresponde según condición IVA)'}
                </option>
                <option 
                  value="B" 
                  disabled={!esTipoFiscalPermitido('B')}
                  className={!esTipoFiscalPermitido('B') ? 'text-gray-400 bg-gray-100' : ''}
                >
                  B - {pedido.cliente_condicion}
                  {!esTipoFiscalPermitido('B') && ' (No corresponde según condición IVA)'}
                </option>
                <option value="X">
                  X
                </option>
              </select>
              
              
            </div>
            
            {/* Sección de descuentos */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">Descuentos (Opcional)</h3>
                <button
                  onClick={() => setMostrarModalDescuentos(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Aplicar Descuento
                </button>
              </div>
              {descuentoAplicado ? (
                <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        Descuento aplicado:
                      </p>
                      <p className="text-sm text-yellow-700">
                        {descuentoAplicado.tipo === 'numerico' 
                          ? `Descuento fijo: $${descuentoAplicado.descuentoCalculado.toFixed(2)}`
                          : `${descuentoAplicado.valor}% sobre subtotal: $${descuentoAplicado.descuentoCalculado.toFixed(2)}`
                        }
                      </p>
                    </div>
                    <button
                      onClick={limpiarDescuento}
                      className="text-red-600 hover:text-red-800 text-sm ml-2"
                      title="Quitar descuento"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No hay descuentos aplicados</p>
              )}
            </div>
            
            {/* Resumen final */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Resumen Final</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotalSinIva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>${ivaTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total original:</span>
                  <span>${totalOriginal.toFixed(2)}</span>
                </div>
                {descuentoAplicado && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-${descuentoMonto.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-1 items-center gap-2">
                  <span>Total Final:</span>
                  {editandoTotalFinal ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-600">$</span>
                      <input
                        type="number"
                        value={totalFinalTemp}
                        onChange={(e) => setTotalFinalTemp(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarTotalEditado();
                          if (e.key === 'Escape') cancelarEdicionTotal();
                        }}
                        min="0"
                        step="1"
                        className="border border-green-500 rounded px-2 py-1 w-24 text-right text-green-600 font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={guardarTotalEditado}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicionTotal}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">${totalFinalDisplay.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTotalFinalTemp(String(totalFinalDisplay));
                          setEditandoTotalFinal(true);
                        }}
                        className="p-1 rounded hover:bg-green-100 text-gray-600 hover:text-green-700 transition-colors"
                        title="Editar total final"
                        aria-label="Editar total final"
                      >
                        <span role="img" aria-hidden>✏️</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <LoadingButton
                onClick={handleConfirmar}
                loading={procesando || loading}
                loadingText="Facturando..."
                className={`${
                  procesando || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full sm:w-1/2 flex items-center justify-center`}
              >
                CONFIRMAR FACTURACIÓN
              </LoadingButton>
              <button
                onClick={handleClose}
                disabled={procesando || loading}
                className={`${
                  procesando || loading
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full sm:w-1/2`}
              >
                CANCELAR
              </button>
            </div>
      </ModalBase>
       
      {/* Modal de descuentos */}
      {mostrarModalDescuentos && (
        <ModalDescuentos 
          mostrar={mostrarModalDescuentos} 
          onClose={() => setMostrarModalDescuentos(false)} 
          onAplicarDescuento={handleAplicarDescuento}
          subtotalSinIva={subtotalSinIva}
          ivaTotal={ivaTotal}
          totalConIva={totalOriginal}
        />
      )}
    </>
  );
}

export default ModalFacturacion;