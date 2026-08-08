const baseConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Dev y build no comparten carpeta: evita ENOENT de manifests si corrés ambos a la vez
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  // Evita fallos de webpack con ESM de Radix (__webpack_require__.t)
  transpilePackages: [
    '@radix-ui/react-slot',
    '@radix-ui/react-dialog',
    '@radix-ui/react-label',
    '@radix-ui/react-select',
  ],

  async headers() {
    return [
      {
        source: '/ventas/RegistrarPedido',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/inicio',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],

  fallbacks: {
    document: '/_offline',
  },

  cacheOnFrontEndNav: true,

  runtimeCaching: [
    {
      // Páginas críticas: SOLO mismo origen (nunca interceptar backend cross-origin)
      urlPattern: ({ url }) => {
        if (url.origin !== self.location.origin) return false;
        const normalized = url.pathname.replace(/\/+$/, '') || '/';
        return [
          '/',
          '/inicio',
          '/login',
          '/ventas/RegistrarPedido',
          '/ventas/HistorialPedidosOffline',
        ].includes(normalized);
      },
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'critical-pages',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: ({ url }) =>
        url.origin === self.location.origin &&
        url.pathname.startsWith('/_next/static/chunks/'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'js-chunks',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: ({ url }) =>
        url.origin === self.location.origin &&
        url.pathname.startsWith('/_next/static/'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: ({ url }) =>
        url.origin === self.location.origin &&
        /\/_next\/static\/chunks\/pages\/(ventas|components).*\.js$/.test(url.pathname),
      handler: 'CacheFirst',
      options: {
        cacheName: 'pedidos-components',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: ({ url }) =>
        url.origin === self.location.origin &&
        (url.pathname === '/manifest.json' ||
          url.pathname === '/favicon.ico' ||
          url.pathname.endsWith('.png')),
      handler: 'CacheFirst',
      options: {
        cacheName: 'pwa-assets',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      // Solo /api/* del mismo origen (Next API routes si existieran).
      // NUNCA /ping, /health, /auth ni escrituras del backend cross-origin.
      urlPattern: ({ url }) =>
        url.origin === self.location.origin && url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24,
        },
        networkTimeoutSeconds: 5,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Solo documentos navegados del mismo origen. Evita cachear como páginas
      // respuestas del backend cuando NEXT_PUBLIC_API_URL apunta a otro host.
      // Excluye explícitamente conectividad (/ping, /health) aunque fueran same-origin.
      urlPattern: ({ request, url }) =>
        request.mode === 'navigate' &&
        url.origin === self.location.origin &&
        url.pathname !== '/ping' &&
        url.pathname !== '/health',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
        networkTimeoutSeconds: 3,
      },
    },
  ],
});

module.exports =
  process.env.NODE_ENV === 'production' ? withPWA(baseConfig) : baseConfig;
