// context/PedidosContext.js
import { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback } from 'react';
import { roundFacturacion, obtenerPorcentajeIva } from '../utils/rounding';

export const PedidosContext = createContext();

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const loadDraftFromStorage = (draftKey) => {
  if (!draftKey || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft?.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(draftKey);
      return null;
    }
    if (!Array.isArray(draft.productos)) return null;
    return draft;
  } catch {
    return null;
  }
};

const saveDraftToStorage = (draftKey, state) => {
  if (!draftKey || typeof window === 'undefined') return;
  const hasContent =
    Boolean(state.cliente) ||
    state.productos.length > 0 ||
    Boolean(state.observaciones?.trim());

  if (!hasContent) {
    localStorage.removeItem(draftKey);
    return;
  }

  try {
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        cliente: state.cliente,
        productos: state.productos,
        observaciones: state.observaciones
      })
    );
  } catch (error) {
    console.warn('No se pudo guardar borrador de pedido:', error);
  }
};

const removeDraftFromStorage = (draftKey) => {
  if (!draftKey || typeof window === 'undefined') return;
  localStorage.removeItem(draftKey);
};

const normalizarFlagsPrecioProducto = (producto = {}) => ({
  ...producto,
  precio_incluye_iva: Boolean(producto?.precio_incluye_iva),
  precio_unitario_final_manual:
    producto?.precio_unitario_final_manual !== undefined &&
    producto?.precio_unitario_final_manual !== null &&
    !Number.isNaN(Number(producto?.precio_unitario_final_manual))
      ? parseFloat(producto.precio_unitario_final_manual)
      : null
});

const calcularTotalesProducto = ({
  producto,
  cantidad,
  descuentoPorcentaje = 0
}) => {
  const porcentajeIva = obtenerPorcentajeIva(producto);
  const incluyeIva = Boolean(producto?.precio_incluye_iva);

  const precioManualFinal = Number(producto?.precio_unitario_final_manual);
  const precioNetoActual = Number(producto?.precio) || 0;
  const multiplicadorIva = 1 + porcentajeIva / 100;

  const precioNetoUnitario =
    incluyeIva && Number.isFinite(precioManualFinal) && precioManualFinal >= 0
      ? precioManualFinal / multiplicadorIva
      : precioNetoActual;

  const subtotalBase = precioNetoUnitario * cantidad;
  const montoDescuento = (subtotalBase * descuentoPorcentaje) / 100;
  const subtotalConDescuento = parseFloat((subtotalBase - montoDescuento).toFixed(2));
  const ivaCalculado = parseFloat((subtotalConDescuento * (porcentajeIva / 100)).toFixed(2));

  return {
    porcentajeIva,
    precioNetoUnitario: parseFloat(precioNetoUnitario.toFixed(6)),
    subtotalConDescuento,
    ivaCalculado
  };
};

