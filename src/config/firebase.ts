// Firebase configuration for CaféColombia PWA
// Mock Firebase implementation for development

// Firebase types
export interface FirebaseApp {
  name: string;
  options: any;
}

export interface Messaging {
  app: FirebaseApp;
}

export interface FirebaseStorage {
  app: FirebaseApp;
}

export interface Firestore {
  app: FirebaseApp;
}

export interface Analytics {
  app: FirebaseApp;
}

// Mock Firebase functions for development
export const initializeApp = (config: any): FirebaseApp => ({
  name: 'mock-app',
  options: config
});

export const getMessaging = (): Messaging => ({
  app: { name: 'mock-app', options: {} }
});

export const isSupported = (): Promise<boolean> => Promise.resolve(false);

export const getStorage = (): FirebaseStorage => ({
  app: { name: 'mock-app', options: {} }
});

export const getFirestore = (): Firestore => ({
  app: { name: 'mock-app', options: {} }
});

export const getAnalytics = (): Analytics => ({
  app: { name: 'mock-app', options: {} }
});

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Mock Firebase configuration for development
const firebaseConfig: FirebaseConfig = {
  apiKey: 'mock-api-key',
  authDomain: 'mock-auth-domain',
  projectId: 'mock-project-id',
  storageBucket: 'mock-storage-bucket',
  messagingSenderId: 'mock-sender-id',
  appId: 'mock-app-id',
  measurementId: 'mock-measurement-id'
};

// Initialize Firebase with mock implementation
const app: FirebaseApp = initializeApp(firebaseConfig);
const messaging: Messaging = getMessaging();
const storage: FirebaseStorage = getStorage();
const firestore: Firestore = getFirestore();
const analytics: Analytics = getAnalytics();

// Export Firebase instances
export const getFirebaseApp = (): FirebaseApp => app;
export const getFirebaseMessaging = (): Messaging => messaging;
export const getFirebaseStorage = (): FirebaseStorage => storage;
export const getFirebaseFirestore = (): Firestore => firestore;
export const getFirebaseAnalytics = (): Analytics => analytics;

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return true; // Always true for mock implementation
};

// Mock Service Worker registration for FCM
export const registerFirebaseServiceWorker = async (): Promise<void> => {
  console.log('Mock Service Worker registration - no actual registration in development');
};

// Mock Firebase initialization function
export const initializeFirebase = async () => {
  console.log('Mock Firebase initialization - using development mode');
  return {
    app,
    messaging,
    storage,
    firestore,
    analytics
  };
};

// Default export for easy importing
export default {
  initializeFirebase,
  getFirebaseApp,
  getFirebaseMessaging,
  getFirebaseStorage,
  getFirebaseFirestore,
  getFirebaseAnalytics,
  isFirebaseConfigured,
  registerFirebaseServiceWorker
};