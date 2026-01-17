// context/NotasContext.js
import { createContext, useContext, useReducer } from 'react';

export const NotasContext = createContext();

// Reducer para manejar el estado de notas
function notasReducer(state, action) {
  switch (action.type) {
    case 'SET_CLIENTE':
      // ✅ VERIFICAR SI EL NUEVO CLIENTE ES EXENTO
      const esNuevoClienteExento = action.payload?.condicion_iva?.toUpperCase() === 'EXENTO';

      // ✅ RECALCULAR IVA DE TODOS LOS PRODUCTOS EN EL CARRITO
      const productosRecalculados = state.productos.map(producto => {
        const nuevoIvaCalculado = esNuevoClienteExento
          ? 0
          : parseFloat((producto.subtotal * (producto.porcentaje_iva / 100)).toFixed(2));

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

      // ✅ VERIFICAR SI EL CLIENTE ES EXENTO DE IVA
      const esClienteExento = state.cliente?.condicion_iva?.toUpperCase() === 'EXENTO';

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
          const subtotalBase = productoExistente.precio * nuevaCantidadTotal;
          const montoDescuento = (subtotalBase * descuentoPorcentaje) / 100;
          const nuevoSubtotal = parseFloat((subtotalBase - montoDescuento).toFixed(2));
          
          const nuevoIvaCalculado = esClienteExento
            ? 0
            : parseFloat((nuevoSubtotal * (productoExistente.porcentaje_iva / 100)).toFixed(2));

          productosActualizados[productoExistenteIndex] = {
            ...productoExistente,
            cantidad: nuevaCantidadTotal,
            subtotal: nuevoSubtotal,
            iva_calculado: nuevoIvaCalculado
          };

          return {
            ...state,
            productos: productosActualizados
          };
        }
      }

      // Si no existe o es manual, agregarlo
      const subtotalSinIva = parseFloat((cantidadNueva * action.payload.precio).toFixed(2));
      const porcentajeIva = action.payload.porcentaje_iva || action.payload.iva || 21;
      const ivaCalculado = esClienteExento
        ? 0
        : parseFloat((subtotalSinIva * (porcentajeIva / 100)).toFixed(2));

      const nuevoProducto = {
        id: action.payload.esManual ? null : action.payload.id,
        nombre: action.payload.nombre,
        unidad_medida: action.payload.unidad_medida || 'Unidad',
        cantidad: cantidadNueva,
        precio: parseFloat(action.payload.precio),
        porcentaje_iva: porcentajeIva,
        iva_calculado: ivaCalculado,
        subtotal: subtotalSinIva,
        descuento_porcentaje: parseFloat(action.payload.descuento_porcentaje || 0),
        esManual: action.payload.esManual || false
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
      const esClienteExentoCantidad = state.cliente?.condicion_iva?.toUpperCase() === 'EXENTO';
      const productosActualizados = [...state.productos];
      const producto = productosActualizados[action.payload.index];
      const nuevaCantidad = parseFloat(action.payload.cantidad);

      const descuentoPorcentaje = producto.descuento_porcentaje || 0;
      const subtotalBase = producto.precio * nuevaCantidad;
      const montoDescuento = (subtotalBase * descuentoPorcentaje) / 100;
      const nuevoSubtotal = parseFloat((subtotalBase - montoDescuento).toFixed(2));
      
      const nuevoIvaCalculado = esClienteExentoCantidad
        ? 0
        : parseFloat((nuevoSubtotal * (producto.porcentaje_iva / 100)).toFixed(2));

      productosActualizados[action.payload.index] = {
        ...producto,
        cantidad: nuevaCantidad,
        subtotal: nuevoSubtotal,
        iva_calculado: nuevoIvaCalculado
      };

      return {
        ...state,
        productos: productosActualizados
      };

    case 'UPDATE_PRODUCTO':
      const productosActualizadosCompleto = [...state.productos];
      productosActualizadosCompleto[action.payload.index] = {
        ...productosActualizadosCompleto[action.payload.index],
        ...action.payload.producto
      };

      return {
        ...state,
        productos: productosActualizadosCompleto
      };

    case 'UPDATE_DESCUENTO':
      const esClienteExentoDescuento = state.cliente?.condicion_iva?.toUpperCase() === 'EXENTO';
      const productosConDescuento = [...state.productos];
      const productoDesc = productosConDescuento[action.payload.index];

      const nuevoDescuento = Math.max(0, Math.min(100, parseFloat(action.payload.descuento) || 0));
      const subtotalBaseDesc = productoDesc.precio * productoDesc.cantidad;
      const montoDescuentoNuevo = (subtotalBaseDesc * nuevoDescuento) / 100;
      const subtotalConDescuento = parseFloat((subtotalBaseDesc - montoDescuentoNuevo).toFixed(2));

      const ivaCalculadoDesc = esClienteExentoDescuento
        ? 0
        : parseFloat((subtotalConDescuento * (productoDesc.porcentaje_iva / 100)).toFixed(2));

      productosConDescuento[action.payload.index] = {
        ...productoDesc,
        descuento_porcentaje: nuevoDescuento,
        subtotal: subtotalConDescuento,
        iva_calculado: ivaCalculadoDesc
      };

      return {
        ...state,
        productos: productosConDescuento
      };

    case 'SET_OBSERVACIONES':
      return { ...state, observaciones: action.payload };
    
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

  // Calcular totales dinámicamente
  const subtotal = state.productos.reduce((acc, prod) => acc + prod.subtotal, 0);
  const totalIva = state.productos.reduce((acc, prod) => acc + prod.iva_calculado, 0);
  const total = subtotal + totalIva;
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

