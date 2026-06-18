import { createContext, useContext, useReducer } from 'react';

const ControlStockContext = createContext();

// Reducer para manejar el estado de control de stock
function controlStockReducer(state, action) {
  switch (action.type) {
    case 'ADD_PRODUCTO':
      const productoExistenteIndex = state.productos.findIndex(p => p.id === action.payload.id);
      
      if (productoExistenteIndex !== -1) {
        // Si existe, no duplicar (en control de stock no tiene sentido duplicar)
        return state;
      } else {
        // Si no existe, agregarlo
        const nuevoProducto = {
          id: action.payload.id,
          nombre: action.payload.nombre,
          unidad_medida: action.payload.unidad_medida || 'Unidad',
          stock_actual: parseFloat(action.payload.stock_actual) || 0,
          categoria_id: action.payload.categoria_id || null,
          categoria_nombre: action.payload.categoria_nombre || 'Sin Categoría'
        };
        
        return {
          ...state,
          productos: [...state.productos, nuevoProducto]
        };
      }
    
    case 'ADD_MULTIPLE_PRODUCTOS':
      // Filtrar productos que ya existen para evitar duplicados
      const productosNuevos = action.payload.filter(
        producto => !state.productos.some(p => p.id === producto.id)
      );
      
      const productosFormateados = productosNuevos.map(producto => ({
        id: producto.id,
        nombre: producto.nombre,
        unidad_medida: producto.unidad_medida || 'Unidad',
        stock_actual: parseFloat(producto.stock_actual) || 0,
        categoria_id: producto.categoria_id || null,
        categoria_nombre: producto.categoria_nombre || 'Sin Categoría'
      }));
      
      return {
        ...state,
        productos: [...state.productos, ...productosFormateados]
      };
    
    case 'REMOVE_PRODUCTO':
      return {
        ...state,
        productos: state.productos.filter((_, index) => index !== action.payload)
      };
    
    case 'CLEAR_PRODUCTOS':
      return {
        ...state,
        productos: []
      };
    
    case 'SET_FILTRO_TIPO':
      return {
        ...state,
        filtroTipo: action.payload
      };
    
    case 'SET_CANTIDAD_FILTRO':
      return {
        ...state,
        cantidadFiltro: action.payload
      };
    
    default:
      return state;
  }
}

const initialState = {
  productos: [],
  filtroTipo: 'menor', // 'menor' o 'mayor'
  cantidadFiltro: 50
};

export function ControlStockProvider({ children }) {
  const [state, dispatch] = useReducer(controlStockReducer, initialState);

  const actions = {
    // Acciones de productos
    addProducto: (producto) => {
      dispatch({ type: 'ADD_PRODUCTO', payload: producto });
    },
    
    addMultipleProductos: (productos) => {
      dispatch({ type: 'ADD_MULTIPLE_PRODUCTOS', payload: productos });
    },
    
    removeProducto: (index) => dispatch({ type: 'REMOVE_PRODUCTO', payload: index }),
    
    clearProductos: () => dispatch({ type: 'CLEAR_PRODUCTOS' }),
    
    // Acciones de filtro
    setFiltroTipo: (tipo) => dispatch({ type: 'SET_FILTRO_TIPO', payload: tipo }),
    
    setCantidadFiltro: (cantidad) => dispatch({ type: 'SET_CANTIDAD_FILTRO', payload: cantidad }),
    
    // Obtener datos para envío
    getDatosStock: () => ({
      productos: state.productos,
      filtroTipo: state.filtroTipo,
      cantidadFiltro: state.cantidadFiltro
    })
  };

  return (
    <ControlStockContext.Provider value={{ 
      ...state, 
      ...actions 
    }}>
      {children}
    </ControlStockContext.Provider>
  );
}

export function useControlStock() {
  const context = useContext(ControlStockContext);
  if (!context) {
    throw new Error('useControlStock debe ser usado dentro de ControlStockProvider');
  }
  return context;
}

