import React, { useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import LoginUniversal from "@/pages/LoginUniversal";

import ProtectedHome from "@/pages/ProtectedHome";
import { offlineDB } from "./utils/offlineDB";
import { syncManager } from "./utils/syncManager";
import { PERMISSIONS } from "@/hooks/usePermissions";
import { notificationManager } from "./utils/notificationManager";
import { DEVICE_DETECTION } from "./utils/pwaConfig";
import { initializeSampleData } from "./utils/sampleData";
import { pushNotificationService } from "./services/pushNotificationService";
import { cloudInitializer } from "./services/cloudInitializer";
import ErrorBoundary from "./components/ErrorBoundary";
import RootRedirect from "./components/RootRedirect";
import { Toaster } from "sonner";
// SettingsPage se carga con React.lazy más abajo
import StartupGuard from '@/components/StartupGuard';
import EmergencyFallback from '@/components/EmergencyFallback';
// Fallbacks locales definidos más abajo

function LoadingHomeInline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-600">Cargando inicio…</p>
        <p className="mt-1 text-xs text-gray-400">Preparando módulos y datos básicos</p>
      </div>
    </div>
  );
}

function HomeFallbackInline() {
  const readBasicStats = () => {
    try {
      const lots = JSON.parse(localStorage.getItem('lots') || '[]');
      const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      return {
        lots: Array.isArray(lots) ? lots.length : 0,
        inventoryItems: Array.isArray(inventory) ? inventory.length : 0,
        pendingTasks: Array.isArray(tasks) ? tasks.filter((t: any) => t?.status !== 'Completada').length : 0,
      };
    } catch {
      return { lots: 0, inventoryItems: 0, pendingTasks: 0 };
    }
  };

  const [stats, setStats] = React.useState(readBasicStats());
  React.useEffect(() => {
    setStats(readBasicStats());
  }, []);

  const quickAdd = (key: string, item: any) => {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push({ ...item, id: Date.now().toString(), createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(arr));
      setStats(readBasicStats());
    } catch { }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900">Inicio básico</h1>
          <p className="text-sm text-gray-600">Cargando versión ligera por problemas de red</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded"><p className="text-xs text-gray-500">Lotes</p><p className="text-lg font-semibold">{stats.lots}</p></div>
            <div className="p-3 bg-gray-50 rounded"><p className="text-xs text-gray-500">Insumos</p><p className="text-lg font-semibold">{stats.inventoryItems}</p></div>
            <div className="p-3 bg-gray-50 rounded"><p className="text-xs text-gray-500">Tareas</p><p className="text-lg font-semibold">{stats.pendingTasks}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button className="p-3 border rounded hover:bg-emerald-50" onClick={() => quickAdd('harvests', { quantity: 0 })}>Registrar cosecha</button>
            <button className="p-3 border rounded hover:bg-emerald-50" onClick={() => quickAdd('inventory', { inputId: 'insumo', quantity: 1, unit: 'kg' })}>Agregar insumo</button>
            <button className="p-3 border rounded hover:bg-emerald-50" onClick={() => quickAdd('tasks', { title: 'Nueva tarea', status: 'Pendiente', dueDate: new Date().toISOString() })}>Crear tarea</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Estado</h2>
          <p className="text-xs text-gray-600">Online: {String(navigator.onLine)}</p>
          <p className="text-xs text-gray-600">API: {(import.meta as any).env?.VITE_API_URL || 'no definido'}</p>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 text-xs border rounded" onClick={() => location.reload()}>Reintentar carga completa</button>
            <button className="px-3 py-1 text-xs border rounded" onClick={() => localStorage.setItem('emergency_mode', '1')}>Activar modo emergencia</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Ejecutar diagnóstico de módulos en desarrollo o cuando se pasa ?diag=1
    const enableDiagnostic = (import.meta as any).env?.DEV || new URLSearchParams(window.location.search).has('diag');
    if (enableDiagnostic) {
      import("@/utils/moduleDiagnostic")
        .then((m: any) => m.runModuleDiagnostic?.())
        .catch(err => console.warn('⚠️ Error en diagnóstico de módulos:', err));
    }

    // Listeners de conexión definidos en el scope del efecto
    const onOnline = () => {
      console.log('🌐 Conexión restaurada');
      window.dispatchEvent(new Event('connection-restored'));
    };
    const onOffline = () => {
      console.log('📴 Conexión perdida');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Inicializar PWA y servicios
    const initializePWA = async () => {
      try {
        // Inicializar base de datos offline
        await offlineDB.open();
        console.log('✅ Base de datos offline inicializada');

        // Inicializar datos de ejemplo
        await initializeSampleData();

        // Inicialización de PWA (el Service Worker se registra automáticamente por VitePWA)
        if (DEVICE_DETECTION.supportsBackgroundSync()) {
          await syncManager.registerBackgroundSync();
        }

        if (DEVICE_DETECTION.supportsNotifications()) {
          notificationManager.setupEventHandlers();
        }

        try {
          const initResult = await cloudInitializer.initialize();
          if (initResult.success) {
            await pushNotificationService.initialize();
          }
        } catch { }

        // Configurar listeners para eventos de conexión
        window.addEventListener('online', () => {
          console.log('🌐 Conexión restaurada');
          syncManager.handleConnectionRestored();
        });

        window.addEventListener('offline', () => {
          console.log('📴 Conexión perdida');
        });

        // Configurar viewport para móviles
        if (DEVICE_DETECTION.isMobile()) {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content',
              'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
            );
          }
        }

        // Prevenir zoom en iOS
        if (DEVICE_DETECTION.isIOS()) {
          document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
          });
        }

        // Configurar tema para dispositivos
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) {
          themeColor.setAttribute('content', '#059669');
        }

      } catch (error) {
        console.error('❌ Error inicializando PWA:', error);
      }
    };

    initializePWA();

    // Cleanup de efectos y listeners
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🚨 App-level error:', error);
        console.error('📍 Error Info:', errorInfo);
      }}
    >
      <Router>
        <div className="relative">
          <Routes>
            <Route path="/register" element={
              <ErrorBoundary>
                <Register />
              </ErrorBoundary>
            } />
            <Route path="/dashboard" element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            } />
            <Route path="/finca" element={
              <ErrorBoundary>
                <Finca />
              </ErrorBoundary>
            } />
            <Route path="/insumos" element={
              <ErrorBoundary>
                <Insumos />
              </ErrorBoundary>
            } />
            <Route path="/mip" element={
              <ErrorBoundary>
                <MIP />
              </ErrorBoundary>
            } />
            <Route path="/alertas-ia" element={
              <ErrorBoundary>
                <AlertasIA />
              </ErrorBoundary>
            } />
            <Route path="/optimizacion-ia" element={
              <ErrorBoundary>
                <OptimizacionIA />
              </ErrorBoundary>
            } />
            <Route path="/analisis-mercado" element={
              <ErrorBoundary>
                <AnalisisMercado />
              </ErrorBoundary>
            } />
            <Route path="/trazabilidad" element={
              <ErrorBoundary>
                <Traceability />
              </ErrorBoundary>
            } />
            <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />

            {/* Ruta principal - Redirección automática */}
            <Route path="/" element={
              <ErrorBoundary>
                <RootRedirect />
              </ErrorBoundary>
            } />

            {/* Login unificado */}
            <Route path="/login" element={
              <ErrorBoundary>
                <LoginUniversal />
              </ErrorBoundary>
            } />

            {/* Admin Routes - Login unificado */}
            <Route path="/admin/login" element={
              <ErrorBoundary>
                <LoginUniversal />
              </ErrorBoundary>
            } />
            <Route path="/admin/*" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route index element={
                        <ProtectedRoute requiredRole="admin" requiredPermissions={[PERMISSIONS.DASHBOARD_VIEW]}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="dashboard" element={
                        <ProtectedRoute requiredRole="admin" requiredPermissions={[PERMISSIONS.DASHBOARD_VIEW]}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="users" element={
                        <ProtectedRoute requiredRole="admin" requiredPermissions={[PERMISSIONS.USERS_VIEW]}>
                          <AdminUsers />
                        </ProtectedRoute>
                      } />
                      <Route path="coffee-growers" element={
                        <ProtectedRoute requiredRole="admin" requiredPermissions={[PERMISSIONS.GROWERS_VIEW]}>
                          <AdminCoffeeGrowers />
                        </ProtectedRoute>
                      } />
                      <Route path="farms" element={
                        <ProtectedRoute requiredRole="admin" requiredPermissions={[PERMISSIONS.FARMS_VIEW]}>
                          <AdminFarms />
                        </ProtectedRoute>
                      } />
                      <Route path="subscription-plans" element={
                        <ProtectedRoute requiredPermissions={[PERMISSIONS.PLANS_VIEW]} requiredRole="admin">
                          <AdminSubscriptionPlans />
                        </ProtectedRoute>
                      } />
                      <Route path="subscriptions" element={
                        <ProtectedRoute requiredPermissions={[PERMISSIONS.SUBSCRIPTIONS_VIEW]}>
                          <AdminSubscriptions />
                        </ProtectedRoute>
                      } />
                      <Route path="payments" element={
                        <ProtectedRoute requiredPermissions={[PERMISSIONS.PAYMENTS_VIEW]}>
                          <AdminPayments />
                        </ProtectedRoute>
                      } />
                      <Route path="reports" element={
                        <ProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_VIEW]}>
                          <AdminReports />
                        </ProtectedRoute>
                      } />
                      <Route path="analytics" element={
                        <ProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_VIEW]}>
                          <AdminAnalytics />
                        </ProtectedRoute>
                      } />
                      <Route path="profile" element={
                        <ProtectedRoute>
                          <AdminProfile />
                        </ProtectedRoute>
                      } />
                      <Route path="audit" element={
                        <ProtectedRoute requiredPermissions={[PERMISSIONS.AUDIT_VIEW]} requiredRole="admin">
                          <AdminAudit />
                        </ProtectedRoute>
                      } />
                      <Route path="security" element={
                        <ProtectedRoute requiredPermissions={[PERMISSIONS.SECURITY_VIEW]} requiredRole="admin">
                          <AdminSecurity />
                        </ProtectedRoute>
                      } />
                      <Route path="settings" element={
                        <ProtectedRoute requiredPermissions={[PERMISSIONS.SETTINGS_VIEW]} requiredRole="admin">
                          <AdminSettings />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              </ErrorBoundary>
            } />
          </Routes>

          {/* Toaster para notificaciones del admin */}
          <Toaster position="top-right" richColors />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

