/**
 * Configuración global para PWA
 */

export const PWA_CONFIG = {
  // Configuración de cache
  CACHE_NAMES: {
    STATIC: 'cafe-colombia-static-v1',
    DYNAMIC: 'cafe-colombia-dynamic-v1',
    API: 'cafe-colombia-api-v1',
    IMAGES: 'cafe-colombia-images-v1'
  },

  // Configuración de sincronización
  SYNC: {
    RETRY_DELAY: 5000, // 5 segundos
    MAX_RETRIES: 3,
    BATCH_SIZE: 10,
    BACKGROUND_SYNC_TAG: 'cafe-colombia-sync'
  },

  // Configuración de notificaciones
  NOTIFICATIONS: {
    ICON: '/pwa-192x192.png',
    BADGE: '/pwa-192x192.png',
    DEFAULT_ACTIONS: [
      {
        action: 'view',
        title: 'Ver detalles',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar',
        icon: '/pwa-192x192.png'
      }
    ]
  },

  // Configuración de almacenamiento
  STORAGE: {
    MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_OFFLINE_ITEMS: 1000,
    CLEANUP_THRESHOLD: 0.8 // Limpiar cuando se use el 80% del espacio
  },

  // URLs que siempre deben estar disponibles offline
  CRITICAL_URLS: [
    '/',
    '/finca',
    '/insumos',
    '/traceability',
    '/offline.html'
  ],

  // Patrones de URLs para diferentes estrategias de cache
  CACHE_STRATEGIES: {
    CACHE_FIRST: [
      /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      /\.(?:css|js)$/,
      /\/pwa-.*\.png$/
    ],
    NETWORK_FIRST: [
      /\/api\//,
      /\/supabase\//
    ],
    STALE_WHILE_REVALIDATE: [
      /\.(?:html)$/,
      /\/$/
    ]
  },

  // Configuración de instalación
  INSTALL: {
    PROMPT_DELAY: 3000, // 3 segundos después de cargar
    DISMISS_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 días
    SHOW_AFTER_VISITS: 2 // Mostrar después de 2 visitas
  }
};

/**
 * Configuración específica por plataforma
 */
export const PLATFORM_CONFIG = {
  ios: {
    statusBarStyle: 'default',
    viewportFit: 'cover',
    homeScreenIcon: '/pwa-192x192.png'
  },
  android: {
    themeColor: '#059669',
    backgroundColor: '#ffffff',
    navigationColor: '#ffffff'
  },
  desktop: {
    windowControls: 'overlay',
    titleBarAreaHeight: '32px'
  }
};

/**
 * Configuración de tipos de notificación
 */
export const NOTIFICATION_TYPES = {
  TASK_REMINDER: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'task-reminder',
    requireInteraction: false,
    actions: [
      { action: 'complete', title: 'Marcar como completada' },
      { action: 'snooze', title: 'Recordar en 1 hora' }
    ]
  },
  PEST_ALERT: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'pest-alert',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Ver detalles' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  },
  HARVEST_READY: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'harvest-ready',
    requireInteraction: false,
    actions: [
      { action: 'schedule', title: 'Programar cosecha' },
      { action: 'view', title: 'Ver lote' }
    ]
  },
  INPUT_EXPIRY: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'input-expiry',
    requireInteraction: false,
    actions: [
      { action: 'reorder', title: 'Reordenar' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  },
  WEATHER_ALERT: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'weather-alert',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Ver pronóstico' },
      { action: 'prepare', title: 'Preparar finca' }
    ]
  },
  SYNC_COMPLETE: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'sync-complete',
    requireInteraction: false,
    silent: true
  }
};

/**
 * Configuración de calidad de conexión
 */
export const CONNECTION_QUALITY = {
  THRESHOLDS: {
    GOOD: 1000, // < 1 segundo
    FAIR: 3000, // < 3 segundos
    POOR: 5000  // < 5 segundos
  },
  TEST_URL: '/api/ping', // Always use internal API for connectivity tests
  TEST_INTERVAL: 30000 // 30 segundos
};

/**
 * Configuración de gestos táctiles
 */
export const TOUCH_CONFIG = {
  SWIPE_THRESHOLD: 50, // píxeles mínimos para detectar swipe
  PULL_TO_REFRESH_THRESHOLD: 60, // píxeles para activar pull-to-refresh
  LONG_PRESS_DURATION: 500, // milisegundos para long press
  DOUBLE_TAP_DELAY: 300, // milisegundos entre taps para double tap
  HAPTIC_PATTERNS: {
    LIGHT: [10],
    MEDIUM: [20],
    HEAVY: [30],
    SUCCESS: [10, 50, 10],
    ERROR: [50, 50, 50]
  }
};

/**
 * Configuración de optimización móvil
 */
export const MOBILE_CONFIG = {
  VIEWPORT: {
    WIDTH: 'device-width',
    INITIAL_SCALE: 1,
    MAXIMUM_SCALE: 1,
    USER_SCALABLE: 'no',
    VIEWPORT_FIT: 'cover'
  },
  PERFORMANCE: {
    LAZY_LOAD_THRESHOLD: '100px',
    IMAGE_QUALITY: 0.8,
    DEBOUNCE_DELAY: 300
  },
  UI: {
    MIN_TOUCH_TARGET: 44, // píxeles mínimos para targets táctiles
    SAFE_AREA_INSETS: true,
    DARK_MODE_SUPPORT: true
  }
};

/**
 * Utilidades para detectar características del dispositivo
 */
export const DEVICE_DETECTION = {
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: () => /Android/.test(navigator.userAgent),
  isMobile: () => /Mobi|Android/i.test(navigator.userAgent),
  isTablet: () => /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
  isDesktop: () => !DEVICE_DETECTION.isMobile() && !DEVICE_DETECTION.isTablet(),
  isStandalone: () => window.matchMedia('(display-mode: standalone)').matches,
  supportsServiceWorker: () => 'serviceWorker' in navigator,
  supportsNotifications: () => 'Notification' in window,
  supportsPushManager: () => 'PushManager' in window,
  supportsBackgroundSync: () => 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
  supportsWebShare: () => 'share' in navigator,
  supportsVibration: () => 'vibrate' in navigator
};