import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import LoginUniversal from "@/pages/LoginUniversal";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Finca from "@/pages/Finca";
import Insumos from "@/pages/Insumos";
import MIP from "@/pages/MIP";
import AlertasIA from "@/pages/AlertasIA";
import OptimizacionIA from "@/pages/OptimizacionIA";
import AnalisisMercado from "@/pages/AnalisisMercado";
import Traceability from "@/pages/Traceability";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCoffeeGrowers from "@/pages/admin/AdminCoffeeGrowers";
import AdminFarms from "@/pages/admin/AdminFarms";
import AdminSubscriptionPlans from "@/pages/admin/AdminSubscriptionPlans";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminReports from "@/pages/admin/AdminReports";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminAudit from "@/pages/admin/AdminAudit";
import AdminSecurity from "@/pages/admin/AdminSecurity";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminProfile from "@/pages/admin/AdminProfile";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import ProtectedHome from "@/pages/ProtectedHome";
import { offlineDB } from "./utils/offlineDB";
import { PERMISSIONS } from "@/hooks/usePermissions";
import { syncManager } from "./utils/syncManager";
import { notificationManager } from "./utils/notificationManager";
import { DEVICE_DETECTION } from "./utils/pwaConfig";
import { initializeSampleData } from "./utils/sampleData";
import { pushNotificationService } from "./services/pushNotificationService";
import { cloudInitializer } from "./services/cloudInitializer";
import ErrorBoundary from "./components/ErrorBoundary";
import RootRedirect from "./components/RootRedirect";
import { Toaster } from "sonner";

export default function App() {
  useEffect(() => {
    // Inicializar PWA
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
        } catch {}

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

    // Cleanup
    return () => {
      window.removeEventListener('online', syncManager.handleConnectionRestored);
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
