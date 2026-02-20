import Head from 'next/head';
import HistorialPedidos from './HistorialPedidos';

export default function HistorialPedidosOffline() {
  return (
    <>
      <Head>
        <title>VERTIMAR | HISTORIAL OFFLINE</title>
        <meta name="description" content="Historial de pedidos offline en VERTIMAR" />
      </Head>
      <HistorialPedidos />
    </>
  );
}
