// hooks/ventas/useSolicitarCAE.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

/**
 * Hook para solicitar CAE de ARCA/AFIP
 * Versión mejorada para el microservicio integrado
 */
export function useSolicitarCAE() {
  const [solicitando, setSolicitando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Solicitar CAE para una venta específica
   * @param {number} ventaId - ID de la venta
   * @returns {Promise<Object>} Resultado con CAE y datos de facturación
   */
  const solicitarCAE = async (ventaId) => {
    console.log(`📋 Solicitando CAE para venta ${ventaId}...`);
    
    setSolicitando(true);
    setError(null);
    setResultado(null);

    try {
      // Llamada al endpoint que conecta ventas con ARCA
      const response = await axiosAuth.post('/arca/solicitar-cae', {
        ventaId: ventaId
      });

      if (response.data.success) {
        const { data } = response.data;
        
        console.log('✅ CAE obtenido exitosamente:', {
          cae: data.autorizacion.cae,
          vencimiento: data.autorizacion.fechaVencimiento,
          comprobante: data.comprobante.numero,
          total: data.importes.total
        });
        
        setResultado(data);
        
        // Toast con información detallada del CAE
        toast.success(
          <div className="space-y-1">
            <div className="font-bold">✅ Factura Electrónica Autorizada</div>
            <div className="text-sm">
              <span className="font-semibold">CAE:</span> {data.autorizacion.cae}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Vence:</span> {data.autorizacion.fechaVencimiento}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Comprobante:</span> {
                `${String(data.comprobante.puntoVenta).padStart(4, '0')}-${String(data.comprobante.numero).padStart(8, '0')}`
              }
            </div>
          </div>,
          { duration: 6000 }
        );
        
        return { success: true, data };
      } else {
        throw new Error(response.data.message || 'Error desconocido al obtener CAE');
      }
      
    } catch (err) {
      console.error('❌ Error solicitando CAE:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al solicitar CAE';
      const errorDetalles = err.response?.data?.error || err.response?.data?.details || '';
      
      setError({
        message: errorMessage,
        detalles: errorDetalles,
        ventaId: ventaId
      });
      
      // Toast de error detallado con información útil
      toast.error(
        <div className="space-y-1">
          <div className="font-bold">❌ Error solicitando CAE</div>
          <div className="text-sm">{errorMessage}</div>
          {errorDetalles && (
            <div className="text-xs mt-1 text-gray-300 max-w-sm break-words">
              {errorDetalles}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2">
            Venta ID: {ventaId}
          </div>
        </div>,
        { duration: 8000 }
      );
      
      return { 
        success: false, 
        error: errorMessage,
        detalles: errorDetalles
      };
      
    } finally {
      setSolicitando(false);
    }
  };

  /**
   * Solicitar CAE para múltiples ventas en lote
   * @param {Array<number>} ventasIds - Array de IDs de ventas
   * @returns {Promise<Object>} Resumen de resultados
   */
  const solicitarCAEMultiple = async (ventasIds) => {
    if (!ventasIds || ventasIds.length === 0) {
      toast.error('No hay ventas seleccionadas');
      return { success: false, error: 'No hay ventas para procesar' };
    }

    console.log(`📋 Solicitando CAE para ${ventasIds.length} venta${ventasIds.length > 1 ? 's' : ''}...`);
    
    setSolicitando(true);
    setError(null);
    
    const resultados = {
      exitosos: [],
      fallidos: []
    };

    // Toast de progreso
    const toastId = toast.loading(
      `Procesando 0 de ${ventasIds.length} ventas...`
    );

    try {
      // Procesar una por una para tener control detallado
      for (let i = 0; i < ventasIds.length; i++) {
        const ventaId = ventasIds[i];
        
        // Actualizar toast de progreso
        toast.loading(
          `Procesando ${i + 1} de ${ventasIds.length} ventas...`,
          { id: toastId }
        );
        
        try {
          const resultado = await solicitarCAE(ventaId);
          
          if (resultado.success) {
            resultados.exitosos.push({
              ventaId,
              cae: resultado.data.autorizacion.cae,
              numeroComprobante: resultado.data.comprobante.numero,
              total: resultado.data.importes.total
            });
            
            console.log(`✅ Venta ${ventaId}: CAE obtenido`);
          } else {
            resultados.fallidos.push({
              ventaId,
              error: resultado.error || 'Error desconocido',
              detalles: resultado.detalles
            });
            
            console.log(`❌ Venta ${ventaId}: Error - ${resultado.error}`);
          }
          
          // Pequeña pausa entre requests para no saturar
          if (i < ventasIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
        } catch (err) {
          resultados.fallidos.push({
            ventaId,
            error: err.message || 'Error inesperado'
          });
          console.error(`❌ Venta ${ventaId}: Excepción - ${err.message}`);
        }
      }

      // Cerrar toast de progreso
      toast.dismiss(toastId);

      // Resumen final
      const totalExitosos = resultados.exitosos.length;
      const totalFallidos = resultados.fallidos.length;
      
      console.log(`\n📊 RESUMEN FINAL:`);
      console.log(`   ✅ Exitosos: ${totalExitosos}`);
      console.log(`   ❌ Fallidos: ${totalFallidos}`);
      console.log(`   📈 Total procesado: ${ventasIds.length}`);
      
      // Mostrar resumen con toast apropiado
      if (totalExitosos === ventasIds.length) {
        // Todas exitosas
        toast.success(
          <div>
            <div className="font-bold">✅ Proceso completado</div>
            <div className="text-sm">
              {totalExitosos} factura{totalExitosos > 1 ? 's' : ''} autorizada{totalExitosos > 1 ? 's' : ''} correctamente
            </div>
          </div>,
          { duration: 5000 }
        );
      } else if (totalFallidos === ventasIds.length) {
        // Todas fallidas
        toast.error(
          <div>
            <div className="font-bold">❌ Proceso completado con errores</div>
            <div className="text-sm">
              No se pudo autorizar ninguna factura
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        // Mixto
        toast(
          <div>
            <div className="font-bold">⚠️ Proceso completado parcialmente</div>
            <div className="text-sm space-y-1">
              <div>✅ Exitosas: {totalExitosos}</div>
              <div>❌ Con error: {totalFallidos}</div>
            </div>
          </div>,
          { 
            duration: 6000,
            icon: '⚠️'
          }
        );
      }
      
      return {
        success: totalExitosos > 0,
        resultados,
        resumen: {
          total: ventasIds.length,
          exitosos: totalExitosos,
          fallidos: totalFallidos,
          porcentajeExito: Math.round((totalExitosos / ventasIds.length) * 100)
        }
      };
      
    } catch (err) {
      console.error('❌ Error crítico en solicitud múltiple:', err);
      toast.dismiss(toastId);
      toast.error(
        <div>
          <div className="font-bold">❌ Error crítico</div>
          <div className="text-sm">Error procesando solicitudes múltiples</div>
        </div>
      );
      return { 
        success: false, 
        error: err.message,
        resultados
      };
    } finally {
      setSolicitando(false);
    }
  };

  /**
   * Verificar salud del servicio ARCA
   * @returns {Promise<Object>} Estado del servicio
   */
  const verificarServicio = async () => {
    try {
      const response = await axiosAuth.get('/arca/health');
      
      if (response.data.success) {
        console.log('✅ Servicio ARCA operativo');
        toast.success('Servicio de facturación electrónica operativo');
        return { success: true, data: response.data.data };
      } else {
        console.warn('⚠️ Servicio ARCA con problemas');
        toast.warning('El servicio de facturación tiene problemas');
        return { success: false };
      }
    } catch (err) {
      console.error('❌ Servicio ARCA no disponible:', err);
      toast.error('Servicio de facturación no disponible');
      return { success: false, error: err.message };
    }
  };

  /**
   * Obtener tipos de comprobantes disponibles
   * @returns {Promise<Object>} Lista de tipos
   */
  const obtenerTiposComprobante = async () => {
    try {
      const response = await axiosAuth.get('/arca/tipos-comprobante');
      return response.data;
    } catch (err) {
      console.error('Error obteniendo tipos de comprobante:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Obtener puntos de venta disponibles
   * @returns {Promise<Object>} Lista de puntos de venta
   */
  const obtenerPuntosVenta = async () => {
    try {
      const response = await axiosAuth.get('/arca/puntos-venta');
      return response.data;
    } catch (err) {
      console.error('Error obteniendo puntos de venta:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Limpiar estado del hook
   */
  const limpiar = () => {
    setResultado(null);
    setError(null);
  };

  return {
    // Métodos principales
    solicitarCAE,
    solicitarCAEMultiple,
    verificarServicio,
    
    // Métodos auxiliares
    obtenerTiposComprobante,
    obtenerPuntosVenta,
    limpiar,
    
    // Estados
    solicitando,
    resultado,
    error,
    
    // Información útil del resultado
    cae: resultado?.autorizacion?.cae,
    fechaVencimiento: resultado?.autorizacion?.fechaVencimiento,
    numeroComprobante: resultado?.comprobante?.numero,
    tieneResultado: !!resultado,
    tieneError: !!error
  };
}

export default useSolicitarCAE;