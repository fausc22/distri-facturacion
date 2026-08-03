import dynamic from 'next/dynamic';
import Head from 'next/head';
import toast from '@/components/shared/toast';
import useAuth from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IngresosProvider, useIngresos } from '../../context/IngresosContext';
import { useHistorialIngresos } from '../../hooks/ingresos/useHistorialIngresos';
import { useDetalleIngresos } from '../../hooks/ingresos/useDetalleIngresos';
import { useNuevoIngreso } from '../../hooks/ingresos/useNuevoIngreso';
import { useCuentasIngresos } from '../../hooks/ingresos/useCuentasIngresos';

import BarraAccionesIngresos from '../../components/ingresos/BarraAccionesIngresos';
import FiltrosIngresos from '../../components/ingresos/FiltrosIngresos';
import TablaIngresos from '../../components/ingresos/TablaIngresos';
import { Paginacion } from '../../components/Paginacion';

const ModalNuevoIngreso = dynamic(() => import('../../components/ingresos/ModalNuevoIngreso'), {
  ssr: false,
});
const ModalDetalleIngreso = dynamic(() => import('../../components/ingresos/ModalDetalleIngreso'), {
  ssr: false,
});

function HistorialIngresosContent() {
  const {
    mostrarFiltros,
    loading,
    modales,
    detalle,
    setMostrarFiltros
  } = useIngresos();

  // Hooks para operaciones
  const {
    ingresos,
    totalIngresos,
    totalRegistros,
    filtros,
    paginacion,
    totalPaginas,
    cargarIngresos,
    aplicarFiltros,
    limpiarFiltros,
    cambiarPagina,
    cambiarRegistrosPorPagina,
    handleFiltroChange
  } = useHistorialIngresos();

  const {
    verDetalle,
    cerrarDetalle,
    imprimirDetalle
  } = useDetalleIngresos();

  const {
    formData,
    registrarIngreso,
    handleInputChange,
    abrirModal,
    cerrarModal
  } = useNuevoIngreso();

  const { cuentas } = useCuentasIngresos();

  useAuth();

  // Handlers para barra de acciones
  const handleBusquedaChange = (e) => {
    handleFiltroChange('busqueda', e.target.value);
  };

  const handleBuscar = () => {
    aplicarFiltros();
  };

  const handleToggleFiltros = () => {
    setMostrarFiltros(!mostrarFiltros);
  };

  const handleActualizar = () => {
    cargarIngresos();
  };

  // Handler para registrar ingreso
  const handleRegistrarIngreso = async () => {
    await registrarIngreso();
  };

  // Handler para imprimir
  const handleImprimir = (ingreso) => {
    toast.info("Funcionalidad de impresión en desarrollo");
  };

  // Calcular índices para paginación
  const indexOfPrimero = (paginacion.paginaActual - 1) * paginacion.registrosPorPagina;
  const indexOfUltimo = Math.min(
    indexOfPrimero + paginacion.registrosPorPagina, 
    totalRegistros
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 p-4">
      <Head>
        <title>VERTIMAR | HISTORIAL DE INGRESOS</title>
        <meta name="description" content="Historial de ingresos en el sistema VERTIMAR" />
      </Head>

      <Card className="mx-auto w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">HISTORIAL DE INGRESOS</CardTitle>
        </CardHeader>
        <CardContent>
        {/* Barra de acciones */}
        <BarraAccionesIngresos
          busqueda={filtros.busqueda}
          mostrarFiltros={mostrarFiltros}
          onBusquedaChange={handleBusquedaChange}
          onBuscar={handleBuscar}
          onToggleFiltros={handleToggleFiltros}
          onNuevoIngreso={abrirModal}
          onActualizar={handleActualizar}
        />
        
        {/* Filtros avanzados */}
        <FiltrosIngresos
          mostrar={mostrarFiltros}
          filtros={filtros}
          cuentas={cuentas}
          onFiltroChange={handleFiltroChange}
          onAplicarFiltros={aplicarFiltros}
          onLimpiarFiltros={limpiarFiltros}
        />
        
        {/* Tabla de ingresos */}
        <TablaIngresos
          ingresos={ingresos}
          totalIngresos={totalIngresos}
          loading={loading.ingresos}
          onVerDetalle={verDetalle}
          onImprimir={handleImprimir}
        />
        
        {/* Paginación - Reutilizando componente existente */}
        {ingresos.length > 0 && (
          <Paginacion
            datosOriginales={{ length: totalRegistros }} // Simular array para compatibilidad
            paginaActual={paginacion.paginaActual}
            registrosPorPagina={paginacion.registrosPorPagina}
            totalPaginas={totalPaginas}
            indexOfPrimero={indexOfPrimero}
            indexOfUltimo={indexOfUltimo}
            onCambiarPagina={cambiarPagina}
            onCambiarRegistrosPorPagina={cambiarRegistrosPorPagina}
          />
        )}
        </CardContent>
      </Card>

      {modales.nuevoIngreso && (
        <ModalNuevoIngreso
          mostrar
          formData={formData}
          cuentas={cuentas}
          loading={loading.operacion}
          onInputChange={handleInputChange}
          onRegistrar={handleRegistrarIngreso}
          onCerrar={cerrarModal}
        />
      )}

      {modales.detalle && (
      <ModalDetalleIngreso
        mostrar
        detalle={detalle}
        onCerrar={cerrarDetalle}
        onImprimir={imprimirDetalle}
      />
      )}
    </div>
  );
}

export default function HistorialIngresos() {
  return (
    <IngresosProvider>
      <HistorialIngresosContent />
    </IngresosProvider>
  );
}