import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useGenerarListados } from '../../hooks/listados/useGenerarListados';

export default function LibroIvaVentas() {
  const { loading, generarPdfLibroIva } = useGenerarListados();

  // Estados para Libro IVA
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [anioSeleccionado, setAnioSeleccionado] = useState('');

  // Handler para generar Libro IVA
  const handleGenerarLibroIva = () => {
    if (!mesSeleccionado || !anioSeleccionado) {
      toast.error('Debe seleccionar mes y año');
      return;
    }
    generarPdfLibroIva(parseInt(mesSeleccionado), parseInt(anioSeleccionado));
  };

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  return (
    <div className="border border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
        LIBRO IVA VENTAS
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Genera el libro de IVA con las ventas tipo A y B del mes seleccionado.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mes
          </label>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un mes</option>
            {meses.map(mes => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Año
          </label>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un año</option>
            {anios.map(anio => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerarLibroIva}
          disabled={loading}
          className={`w-full py-3 rounded-md font-semibold text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Generando...' : 'Generar Libro IVA'}
        </button>
      </div>
    </div>
  );
}

