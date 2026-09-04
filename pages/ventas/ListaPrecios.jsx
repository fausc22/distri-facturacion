import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from '@/components/shared/toast';
import useAuth from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { ListaPreciosProvider, useListaPrecios } from '../../context/ListaPreciosContext';
import { useGenerarPDF } from '../../hooks/ventas/useGenerarPDFListaPrecio';
import { ModalPDFUniversal, BotonGenerarPDFUniversal } from '../../components/shared/ModalPDFUniversal';

import ClienteSelectorListaPrecios from '../../components/pedidos/SelectorClientesLP';
import ProductoSelector from '../../components/pedidos/SelectorProductosLP';
import ProductosCarritoListaPrecios from '../../components/ventas/ProductosCarritoLP';
import { ModalConfirmacionSalida } from '../../components/ventas/ModalesConfirmacion';

function GenerarListaPreciosContent() {
  const { cliente, productos, clearLista } = useListaPrecios();
  const { 
    loading, 
    pdfURL, 
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    generarPdfListaPrecios, 
    descargarPDF, 
    compartirPDF, 
    cerrarModalPDF 
  } = useGenerarPDF();
  
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);

  useAuth();

  const handleGenerarPDF = () => {
    if (!cliente) {
      toast.error('Debe seleccionar un cliente.');
      return;
    }
    
    if (productos.length === 0) {
      toast.error('Debe agregar al menos un producto.');
      return;
    }
    
    generarPdfListaPrecios(cliente, productos);
  };

  const handleConfirmarSalida = () => {
    if (cliente || productos.length > 0) {
      setMostrarConfirmacionSalida(true);
    } else {
      window.location.href = '/';
    }
  };

  const handleSalir = () => {
    clearLista();
    cerrarModalPDF();
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/30 p-4">
      <Head>
        <title>VERTIMAR | LISTA DE PRECIOS</title>
        <meta name="description" content="Generador de listas de precios" />
      </Head>

      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">LISTA DE PRECIOS</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col gap-6 md:flex-row">
          <ClienteSelectorListaPrecios />
          <ProductoSelector />
        </div>

        <ProductosCarritoListaPrecios />

        <div className="mt-6 flex flex-col justify-end gap-4 sm:flex-row">
          <BotonGenerarPDFUniversal
            onGenerar={handleGenerarPDF}
            loading={loading}
            texto="Generar Lista de Precios"
          />
          <Button variant="danger" onClick={handleConfirmarSalida}>
            Volver al Menú
          </Button>
        </div>
        </CardContent>
      </Card>
      
      {/* Modal PDF Unificado */}
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

      <ModalConfirmacionSalida
        mostrar={mostrarConfirmacionSalida}
        onConfirmar={handleSalir}
        onCancelar={() => setMostrarConfirmacionSalida(false)}
      />
    </div>
  );
}

export default function GenerarListaPrecios() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      toast.error('Solo los gerentes pueden acceder a lista de precios.');
      router.push('/inicio');
    }
  }, [user, router]);

  if (!user || user.rol !== 'GERENTE') {
    return null;
  }

  return (
    <ListaPreciosProvider>
      <GenerarListaPreciosContent />
    </ListaPreciosProvider>
  );
}