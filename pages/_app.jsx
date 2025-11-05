import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router'
import { AuthProvider } from '../components/AuthProvider';
import DefaultLayout from '../components/DefaultLayout';
import PublicLayout from '../components/PublicLayout';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const publicRoutes = ['/login', '/comprobante-publico'];
  const isPublicRoute = publicRoutes.some(route => router.pathname.startsWith(route));

  const getLayout = Component.getLayout || ((page) => (
    isPublicRoute ? page : <DefaultLayout>{page}</DefaultLayout>
  ));

  return (
    <AuthProvider>
      {isPublicRoute ? (
        <PublicLayout>
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </PublicLayout>
      ) : (
        <div className="bg-secondary-light dark:bg-primary-dark transition duration-300">
          {getLayout(<Component {...pageProps} />)}
          <Toaster position="top-right" />
        </div>
      )}
    </AuthProvider>
  );
}

export default MyApp;