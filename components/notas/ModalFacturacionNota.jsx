// components/notas/ModalFacturacionNota.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import ModalBase from '../common/ModalBase';
import { Z_INDEX } from '../../constants/zIndex';

export function ModalFacturacionNota({ 
  mostrar, 
  onClose, 
  tipoNota,
  cliente,
  productos,
  onConfirmarNota
}) {
  const [tipoFiscal, setTipoFiscal] = useState('A');
  const [subtotalSinIva, setSubtotalSinIva] = useState(0);
  const [ivaTotal, setIvaTotal] = useState(0);
  const [montoExento, setMontoExento] = useState(0);
  const [totalConIva, setTotalConIva] = useState(0);
  const [cuentas, setCuentas] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);

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
    if (tipo === 'X') return true;
    const tipoCorrectoPorIVA = determinarTipoFiscal(cliente?.condicion_iva);
    return tipo === tipoCorrectoPorIVA;
  };

  // Cargar cuentas
  useEffect(() => {
    const cargarCuentas = async () => {
      setCargandoCuentas(true);
      try {
        const response = await axiosAuth.get('/ventas/cuentas-fondos');
        if (response.data.success) {
          setCuentas(response.data.data || []);
        }
      } catch (error) {
        console.error('Error cargando cuentas:', error);
      } finally {
        setCargandoCuentas(false);
      }
    };

    if (mostrar) {
      cargarCuentas();
    }
  }, [mostrar]);

  // Inicializar valores cuando se abre el modal
  useEffect(() => {
    if (mostrar && productos && productos.length > 0 && cliente?.condicion_iva !== undefined) {
      const subtotal = productos.reduce((acc, prod) => acc + (Number(prod.subtotal) || 0), 0);
      const iva = productos.reduce((acc, prod) => acc + (Number(prod.iva_calculado) || 0), 0);
      const total = subtotal + iva;
      
      // Calcular monto exento
      const esClienteExento = cliente?.condicion_iva?.toUpperCase() === 'EXENTO';
      const montoExento = esClienteExento 
        ? productos.reduce((acc, prod) => {
            const porcentajeIva = prod.porcentaje_iva || 21;
            const ivaQueDeberiaCobrarse = parseFloat((prod.subtotal * (porcentajeIva / 100)).toFixed(2));
            return acc + ivaQueDeberiaCobrarse;
          }, 0)
        : 0;

      setSubtotalSinIva(subtotal);
      setIvaTotal(iva);
      setMontoExento(montoExento);
      setTotalConIva(total);
      
      setTimeout(() => {
        const tipoFiscalAuto = determinarTipoFiscal(cliente.condicion_iva);
        setTipoFiscal(tipoFiscalAuto);
      }, 50);
    }
  }, [mostrar, productos, cliente?.condicion_iva]);

  const handleConfirmar = async () => {
    // ✅ Determinar cuenta según tipo fiscal (1=ARCA, 2=X)
    const cuentaId = tipoFiscal === 'X' ? 2 : 1;

    const datosFacturacion = {
      cuentaId: cuentaId,
      tipoFiscal,
      subtotalSinIva,
      ivaTotal,
      exento: montoExento,
      totalConIva: totalConIva
    };

    await onConfirmarNota(datosFacturacion);
  };

  const limpiarFormulario = () => {
    setTipoFiscal('A');
    setSubtotalSinIva(0);
    setIvaTotal(0);
    setMontoExento(0);
    setTotalConIva(0);
  };

  const handleClose = () => {
    limpiarFormulario();
    onClose();
  };

  if (!mostrar) return null;

  const titulo = tipoNota === 'NOTA_DEBITO' ? 'Completar Nota de Débito' : 'Completar Nota de Crédito';

  return (
    <ModalBase
      isOpen={mostrar}
      onClose={handleClose}
      title={titulo}
      size="2xl"
      closeOnOverlay
      closeOnEscape
      zIndex={Z_INDEX.MODAL_NESTED}
      panelClassName="w-full max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[95vh] p-4 sm:p-6"
      showHeader={false}
    >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {titulo}
            </h2>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-xl p-1 min-h-[44px] min-w-[44px] transition-transform active:scale-95"
              aria-label="Cerrar facturación de nota"
            >
              ✕
            </button>
          </div>
          
          {/* Información del cliente */}
          {cliente && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Información del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span> {cliente.nombre || cliente.cliente_nombre}
                </div>
                <div>
                  <span className="font-medium">Productos:</span> {productos?.length || 0}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-medium">Condición IVA:</span> 
                  <span className="ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    {cliente.condicion_iva || 'No especificada'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
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
                A - {cliente?.condicion_iva}
                {!esTipoFiscalPermitido('A') && ' (No corresponde según condición IVA)'}
              </option>
              <option
                value="B"
                disabled={!esTipoFiscalPermitido('B')}
                className={!esTipoFiscalPermitido('B') ? 'text-gray-400 bg-gray-100' : ''}
              >
                B - {cliente?.condicion_iva}
                {!esTipoFiscalPermitido('B') && ' (No corresponde según condición IVA)'}
              </option>
              <option value="X">
                X
              </option>
            </select>
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
              {(montoExento > 0 || cliente?.condicion_iva?.toUpperCase() === 'EXENTO') && (
                <div className="flex justify-between text-blue-600">
                  <span>Monto Exento (IVA no cobrado):</span>
                  <span>${montoExento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-1">
                <span>Total Final:</span>
                <span className="text-green-600">${totalConIva.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleConfirmar}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full sm:w-1/2"
            >
              CONFIRMAR {tipoNota === 'NOTA_DEBITO' ? 'NOTA DE DÉBITO' : 'NOTA DE CRÉDITO'}
            </button>
            <button
              onClick={handleClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full sm:w-1/2"
            >
              CANCELAR
            </button>
          </div>
    </ModalBase>
  );
}

