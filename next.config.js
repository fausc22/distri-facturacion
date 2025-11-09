const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: false, // ✅ Cambio: No forzar actualización inmediata
  disable: false,
  buildExcludes: [/middleware-manifest\.json$/],

  runtimeCaching: [
    {
      // ✅ ASSETS ESTÁTICOS (_next/static) - Cache permanente (OK porque tienen hash)
      urlPattern: /^https?:\/\/[^\/]+\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año OK - archivos con hash
        },
      },
    },
    {
      // ✅ IMÁGENES Y ASSETS PWA - Cache largo
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-assets',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
        },
      },
    },
    {
      // ✅ MANIFEST - Cache corto
      urlPattern: /\/manifest\.json$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'manifest-cache',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60 * 24, // 1 día
        },
      },
    },
    {
      // ✅ API - NetworkFirst con timeout corto
      urlPattern: /^https?:\/\/[^\/]+\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutos
        },
        networkTimeoutSeconds: 3,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // ✅ FUENTES EXTERNAS - Cache largo
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      // ✅ PÁGINAS - NetworkFirst para mantener actualizado
      urlPattern: /^https?:\/\/[^\/]+\/(?!api).*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60, // 1 hora - Mucho más corto
        },
        networkTimeoutSeconds: 2,
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,

  // ✅ Headers simplificados y correctos
  async headers() {
    return [
      {
        // Solo assets estáticos con hash pueden tener immutable
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Service worker sin cache
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
});
