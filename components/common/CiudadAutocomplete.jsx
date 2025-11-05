// components/common/CiudadAutocomplete.jsx
import { useState, useEffect, useRef } from 'react';
import { axiosAuth } from '../../utils/apiClient';

export default function CiudadAutocomplete({
  value,
  onChange,
  onCiudadSeleccionada,
  disabled = false,
  placeholder = "Ciudad",
  className = "",
  required = false
}) {
  const [busqueda, setBusqueda] = useState('');
  const [ciudades, setCiudades] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valorInicial, setValorInicial] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const wrapperRef = useRef(null);

  // Sincronizar busqueda con value externo
  useEffect(() => {
    if (value !== busqueda) {
      setBusqueda(value || '');
      // Si es la primera vez y hay un valor, guardarlo como inicial
      if (value && !valorInicial && !hasInteracted) {
        setValorInicial(value);
      }
    }
  }, [value]);

  // Buscar ciudades cuando el usuario escriba (mínimo 2 caracteres) y solo si ha interactuado
  useEffect(() => {
    // No buscar si no ha habido interacción del usuario o si es el valor inicial
    if (!hasInteracted || busqueda === valorInicial) {
      if (!hasInteracted) {
        setCiudades([]);
      }
      return;
    }

    // No buscar si es muy corto
    if (busqueda.length < 2) {
      setCiudades([]);
      setMostrarResultados(false);
      return;
    }

    const buscarCiudades = async () => {
      setLoading(true);
      try {
        const response = await axiosAuth.get(`/ciudades/buscar?q=${busqueda}`);
        if (response.data.success) {
          setCiudades(response.data.data);
          setMostrarResultados(true);
        }
      } catch (error) {
        console.error('Error buscando ciudades:', error);
        setCiudades([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(buscarCiudades, 300);
    return () => clearTimeout(timeoutId);
  }, [busqueda, hasInteracted, valorInicial]);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setBusqueda(newValue);
    onChange(newValue); // Actualizar el valor en el padre
    
    // Marcar que el usuario ha interactuado
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleCiudadClick = (ciudad) => {
    setBusqueda(ciudad.nombre);
    onChange(ciudad.nombre);
    if (onCiudadSeleccionada) {
      onCiudadSeleccionada(ciudad);
    }
    setMostrarResultados(false);
    setCiudades([]);
    setValorInicial(ciudad.nombre); // Actualizar valor inicial
    setHasInteracted(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={busqueda}
        onChange={handleInputChange}
        onFocus={() => {
          // Solo mostrar resultados si ya había interactuado y hay ciudades
          if (hasInteracted && ciudades.length > 0 && busqueda.length >= 2) {
            setMostrarResultados(true);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 ${className}`}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Resultados del autocomplete */}
      {mostrarResultados && ciudades.length > 0 && !loading && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {ciudades.map((ciudad) => (
            <div
              key={ciudad.id}
              onClick={() => handleCiudadClick(ciudad)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900 border-b last:border-b-0"
            >
              <div className="font-medium">{ciudad.nombre}</div>
              {ciudad.zona_nombre && (
                <div className="text-xs text-gray-500">Zona: {ciudad.zona_nombre}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {mostrarResultados && hasInteracted && busqueda.length >= 2 && ciudades.length === 0 && !loading && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
          <p className="text-sm text-gray-500 text-center">
            No se encontraron ciudades con &quot;{busqueda}&quot;
          </p>
        </div>
      )}

      {/* Hint de mínimo 2 caracteres (solo si ha interactuado) */}
      {hasInteracted && busqueda.length > 0 && busqueda.length < 2 && (
        <p className="text-xs text-gray-500 mt-1">
          Escribe al menos 2 caracteres para buscar
        </p>
      )}
    </div>
  );
}
