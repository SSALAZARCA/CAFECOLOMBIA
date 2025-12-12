import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { default as tsconfigPaths } from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')

  return {
<<<<<<< HEAD
    plugins: [
      react({
        babel: {
          plugins: [
            'react-dev-locator',
          ],
=======
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
    VitePWA({
      // Evitar inyección automática del script de registro, usamos registro manual en App.tsx
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      strategies: 'generateSW',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // IMPORTANTE: Deshabilitar navigateFallback para evitar redirecciones incorrectas
        // navigateFallback: null,
        // Lista negra para rutas de SPA - EVITAR redirecciones
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/dashboard/,
          /^\/finca/,
          /^\/insumos/,
          /^\/mip/,
          /^\/alertas-ia/,
          /^\/optimizacion-ia/,
          /^\/analisis-mercado/,
          /^\/trazabilidad/,
          /^\/configuracion/,
          /^\/admin/,
          /^\/login/,
          /^\/register/
        ],
        globPatterns: ['**/*.{js,css,ico,png,svg,json,txt,woff2,html}'],
        globIgnores: [],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 }
            }
          },
          // Passthrough directo para health/ping del mismo origen
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/health') || url.pathname.startsWith('/api/ping'),
            handler: 'NetworkOnly'
          },
          // Cache de API del mismo origen
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache-v2',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v2',
              expiration: { maxEntries: 200, maxAgeSeconds: 2592000 }
            }
          }
        ]
      },
      manifest: {
        name: 'CaféColombia - Gestión de Fincas Cafeteras',
        short_name: 'CaféColombia',
        description: 'Aplicación para gestión integral de fincas cafeteras con cumplimiento BPA y funcionalidad offline',
        theme_color: '#2E7D32',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'business'],
        lang: 'es',
        icons: [
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/screenshot-mobile.png',
            sizes: '720x1280',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      }
    })
  ],
  // Optimizaciones para producción
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['date-fns', 'clsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode !== 'production'
  },
  // Optimizaciones de desarrollo
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  server: {
    port: 5178,
    strictPort: true,
    proxy: {
      '/api': {
        target: (process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || 'http://localhost:3001'),
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
        },
      }),
      traeBadgePlugin({
        variant: 'dark',
        position: 'bottom-right',
        prodOnly: true,
        clickable: true,
        clickUrl: 'https://www.trae.ai/solo?showJoin=1',
        autoTheme: true,
        autoThemeTarget: '#root'
      }),
      tsconfigPaths(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,woff2}'],
          maximumFileSizeToCacheInBytes: 5000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 86400
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 2592000
                }
              }
            }
          ]
        },
        manifest: {
          name: 'CaféColombia - Gestión de Fincas Cafeteras',
          short_name: 'CaféColombia',
          description: 'Aplicación para gestión integral de fincas cafeteras con cumplimiento BPA y funcionalidad offline',
          theme_color: '#2E7D32',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          categories: ['productivity', 'business'],
          lang: 'es',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide'
            },
            {
              src: '/screenshot-narrow.png',
              sizes: '720x1280',
              type: 'image/png',
              form_factor: 'narrow'
            }
          ]
        }
      })
    ],
    // Optimizaciones para producción
    build: {
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            utils: ['date-fns', 'clsx']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: mode !== 'production'
    },
    // Optimizaciones de desarrollo
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    },
    server: {
      host: '127.0.0.1',
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
    }
  }
})
