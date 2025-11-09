// components/PublicLayout.jsx - Layout para páginas públicas

import Head from 'next/head';
import { Toaster } from 'react-hot-toast';

const PublicLayout = ({ children, title = "VERTIMAR", description = "" }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Sin AppHeader - Completamente público */}
      <main className="min-h-screen">
        {children}
      </main>
      
      {/* Toast notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
};

export default PublicLayout;