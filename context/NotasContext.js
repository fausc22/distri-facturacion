// context/NotasContext.js
import { createContext, useContext, useReducer } from 'react';
import { roundFacturacion } from '../utils/rounding';

export const NotasContext = createContext();

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
  const porcentajeIva = Number(producto?.porcentaje_iva ?? producto?.iva ?? 21) || 21;
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

// Reducer para manejar el estado de notas
function notasReducer(state, action) {
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
    
    case 'SET_VENTA_REFERENCIA':
      return { ...state, ventaReferencia: action.payload };
    
    case 'CLEAR_VENTA_REFERENCIA':
      return { ...state, ventaReferencia: null };
    
    case 'ADD_PRODUCTO':
      const cantidadNueva = parseFloat(action.payload.cantidad) || 1;

      // ✅ VERIFICAR SI EL PRODUCTO YA EXISTE (solo para productos no manuales)
      if (!action.payload.esManual) {
        const productoExistenteIndex = state.productos.findIndex(
          p => !p.esManual && p.id === action.payload.id
        );

        if (productoExistenteIndex !== -1) {
          // Si existe, actualizar la cantidad
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

      // Si no existe o es manual, agregarlo
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
        id: action.payload.esManual ? null : action.payload.id,
        nombre: action.payload.nombre,
        unidad_medida: action.payload.unidad_medida || 'Unidad',
        cantidad: cantidadNueva,
        precio: precioNetoUnitario,
        porcentaje_iva: porcentajeIva,
        iva_calculado: ivaCalculado,
        subtotal: subtotalConDescuento,
        descuento_porcentaje: parseFloat(action.payload.descuento_porcentaje || 0),
        esManual: action.payload.esManual || false,
        // Flags de compatibilidad para modo precio manual
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
    
    case 'REMOVE_PRODUCTO':
      return {
        ...state,
        productos: state.productos.filter((_, index) => index !== action.payload)
      };
    
    case 'UPDATE_CANTIDAD':
      const productosActualizados = [...state.productos];
      const producto = productosActualizados[action.payload.index];
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
        cantidad: nuevaCantidad,
        precio: precioNetoUnitarioCantidad,
        subtotal: subtotalConDescuentoCantidad,
        iva_calculado: ivaCalculadoCantidad
      };

      return {
        ...state,
        productos: productosActualizados
      };

    case 'UPDATE_PRODUCTO':
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
    
    case 'SET_PRODUCTOS':
      return {
        ...state,
        productos: action.payload || []
      };

    case 'CLEAR_NOTA':
      return {
        cliente: null,
        ventaReferencia: null,
        productos: [],
        observaciones: ''
      };
    
    default:
      return state;
  }
}

const initialState = {
  cliente: null,
  ventaReferencia: null,
  productos: [],
  observaciones: ''
};

export function NotasProvider({ children }) {
  const [state, dispatch] = useReducer(notasReducer, initialState);

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
    
    // Acciones de venta referencia
    setVentaReferencia: (venta) => dispatch({ type: 'SET_VENTA_REFERENCIA', payload: venta }),
    clearVentaReferencia: () => dispatch({ type: 'CLEAR_VENTA_REFERENCIA' }),
    
    // Acciones de productos
    addProducto: (producto, cantidad) => {
      const productoConCantidad = {
        ...producto,
        cantidad: parseFloat(cantidad) || 1
      };
      dispatch({ type: 'ADD_PRODUCTO', payload: productoConCantidad });
    },
    
    removeProducto: (index) => dispatch({ type: 'REMOVE_PRODUCTO', payload: index }),
    
    updateCantidad: (index, cantidad) => {
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
    
    // Reemplazar lista de productos (ej. desde ítems de venta de referencia)
    setProductos: (productos) => dispatch({ type: 'SET_PRODUCTOS', payload: productos }),

    // Limpiar todo
    clearNota: () => dispatch({ type: 'CLEAR_NOTA' }),
    
    // Obtener datos para envío
    getDatosNota: () => ({
      cliente: state.cliente,
      ventaReferencia: state.ventaReferencia,
      productos: state.productos,
      observaciones: state.observaciones,
      subtotal,
      totalIva,
      total,
      totalProductos
    })
  };

  return (
    <NotasContext.Provider value={{ 
      ...state, 
      subtotal,
      totalIva,
      total,
      totalProductos,
      ...actions 
    }}>
      {children}
    </NotasContext.Provider>
  );
}

export function useNotasContext() {
  const context = useContext(NotasContext);
  if (!context) {
    throw new Error('useNotasContext debe ser usado dentro de NotasProvider');
  }
  return context;
}

