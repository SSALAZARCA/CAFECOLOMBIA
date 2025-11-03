// Firebase Messaging Service Worker
// This file is required for Firebase Cloud Messaging to work in the background

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration (should match your app config)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'CaféColombia';
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    actions: [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app or navigate to specific page
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle push events (fallback)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const title = data.notification?.title || 'CaféColombia';
    const options = {
      body: data.notification?.body || 'Nueva notificación',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});