// Reducer para manejar el estado de pedidos
function pedidosReducer(state, action) {
  switch (action.type) {
    case 'SET_CLIENTE':
      // ✅ RECALCULAR IVA DE TODOS LOS PRODUCTOS EN EL CARRITO
      const productosRecalculados = state.productos.map(producto => {
        const nuevoIvaCalculado = parseFloat((producto.subtotal * (producto.porcentaje_iva / 100)).toFixed(2));

        return {
          ...producto,
          iva_calculado: nuevoIvaCalculado
        };
      });

      return {
        ...state,
        cliente: action.payload,
        productos: productosRecalculados
      };
    
    case 'CLEAR_CLIENTE':
      return { ...state, cliente: null };
    
    case 'ADD_PRODUCTO': {
      const cantidadNueva = parseFloat(action.payload.cantidad) || 0.5;
      const esManual = Boolean(action.payload.esManual);

      // Catálogo: acumular por id. Manuales (fletes): siempre línea nueva.
      if (!esManual) {
        const productoExistenteIndex = state.productos.findIndex(
          (p) => !p.esManual && p.id === action.payload.id
        );

        if (productoExistenteIndex !== -1) {
          const productosActualizados = [...state.productos];
          const productoExistente = productosActualizados[productoExistenteIndex];
          const nuevaCantidadTotal = parseFloat(productoExistente.cantidad) + cantidadNueva;

          const descuentoPorcentaje = productoExistente.descuento_porcentaje || 0;
          const {
            precioNetoUnitario,
            subtotalConDescuento,
            ivaCalculado
          } = calcularTotalesProducto({
            producto: productoExistente,
            cantidad: nuevaCantidadTotal,
            descuentoPorcentaje
          });

          productosActualizados[productoExistenteIndex] = {
            ...productoExistente,
            cantidad: nuevaCantidadTotal,
            precio: precioNetoUnitario,
            subtotal: subtotalConDescuento,
            iva_calculado: ivaCalculado
          };

          return {
            ...state,
            productos: productosActualizados
          };
        }
      }

      const productoNormalizado = normalizarFlagsPrecioProducto(action.payload);
      const {
        porcentajeIva,
        precioNetoUnitario,
        subtotalConDescuento,
        ivaCalculado
      } = calcularTotalesProducto({
        producto: productoNormalizado,
        cantidad: cantidadNueva,
        descuentoPorcentaje: parseFloat(action.payload.descuento_porcentaje || 0)
      });

      const nuevoProducto = {
        id: action.payload.id,
        nombre: action.payload.nombre,
        unidad_medida: action.payload.unidad_medida || 'Unidad',
        cantidad: cantidadNueva,
        precio: precioNetoUnitario,
        porcentaje_iva: porcentajeIva,
        iva_calculado: ivaCalculado,
        subtotal: subtotalConDescuento,
        descuento_porcentaje: parseFloat(action.payload.descuento_porcentaje || 0),
        esManual,
        precio_incluye_iva: Boolean(action.payload.precio_incluye_iva),
        precio_unitario_final_manual:
          action.payload.precio_unitario_final_manual !== undefined &&
          action.payload.precio_unitario_final_manual !== null &&
          !Number.isNaN(Number(action.payload.precio_unitario_final_manual))
            ? parseFloat(action.payload.precio_unitario_final_manual)
            : null
      };

      return {
        ...state,
        productos: [...state.productos, nuevoProducto]
      };
    }
    
    case 'ADD_MULTIPLE_PRODUCTOS': {
      let productosActualizados = [...state.productos];

      for (const producto of action.payload) {
        const productoNormalizado = normalizarFlagsPrecioProducto(producto);
        const cantidadNueva = parseFloat(producto.cantidad) || 0.5;
        const esManual = Boolean(producto.esManual);

        if (!esManual) {
          const productoExistenteIndex = productosActualizados.findIndex(
            (p) => !p.esManual && p.id === producto.id
          );

          if (productoExistenteIndex !== -1) {
            const productoExistente = productosActualizados[productoExistenteIndex];
            const nuevaCantidadTotal = parseFloat(productoExistente.cantidad) + cantidadNueva;
            const descuentoPorcentaje = productoExistente.descuento_porcentaje || 0;
            const {
              precioNetoUnitario,
              subtotalConDescuento,
              ivaCalculado
            } = calcularTotalesProducto({
              producto: productoExistente,
              cantidad: nuevaCantidadTotal,
              descuentoPorcentaje
            });

            productosActualizados[productoExistenteIndex] = {
              ...productoExistente,
              cantidad: nuevaCantidadTotal,
              precio: precioNetoUnitario,
              subtotal: subtotalConDescuento,
              iva_calculado: ivaCalculado
            };
            continue;
          }
        }

        const {
          porcentajeIva,
          precioNetoUnitario,
          subtotalConDescuento,
          ivaCalculado
        } = calcularTotalesProducto({
          producto: productoNormalizado,
          cantidad: cantidadNueva,
          descuentoPorcentaje: parseFloat(producto.descuento_porcentaje || 0)
        });

        productosActualizados.push(
          normalizarFlagsPrecioProducto({
            id: producto.id,
            nombre: producto.nombre,
            unidad_medida: producto.unidad_medida || 'Unidad',
            cantidad: cantidadNueva,
            precio: precioNetoUnitario,
            porcentaje_iva: porcentajeIva,
            iva_calculado: ivaCalculado,
            subtotal: subtotalConDescuento,
            descuento_porcentaje: producto.descuento_porcentaje || 0,
            esManual
          })
        );
      }

      return {
        ...state,
        productos: productosActualizados
      };
    }
    
    case 'REMOVE_PRODUCTO':
      return {
        ...state,
        productos: state.productos.filter((_, index) => index !== action.payload)
      };
    
    case 'UPDATE_CANTIDAD':
      const productosActualizados = [...state.productos];
      const producto = productosActualizados[action.payload.index];

      // ✅ ASEGURAR QUE CANTIDAD SEA PARSEADA COMO FLOAT
      const nuevaCantidad = parseFloat(action.payload.cantidad);

      const descuentoPorcentaje = producto.descuento_porcentaje || 0;
      const {
        precioNetoUnitario: precioNetoUnitarioCantidad,
        subtotalConDescuento: subtotalConDescuentoCantidad,
        ivaCalculado: ivaCalculadoCantidad
      } = calcularTotalesProducto({
        producto,
        cantidad: nuevaCantidad,
        descuentoPorcentaje
      });

      productosActualizados[action.payload.index] = {
        ...producto,
        cantidad: nuevaCantidad, // ✅ USAR LA CANTIDAD PARSEADA
        precio: precioNetoUnitarioCantidad,
        subtotal: subtotalConDescuentoCantidad,
        iva_calculado: ivaCalculadoCantidad
        // descuento_porcentaje se mantiene del producto original
      };

      return {
        ...state,
        productos: productosActualizados
      };

    case 'UPDATE_PRODUCTO':
      // ✅ ACTUALIZAR PRODUCTO COMPLETO (con descuentos, precio, cantidad, etc.)
      const productosActualizadosCompleto = [...state.productos];
      productosActualizadosCompleto[action.payload.index] = {
        ...productosActualizadosCompleto[action.payload.index],
        ...normalizarFlagsPrecioProducto(action.payload.producto)
      };

      return {
        ...state,
        productos: productosActualizadosCompleto
      };

    case 'UPDATE_DESCUENTO':
      // ✅ ACTUALIZAR SOLO EL DESCUENTO Y RECALCULAR
      const productosConDescuento = [...state.productos];
      const productoDesc = productosConDescuento[action.payload.index];

      const nuevoDescuento = Math.max(0, Math.min(100, parseFloat(action.payload.descuento) || 0));

      const {
        precioNetoUnitario: precioNetoUnitarioDescuento,
        subtotalConDescuento: subtotalConDescuentoDescuento,
        ivaCalculado: ivaCalculadoDescuento
      } = calcularTotalesProducto({
        producto: productoDesc,
        cantidad: productoDesc.cantidad,
        descuentoPorcentaje: nuevoDescuento
      });

      productosConDescuento[action.payload.index] = {
        ...productoDesc,
        precio: precioNetoUnitarioDescuento,
        descuento_porcentaje: nuevoDescuento,
        subtotal: subtotalConDescuentoDescuento,
        iva_calculado: ivaCalculadoDescuento
      };

      return {
        ...state,
        productos: productosConDescuento
      };

    case 'SET_OBSERVACIONES':
      return { ...state, observaciones: action.payload };
    
    case 'CLEAR_PEDIDO':
      return {
        cliente: null,
        productos: [],
        observaciones: ''
      };

    case 'RESTORE_DRAFT': {
      const draft = action.payload;
      if (!draft || !Array.isArray(draft.productos)) return state;
      return {
        cliente: draft.cliente || null,
        productos: draft.productos.map(normalizarFlagsPrecioProducto),
        observaciones: draft.observaciones || ''
      };
    }
    
    default:
      return state;
  }
}

