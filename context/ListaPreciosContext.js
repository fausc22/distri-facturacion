// context/ListaPreciosContext.js
import { createContext, useContext, useReducer } from 'react';

const ListaPreciosContext = createContext();

// Reducer para manejar el estado de lista de precios
function listaPreciosReducer(state, action) {
  switch (action.type) {
    case 'SET_CLIENTE':
      return { ...state, cliente: action.payload };
    
    case 'CLEAR_CLIENTE':
      return { ...state, cliente: null };
    
    case 'ADD_PRODUCTO':
      const cantidadNueva = parseFloat(action.payload.cantidad) || 0.5;
      
      // Verificar si el producto ya existe
      const productoExistenteIndex = state.productos.findIndex(p => p.id === action.payload.id);
      
      if (productoExistenteIndex !== -1) {
        // Si existe, actualizar la cantidad
        const productosActualizados = [...state.productos];
        const productoExistente = productosActualizados[productoExistenteIndex];
        const nuevaCantidadTotal = parseFloat(productoExistente.cantidad) + cantidadNueva;
        
        // Recalcular subtotal e IVA con la nueva cantidad total
        const nuevoSubtotal = parseFloat((productoExistente.precio * nuevaCantidadTotal).toFixed(2));
        const nuevoIvaCalculado = parseFloat((nuevoSubtotal * (productoExistente.porcentaje_iva / 100)).toFixed(2));
        
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
      } else {
        // Si no existe, agregarlo
        const subtotalSinIva = parseFloat((cantidadNueva * action.payload.precio).toFixed(2));
        const porcentajeIva = action.payload.iva || 21;
        const ivaCalculado = parseFloat((subtotalSinIva * (porcentajeIva / 100)).toFixed(2));
        
        const nuevoProducto = {
          id: action.payload.id,
          nombre: action.payload.nombre,
          unidad_medida: action.payload.unidad_medida || 'Unidad',
          cantidad: cantidadNueva,
          precio: parseFloat(action.payload.precio),
          porcentaje_iva: porcentajeIva,
          iva_calculado: ivaCalculado,
          subtotal: subtotalSinIva
        };
        
        return {
          ...state,
          productos: [...state.productos, nuevoProducto]
        };
      }
    
    case 'ADD_MULTIPLE_PRODUCTOS':
      const nuevosProductos = action.payload.map(producto => {
        const subtotalSinIva = parseFloat((producto.cantidad * producto.precio).toFixed(2));
        const porcentajeIva = producto.iva || producto.porcentaje_iva || 21;
        const ivaCalculado = parseFloat((subtotalSinIva * (porcentajeIva / 100)).toFixed(2));
        
        return {
          id: producto.id,
          nombre: producto.nombre,
          unidad_medida: producto.unidad_medida || 'Unidad',
          cantidad: producto.cantidad,
          precio: parseFloat(producto.precio),
          porcentaje_iva: porcentajeIva,
          iva_calculado: ivaCalculado,
          subtotal: subtotalSinIva
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
      const productosActualizados = [...state.productos];
      const producto = productosActualizados[action.payload.index];
      
      const nuevaCantidad = parseFloat(action.payload.cantidad);
      
      // Recalcular subtotal e IVA con la nueva cantidad
      const nuevoSubtotal = parseFloat((producto.precio * nuevaCantidad).toFixed(2));
      const nuevoIvaCalculado = parseFloat((nuevoSubtotal * (producto.porcentaje_iva / 100)).toFixed(2));
      
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
    
    case 'SET_OBSERVACIONES':
      return { ...state, observaciones: action.payload };
    
    case 'CLEAR_LISTA':
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

export function ListaPreciosProvider({ children }) {
  const [state, dispatch] = useReducer(listaPreciosReducer, initialState);

  // Calcular totales dinámicamente
  const subtotal = state.productos.reduce((acc, prod) => acc + prod.subtotal, 0);
  const totalIva = state.productos.reduce((acc, prod) => acc + prod.iva_calculado, 0);
  const total = subtotal + totalIva;
  const totalProductos = state.productos.reduce((acc, prod) => acc + prod.cantidad, 0);

  const actions = {
    // Acciones del cliente
    setCliente: (cliente) => dispatch({ type: 'SET_CLIENTE', payload: cliente }),
    clearCliente: () => dispatch({ type: 'CLEAR_CLIENTE' }),
    
    // Acciones de productos
    addProducto: (producto, cantidad) => {
      const productoConCantidad = {
        ...producto,
        cantidad: parseFloat(cantidad) || 0.5
      };
      dispatch({ type: 'ADD_PRODUCTO', payload: productoConCantidad });
    },
    
    addMultipleProductos: (productos) => {
      dispatch({ type: 'ADD_MULTIPLE_PRODUCTOS', payload: productos });
    },
    
    removeProducto: (index) => dispatch({ type: 'REMOVE_PRODUCTO', payload: index }),
    
    updateCantidad: (index, cantidad) => {
      const cantidadValida = Math.max(0.5, parseFloat(cantidad));
      dispatch({ type: 'UPDATE_CANTIDAD', payload: { index, cantidad: cantidadValida } });
    },
    
    // Acciones de observaciones
    setObservaciones: (observaciones) => dispatch({ type: 'SET_OBSERVACIONES', payload: observaciones }),
    
    // Limpiar todo
    clearLista: () => dispatch({ type: 'CLEAR_LISTA' }),
    
    // Obtener datos para envío
    getDatosLista: () => ({
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
    <ListaPreciosContext.Provider value={{ 
      ...state, 
      subtotal,
      totalIva,
      total,
      totalProductos,
      ...actions 
    }}>
      {children}
    </ListaPreciosContext.Provider>
  );
}

export function useListaPrecios() {
  const context = useContext(ListaPreciosContext);
  if (!context) {
    throw new Error('useListaPrecios debe ser usado dentro de ListaPreciosProvider');
  }
  return context;
}