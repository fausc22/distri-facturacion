import dynamic from 'next/dynamic';
import Head from 'next/head';
import toast from '@/components/shared/toast';
import useAuth from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { EgresosProvider, useEgresos } from '../../context/EgresosContext';
import { useHistorialEgresos } from '../../hooks/egresos/useHistorialEgresos';
import { useDetalleEgresos } from '../../hooks/egresos/useDetalleEgresos';
import { useNuevoEgreso } from '../../hooks/egresos/useNuevoEgreso';
import { useCuentasEgresos } from '../../hooks/egresos/useCuentasEgresos';

import BarraAccionesEgresos from '../../components/egresos/BarraAccionesEgresos';
import FiltrosEgresos from '../../components/egresos/FiltrosEgresos';
import TablaEgresos from '../../components/egresos/TablaEgresos';
import { Paginacion } from '../../components/Paginacion';

const ModalNuevoEgreso = dynamic(() => import('../../components/egresos/ModalNuevoEgreso'), {
  ssr: false,
});
const ModalDetalleEgreso = dynamic(() => import('../../components/egresos/ModalDetalleEgreso'), {
  ssr: false,
});

function HistorialEgresosContent() {
  const {
    mostrarFiltros,
    loading,
    modales,
    detalle,
    setMostrarFiltros
  } = useEgresos();

  // Hooks para operaciones
  const {
    egresos,
    totalEgresos,
    totalRegistros,
    filtros,
    paginacion,
    totalPaginas,
    cargarEgresos,
    aplicarFiltros,
    limpiarFiltros,
    cambiarPagina,
    cambiarRegistrosPorPagina,
    handleFiltroChange
  } = useHistorialEgresos();

  const {
    verDetalle,
    cerrarDetalle,
    imprimirDetalle
  } = useDetalleEgresos();

  const {
    formData,
    registrarEgreso,
    handleInputChange,
    abrirModal,
    cerrarModal
  } = useNuevoEgreso();

  const { cuentas } = useCuentasEgresos();

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
    cargarEgresos();
  };

  // Handler para registrar egreso
  const handleRegistrarEgreso = async () => {
    await registrarEgreso();
  };

  // Handler para imprimir
  const handleImprimir = (egreso) => {
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
        <title>VERTIMAR | HISTORIAL DE EGRESOS</title>
        <meta name="description" content="Historial de egresos en el sistema VERTIMAR" />
      </Head>

      <Card className="mx-auto w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">HISTORIAL DE EGRESOS</CardTitle>
        </CardHeader>
        <CardContent>
        {/* Barra de acciones */}
        <BarraAccionesEgresos
          busqueda={filtros.busqueda}
          mostrarFiltros={mostrarFiltros}
          onBusquedaChange={handleBusquedaChange}
          onBuscar={handleBuscar}
          onToggleFiltros={handleToggleFiltros}
          onNuevoEgreso={abrirModal}
          onActualizar={handleActualizar}
        />
        
        {/* Filtros avanzados */}
        <FiltrosEgresos
          mostrar={mostrarFiltros}
          filtros={filtros}
          cuentas={cuentas}
          onFiltroChange={handleFiltroChange}
          onAplicarFiltros={aplicarFiltros}
          onLimpiarFiltros={limpiarFiltros}
        />
        
        {/* Tabla de egresos */}
        <TablaEgresos
          egresos={egresos}
          totalEgresos={totalEgresos}
          loading={loading.egresos}
          onVerDetalle={verDetalle}
          onImprimir={handleImprimir}
        />
        
        {/* Paginación - Reutilizando componente existente */}
        {egresos.length > 0 && (
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

      {modales.nuevoEgreso && (
        <ModalNuevoEgreso
          mostrar
          formData={formData}
          cuentas={cuentas}
          loading={loading.operacion}
          onInputChange={handleInputChange}
          onRegistrar={handleRegistrarEgreso}
          onCerrar={cerrarModal}
        />
      )}

      {modales.detalle && (
        <ModalDetalleEgreso
          mostrar
          detalle={detalle}
          onCerrar={cerrarDetalle}
          onImprimir={imprimirDetalle}
        />
      )}
    </div>
  );
}

export default function HistorialEgresos() {
  return (
    <EgresosProvider>
      <HistorialEgresosContent />
    </EgresosProvider>
  );
}