const initialState = {
  cliente: null,
  productos: [],
  observaciones: ''
};

export function PedidosProvider({ children, draftKey = null }) {
  const [state, dispatch] = useReducer(pedidosReducer, initialState);
  const [savedDraft, setSavedDraft] = useState(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!draftKey) return;
    setSavedDraft(loadDraftFromStorage(draftKey));
  }, [draftKey]);

  useEffect(() => {
    if (!savedDraft) return;
    const hasCurrentContent =
      Boolean(state.cliente) ||
      state.productos.length > 0 ||
      Boolean(state.observaciones?.trim());
    if (hasCurrentContent) {
      setSavedDraft(null);
    }
  }, [savedDraft, state.cliente, state.productos.length, state.observaciones]);

  useEffect(() => {
    if (!draftKey) return undefined;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraftToStorage(draftKey, state);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draftKey, state]);

  const clearDraft = useCallback(() => {
    if (!draftKey) return;
    removeDraftFromStorage(draftKey);
    setSavedDraft(null);
  }, [draftKey]);

  const restoreDraft = useCallback(() => {
    if (!savedDraft) return;
    dispatch({ type: 'RESTORE_DRAFT', payload: savedDraft });
    setSavedDraft(null);
  }, [savedDraft]);

  const discardDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  // Calcular totales dinámicamente (redondeo ,01–,59 mantienen; ,60–,99 suben)
  const subtotalRaw = state.productos.reduce((acc, prod) => acc + prod.subtotal, 0);
  const totalIvaRaw = state.productos.reduce((acc, prod) => acc + prod.iva_calculado, 0);
  const totalRaw = subtotalRaw + totalIvaRaw;
  const subtotal = roundFacturacion(subtotalRaw);
  const totalIva = roundFacturacion(totalIvaRaw);
  const total = roundFacturacion(totalRaw);
  const totalProductos = state.productos.reduce((acc, prod) => acc + prod.cantidad, 0);

  const actions = {
    // Acciones del cliente
    setCliente: (cliente) => dispatch({ type: 'SET_CLIENTE', payload: cliente }),
    clearCliente: () => dispatch({ type: 'CLEAR_CLIENTE' }),
    
    // Acciones de productos
    addProducto: (producto, cantidad) => {
      const productoConCantidad = {
        ...producto,
        cantidad: parseFloat(cantidad) || 0.5 // ✅ CAMBIAR DEFAULT A 0.5
        // El porcentaje de IVA ya viene en producto.iva desde la DB
      };
      dispatch({ type: 'ADD_PRODUCTO', payload: productoConCantidad });
    },
    
    // ✅ NUEVA FUNCIÓN PARA MÚLTIPLES PRODUCTOS
    addMultipleProductos: (productos) => {
      dispatch({ type: 'ADD_MULTIPLE_PRODUCTOS', payload: productos });
    },
    
    removeProducto: (index) => dispatch({ type: 'REMOVE_PRODUCTO', payload: index }),
    
    updateCantidad: (index, cantidad) => {
      // ✅ CAMBIAR PARA PERMITIR 0.5 COMO MÍNIMO
      const cantidadValida = Math.max(0.5, parseFloat(cantidad));
      dispatch({ type: 'UPDATE_CANTIDAD', payload: { index, cantidad: cantidadValida } });
    },

    updateProducto: (index, producto) => {
      dispatch({ type: 'UPDATE_PRODUCTO', payload: { index, producto } });
    },

    updateDescuento: (index, descuento) => {
      dispatch({ type: 'UPDATE_DESCUENTO', payload: { index, descuento } });
    },

    // Acciones de observaciones
    setObservaciones: (observaciones) => dispatch({ type: 'SET_OBSERVACIONES', payload: observaciones }),
    
    // Limpiar todo
    clearPedido: () => {
      dispatch({ type: 'CLEAR_PEDIDO' });
      clearDraft();
    },
    
    restoreDraft,
    discardDraft,
    clearDraft,
    
    // Obtener datos para envío
    getDatosPedido: () => ({
      cliente: state.cliente,
      productos: state.productos,
      observaciones: state.observaciones,
      subtotal,
      totalIva,
      total,
      totalProductos
    })
  };

  return (
    <PedidosContext.Provider value={{ 
      ...state, 
      subtotal,
      totalIva,
      total,
      totalProductos,
      savedDraft,
      ...actions 
    }}>
      {children}
    </PedidosContext.Provider>
  );
}

export function usePedidosContext() {
  const context = useContext(PedidosContext);
  if (!context) {
    throw new Error('usePedidosContext debe ser usado dentro de PedidosProvider');
  }
  return context;
}