// Eager imports reemplazados por lazy imports para evitar cargar módulos pesados en arranque
const Home = React.lazy(() => import('@/pages/Home'));
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Finca = React.lazy(() => import('@/pages/Finca'));
const Insumos = React.lazy(() => import('@/pages/Insumos'));
const MIP = React.lazy(() => import('@/pages/MIP'));
const AlertasIA = React.lazy(() => import('@/pages/AlertasIA'));
const OptimizacionIA = React.lazy(() => import('@/pages/OptimizacionIA'));
const AnalisisMercado = React.lazy(() => import('@/pages/AnalisisMercado'));
const Traceability = React.lazy(() => import('@/pages/Traceability'));
const SettingsPage = React.lazy(() => import('@/pages/UserSettings'));
const AdminLayout = React.lazy(() => import('@/components/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('@/pages/admin/AdminUsers'));
const AdminCoffeeGrowers = React.lazy(() => import('@/pages/admin/AdminCoffeeGrowers'));
const AdminFarms = React.lazy(() => import('@/pages/admin/AdminFarms'));
const AdminSubscriptionPlans = React.lazy(() => import('@/pages/admin/AdminSubscriptionPlans'));
const AdminSubscriptions = React.lazy(() => import('@/pages/admin/AdminSubscriptions'));
const AdminPayments = React.lazy(() => import('@/pages/admin/AdminPayments'));
const AdminReports = React.lazy(() => import('@/pages/admin/AdminReports'));
const AdminAnalytics = React.lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminAudit = React.lazy(() => import('@/pages/admin/AdminAudit'));
const AdminSecurity = React.lazy(() => import('@/pages/admin/AdminSecurity'));
const AdminSettings = React.lazy(() => import('@/pages/admin/AdminSettings'));
const AdminProfile = React.lazy(() => import('@/pages/admin/AdminProfile'));
const ProtectedRoute = React.lazy(() => import('@/components/admin/ProtectedRoute'));
