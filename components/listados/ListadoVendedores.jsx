import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useGenerarListados } from '../../hooks/listados/useGenerarListados';
import { useEmpleados } from '../../hooks/useEmpleados';
import { ModalPDFUniversal } from '../../components/shared/ModalPDFUniversal';

export default function ListadoVendedores() {
  const { loading, generarPdfListadoVendedores, pdfURL, mostrarModalPDF, nombreArchivo, tituloModal, subtituloModal, descargarPDF, compartirPDF, cerrarModalPDF } = useGenerarListados();
  const { listarTodosEmpleados } = useEmpleados();

  // Estados para Listado de Vendedores
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [anioSeleccionado, setAnioSeleccionado] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  // Cargar empleados al montar el componente
  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    setLoadingEmpleados(true);
    try {
      const resultado = await listarTodosEmpleados();
      if (resultado.success) {
        // Filtrar solo empleados activos
        const empleadosActivos = resultado.data.filter(emp => emp.activo === 1);
        setEmpleados(empleadosActivos);
      } else {
        toast.error('Error al cargar empleados');
        setEmpleados([]);
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      toast.error('Error al cargar empleados');
      setEmpleados([]);
    } finally {
      setLoadingEmpleados(false);
    }
  };

  // Handler para generar Listado de Vendedores
  const handleGenerarListadoVendedores = () => {
    if (!vendedorSeleccionado || !mesSeleccionado || !anioSeleccionado) {
      toast.error('Debe seleccionar vendedor, mes y año');
      return;
    }
    generarPdfListadoVendedores(parseInt(vendedorSeleccionado), parseInt(mesSeleccionado), parseInt(anioSeleccionado));
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
        LISTADO DE VENDEDORES
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Genera un listado con todas las ventas (A, B, X) de un vendedor específico en el mes seleccionado.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vendedor
          </label>
          <select
            value={vendedorSeleccionado}
            onChange={(e) => setVendedorSeleccionado(e.target.value)}
            disabled={loadingEmpleados}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un vendedor</option>
            {empleados.map(empleado => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre} {empleado.apellido} {empleado.rol ? `(${empleado.rol})` : ''}
              </option>
            ))}
          </select>
          {loadingEmpleados && (
            <p className="text-xs text-gray-500 mt-1">Cargando vendedores...</p>
          )}
        </div>

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
          onClick={handleGenerarListadoVendedores}
          disabled={loading || loadingEmpleados}
          className={`w-full py-3 rounded-md font-semibold text-white transition-colors ${
            loading || loadingEmpleados
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {loading ? 'Generando...' : 'Generar Listado de Vendedores'}
        </button>
      </div>

      {/* Modal PDF para Listado de Vendedores */}
      <ModalPDFUniversal
        mostrar={mostrarModalPDF}
        pdfURL={pdfURL}
        nombreArchivo={nombreArchivo}
        titulo={tituloModal}
        subtitulo={subtituloModal}
        onDescargar={descargarPDF}
        onCompartir={compartirPDF}
        onCerrar={cerrarModalPDF}
        zIndex={70}
      />
    </div>
  );
}

