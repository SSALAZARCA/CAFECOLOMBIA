// Service Worker para funcionamiento offline
// Workbox manifest injection point
self.__WB_MANIFEST;

const CACHE_NAME = 'cafe-colombia-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Recursos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Recursos dinámicos que se pueden cachear
const CACHEABLE_ROUTES = [
  '/api/fincas',
  '/api/lotes',
  '/api/cultivos',
  '/api/insumos',
  '/api/alertas',
  '/api/trazabilidad'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia para recursos estáticos
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estrategia para API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Estrategia para tiles de mapas
  if (url.hostname.includes('openstreetmap') || 
      url.hostname.includes('tile') ||
      url.pathname.includes('.png') && url.searchParams.has('z')) {
    event.respondWith(cacheFirstWithNetworkFallback(request));
    return;
  }

  // Estrategia por defecto para otros recursos
  event.respondWith(networkFirst(request));
});

/**
 * Cache First - Buscar primero en cache, luego en red
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First - Intentar red primero, luego cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback para navegación
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First con fallback específico para API
 */
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error(`HTTP ${networkResponse.status}`);
  } catch (error) {
    console.warn('API request failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Agregar header para indicar que viene del cache
      const response = cachedResponse.clone();
      response.headers.set('X-From-Cache', 'true');
      return response;
    }
    
    // Fallback con datos vacíos para APIs
    const fallbackData = getFallbackData(request.url);
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-From-Fallback': 'true'
      }
    });
  }
}

/**
 * Cache First con Network Fallback para tiles de mapas
 */
async function cacheFirstWithNetworkFallback(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`HTTP ${networkResponse.status}`);
  } catch (error) {
    console.warn('Tile request failed:', error);
    
    // Fallback a tile offline genérico
    return new Response(getOfflineTile(), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-From-Fallback': 'true'
      }
    });
  }
}

/**
 * Obtener datos de fallback para diferentes endpoints
 */
function getFallbackData(url) {
  const pathname = new URL(url).pathname;
  
  if (pathname.includes('/fincas')) {
    return { data: [], message: 'Datos offline - fincas' };
  }
  
  if (pathname.includes('/lotes')) {
    return { data: [], message: 'Datos offline - lotes' };
  }
  
  if (pathname.includes('/cultivos')) {
    return { 
      data: [
        {
          id: 'cafe-arabica-offline',
          nombre: 'Café Arábica (Offline)',
          variedad: 'Datos no disponibles',
          estado: 'offline'
        }
      ], 
      message: 'Datos offline - cultivos' 
    };
  }
  
  if (pathname.includes('/optimizacion')) {
    return {
      data: {
        currentCosts: { water: 0, fertilizer: 0, pesticide: 0, total: 0 },
        optimizedCosts: { water: 0, fertilizer: 0, pesticide: 0, total: 0 },
        roiAnalysis: { roi: 0, paybackPeriod: 0 },
        recommendations: ['Datos no disponibles en modo offline']
      },
      message: 'Análisis offline'
    };
  }
  
  return { data: null, message: 'Datos no disponibles offline' };
}

/**
 * Generar tile offline simple (1x1 pixel transparente)
 */
function getOfflineTile() {
  // PNG transparente de 1x1 pixel
  const transparentPng = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  
  return transparentPng.buffer;
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.keys().then(cacheNames => {
      event.ports[0].postMessage({
        caches: cacheNames,
        isOnline: navigator.onLine
      });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('🎯 Service Worker loaded successfully');