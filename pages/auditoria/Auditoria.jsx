import { useState, useEffect } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

// Hooks personalizados
import { useAuditoria } from '../../hooks/useAuditoria';
import { usePaginacion } from '../../hooks/usePaginacion';

// Componentes
import TablaAuditoria from '../../components/auditoria/TablaAuditoria';
import FiltrosAuditoria from '../../components/auditoria/FiltrosAuditoria';
import ModalDetalleAuditoria from '../../components/auditoria/ModalDetalleAuditoria';
import { Paginacion } from '../../components/Paginacion';

function AuditoriaContent() {
  // Estados para modales
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Hook de autenticación
  const { user, loading: authLoading } = useAuth();

  // Hook para auditoría
  const { 
    registros,
    registrosOriginales,
    loading, 
    filtros,
    cargarRegistros,
    aplicarFiltros,
    limpiarFiltros,
    obtenerDetalle,
    getEstadisticas,
    getUsuariosUnicos,
    getAccionesUnicas
  } = useAuditoria();

  // Hook de paginación
  const {
    datosActuales: registrosActuales,
    paginaActual,
    registrosPorPagina,
    totalPaginas,
    indexOfPrimero,
    indexOfUltimo,
    cambiarPagina,
    cambiarRegistrosPorPagina
  } = usePaginacion(registros, 50); // Máximo 50 registros por página

  // Verificar permisos
  const esGerente = user?.rol === 'GERENTE';

  // Effect para cargar registros
  useEffect(() => {
    if (!authLoading && user && esGerente) {
      console.log('🔄 Cargando registros de auditoría...');
      cargarRegistros();
    }
  }, [user, authLoading, esGerente]);

  // Handlers para eventos de la tabla
  const handleRowDoubleClick = async (registro) => {
    try {
      setRegistroSeleccionado(registro);
      setMostrarModalDetalle(true);
    } catch (error) {
      toast.error('Error al cargar detalles del registro');
    }
  };

  const handleCloseModalDetalle = () => {
    setMostrarModalDetalle(false);
    setRegistroSeleccionado(null);
  };

  // Handlers para filtros
  const handleFiltrosChange = (nuevosFiltros) => {
    aplicarFiltros(nuevosFiltros);
    cambiarPagina(1); // Volver a la primera página al filtrar
  };

  const handleLimpiarFiltros = () => {
    limpiarFiltros();
    cambiarPagina(1);
  };

  // Obtener datos para filtros
  const usuariosUnicos = getUsuariosUnicos();
  const accionesUnicas = getAccionesUnicas();
  const estadisticas = getEstadisticas();

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos de acceso
  if (!esGerente) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            Solo los gerentes pueden acceder al historial de auditoría.
          </p>
          <p className="text-sm text-gray-500">
            Tu rol actual: <span className="font-semibold">{user?.rol || 'No especificado'}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Head>
        <title>VERTIMAR | HISTORIAL DE AUDITORÍA</title>
        <meta name="description" content="Historial de auditoría del sistema VERTIMAR" />
      </Head>
      
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-7xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          📋 HISTORIAL DE AUDITORÍA
        </h1>
        
        <FiltrosAuditoria
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          onLimpiarFiltros={handleLimpiarFiltros}
          totalRegistros={estadisticas.total}
          registrosFiltrados={estadisticas.filtrado}
          usuarios={usuariosUnicos}
          acciones={accionesUnicas}
        />
        
        <TablaAuditoria
          registros={registrosActuales}
          onRowDoubleClick={handleRowDoubleClick}
          loading={loading}
        />
        
        <Paginacion
          datosOriginales={registros}
          paginaActual={paginaActual}
          registrosPorPagina={registrosPorPagina}
          totalPaginas={totalPaginas}
          indexOfPrimero={indexOfPrimero}
          indexOfUltimo={indexOfUltimo}
          onCambiarPagina={cambiarPagina}
          onCambiarRegistrosPorPagina={cambiarRegistrosPorPagina}
        />
        
        {/* Botón de volver */}
        <div className="mt-6 flex justify-center">
          <button 
            className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded text-white font-semibold transition-colors"
            onClick={() => window.history.back()}
          >
            🏠 Volver
          </button>
        </div>
      </div>
      
      {/* Modal de detalle */}
      <ModalDetalleAuditoria
        mostrar={mostrarModalDetalle}
        onClose={handleCloseModalDetalle}
        registro={registroSeleccionado}
        onObtenerDetalle={obtenerDetalle}
        loading={loading}
      />
    </div>
  );
}

export default function Auditoria() {
  return <AuditoriaContent />;
}