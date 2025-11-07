// context/PedidosContext.js
import { createContext, useContext, useReducer } from 'react';

const PedidosContext = createContext();

// Reducer para manejar el estado de pedidos
function pedidosReducer(state, action) {
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
    
    case 'ADD_PRODUCTO':
  const cantidadNueva = parseFloat(action.payload.cantidad) || 0.5;

      // ✅ VERIFICAR SI EL CLIENTE ES EXENTO DE IVA
      const esClienteExento = state.cliente?.condicion_iva?.toUpperCase() === 'EXENTO';

      // ✅ VERIFICAR SI EL PRODUCTO YA EXISTE
      const productoExistenteIndex = state.productos.findIndex(p => p.id === action.payload.id);

      if (productoExistenteIndex !== -1) {
        // Si existe, actualizar la cantidad
        const productosActualizados = [...state.productos];
        const productoExistente = productosActualizados[productoExistenteIndex];
        const nuevaCantidadTotal = parseFloat(productoExistente.cantidad) + cantidadNueva;

        // ✅ RECALCULAR SUBTOTAL CONSIDERANDO DESCUENTO
        const descuentoPorcentaje = productoExistente.descuento_porcentaje || 0;
        const subtotalBase = productoExistente.precio * nuevaCantidadTotal;
        const montoDescuento = (subtotalBase * descuentoPorcentaje) / 100;
        const nuevoSubtotal = parseFloat((subtotalBase - montoDescuento).toFixed(2));
        
        // ✅ SI EL CLIENTE ES EXENTO, IVA = 0
        const nuevoIvaCalculado = esClienteExento
          ? 0
          : parseFloat((nuevoSubtotal * (productoExistente.porcentaje_iva / 100)).toFixed(2));

        productosActualizados[productoExistenteIndex] = {
          ...productoExistente,
          cantidad: nuevaCantidadTotal,
          subtotal: nuevoSubtotal,
          iva_calculado: nuevoIvaCalculado
          // descuento_porcentaje se mantiene
        };

        return {
          ...state,
          productos: productosActualizados
        };
      } else {
        // Si no existe, agregarlo como antes
        const subtotalSinIva = parseFloat((cantidadNueva * action.payload.precio).toFixed(2));
        const porcentajeIva = action.payload.iva || 21;
        // ✅ SI EL CLIENTE ES EXENTO, IVA = 0
        const ivaCalculado = esClienteExento
          ? 0
          : parseFloat((subtotalSinIva * (porcentajeIva / 100)).toFixed(2));

        const nuevoProducto = {
          id: action.payload.id,
          nombre: action.payload.nombre,
          unidad_medida: action.payload.unidad_medida || 'Unidad',
          cantidad: cantidadNueva,
          precio: parseFloat(action.payload.precio),
          porcentaje_iva: porcentajeIva,
          iva_calculado: ivaCalculado,
          subtotal: subtotalSinIva,
          descuento_porcentaje: parseFloat(action.payload.descuento_porcentaje || 0) // ✅ INICIALIZAR DESCUENTO
        };

        return {
          ...state,
          productos: [...state.productos, nuevoProducto]
        };
      }
    
    // ✅ NUEVA ACCIÓN PARA MÚLTIPLES PRODUCTOS
    case 'ADD_MULTIPLE_PRODUCTOS':
      // ✅ VERIFICAR SI EL CLIENTE ES EXENTO DE IVA
      const esClienteExentoMultiple = state.cliente?.condicion_iva?.toUpperCase() === 'EXENTO';

      const nuevosProductos = action.payload.map(producto => {
        const subtotalSinIva = parseFloat((producto.cantidad * producto.precio).toFixed(2));
        const porcentajeIva = producto.iva || producto.porcentaje_iva || 21;
        // ✅ SI EL CLIENTE ES EXENTO, IVA = 0
        const ivaCalculado = esClienteExentoMultiple
          ? 0
          : parseFloat((subtotalSinIva * (porcentajeIva / 100)).toFixed(2));

        return {
          id: producto.id,
          nombre: producto.nombre,
          unidad_medida: producto.unidad_medida || 'Unidad',
          cantidad: producto.cantidad,
          precio: parseFloat(producto.precio),
          porcentaje_iva: porcentajeIva,
          iva_calculado: ivaCalculado,
          subtotal: subtotalSinIva,
          descuento_porcentaje: producto.descuento_porcentaje || 0 // ✅ INICIALIZAR DESCUENTO
        };
      });

      return {
        ...state,
        productos: [...state.productos, ...nuevosProductos]
      };
    
    case 'REMOVE_PRODUCTO':
      return {
        ...state,
        productos: state.productos.filter((_, index) => index !== action.payload)
      };
    
    case 'UPDATE_CANTIDAD':
      // ✅ VERIFICAR SI EL CLIENTE ES EXENTO DE IVA
      const esClienteExentoCantidad = state.cliente?.condicion_iva?.toUpperCase() === 'EXENTO';

      const productosActualizados = [...state.productos];
      const producto = productosActualizados[action.payload.index];

      // ✅ ASEGURAR QUE CANTIDAD SEA PARSEADA COMO FLOAT
      const nuevaCantidad = parseFloat(action.payload.cantidad);

      // ✅ RECALCULAR SUBTOTAL CONSIDERANDO DESCUENTO
      const descuentoPorcentaje = producto.descuento_porcentaje || 0;
      const subtotalBase = producto.precio * nuevaCantidad;
      const montoDescuento = (subtotalBase * descuentoPorcentaje) / 100;
      const nuevoSubtotal = parseFloat((subtotalBase - montoDescuento).toFixed(2));
      
      // ✅ SI EL CLIENTE ES EXENTO, IVA = 0
      const nuevoIvaCalculado = esClienteExentoCantidad
        ? 0
        : parseFloat((nuevoSubtotal * (producto.porcentaje_iva / 100)).toFixed(2));

      productosActualizados[action.payload.index] = {
        ...producto,
        cantidad: nuevaCantidad, // ✅ USAR LA CANTIDAD PARSEADA
        subtotal: nuevoSubtotal,
        iva_calculado: nuevoIvaCalculado
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
        ...action.payload.producto
      };

      return {
        ...state,
        productos: productosActualizadosCompleto
      };

    case 'UPDATE_DESCUENTO':
      // ✅ ACTUALIZAR SOLO EL DESCUENTO Y RECALCULAR
      const esClienteExentoDescuento = state.cliente?.condicion_iva?.toUpperCase() === 'EXENTO';
      const productosConDescuento = [...state.productos];
      const productoDesc = productosConDescuento[action.payload.index];

      const nuevoDescuento = Math.max(0, Math.min(100, parseFloat(action.payload.descuento) || 0));

      // Recalcular subtotal con el nuevo descuento
      const subtotalBaseDesc = productoDesc.precio * productoDesc.cantidad;
      const montoDescuentoNuevo = (subtotalBaseDesc * nuevoDescuento) / 100;
      const subtotalConDescuento = parseFloat((subtotalBaseDesc - montoDescuentoNuevo).toFixed(2));

      // Recalcular IVA
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
    
    case 'CLEAR_PEDIDO':
      return {
        cliente: null,
        productos: [],
        observaciones: ''
      };
    
    default:
      return state;
  }
}

const initialState = {
  cliente: null,
  productos: [],
  observaciones: ''
};

export function PedidosProvider({ children }) {
  const [state, dispatch] = useReducer(pedidosReducer, initialState);

  // Calcular totales dinámicamente
  const subtotal = state.productos.reduce((acc, prod) => acc + prod.subtotal, 0); // Suma subtotales SIN IVA
  const totalIva = state.productos.reduce((acc, prod) => acc + prod.iva_calculado, 0); // Suma IVAs calculados
  const total = subtotal + totalIva; // Total con IVA incluido
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
    clearPedido: () => dispatch({ type: 'CLEAR_PEDIDO' }),
    
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