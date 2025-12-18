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

// Placeholder component for routes being debugged
function PlaceholderPage({ pageName }: { pageName: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">🚧 Página en Mantenimiento</h1>
                    <p className="text-lg text-gray-600 mb-6">
                        La página <span className="font-semibold text-emerald-600">{pageName}</span> está temporalmente deshabilitada mientras solucionamos problemas técnicos.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>Backend operacional:</strong> El API y las funcionalidades del servidor están funcionando correctamente en <code className="bg-blue-100 px-2 py-1 rounded">http://31.97.128.11:3001</code>
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    useEffect(() => {
        const enableDiagnostic = (import.meta as any).env?.DEV || new URLSearchParams(window.location.search).has('diag');
        if (enableDiagnostic) {
            import("@/utils/moduleDiagnostic")
                .then((m: any) => m.runModuleDiagnostic?.())
                .catch(err => console.warn('⚠️ Error en diagnóstico de módulos:', err));
        }

        const onOnline = () => {
            console.log('🌐 Conexión restaurada');
            window.dispatchEvent(new Event('connection-restored'));
        };
        const onOffline = () => {
            console.log('📴 Conexión perdida');
        };
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        const initializePWA = async () => {
            try {
                await offlineDB.open();
                console.log('✅ Base de datos offline inicializada');

                await initializeSampleData();

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

                window.addEventListener('online', () => {
                    console.log('🌐 Conexión restaurada');
                    syncManager.handleConnectionRestored();
                });

                window.addEventListener('offline', () => {
                    console.log('📴 Conexión perdida');
                });

                if (DEVICE_DETECTION.isMobile()) {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.setAttribute('content',
                            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
                        );
                    }
                }

                if (DEVICE_DETECTION.isIOS()) {
                    document.addEventListener('gesturestart', (e) => {
                        e.preventDefault();
                    });
                }

                const themeColor = document.querySelector('meta[name="theme-color"]');
                if (themeColor) {
                    themeColor.setAttribute('content', '#059669');
                }

            } catch (error) {
                console.error('❌ Error inicializando PWA:', error);
            }
        };

        initializePWA();

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
                        {/* Core routes - tested and working */}
                        <Route path="/" element={
                            <ErrorBoundary>
                                <RootRedirect />
                            </ErrorBoundary>
                        } />

                        <Route path="/login" element={
                            <ErrorBoundary>
                                <LoginUniversal />
                            </ErrorBoundary>
                        } />

                        {/* Placeholder routes for pages being debugged */}
                        <Route path="/register" element={<PlaceholderPage pageName="Registro" />} />
                        <Route path="/dashboard" element={<PlaceholderPage pageName="Dashboard" />} />
                        <Route path="/finca" element={<PlaceholderPage pageName="Finca" />} />
                        <Route path="/insumos" element={<PlaceholderPage pageName="Insumos" />} />
                        <Route path="/mip" element={<PlaceholderPage pageName="MIP" />} />
                        <Route path="/alertas-ia" element={<PlaceholderPage pageName="Alertas IA" />} />
                        <Route path="/optimizacion-ia" element={<PlaceholderPage pageName="Optimización IA" />} />
                        <Route path="/analisis-mercado" element={<PlaceholderPage pageName="Análisis de Mercado" />} />
                        <Route path="/trazabilidad" element={<PlaceholderPage pageName="Trazabilidad" />} />

                        {/* Admin routes - all placeholders for now */}
                        <Route path="/admin/login" element={
                            <ErrorBoundary>
                                <LoginUniversal />
                            </ErrorBoundary>
                        } />
                        <Route path="/admin/*" element={<PlaceholderPage pageName="Panel de Administración" />} />

                        {/* Catch-all */}
                        <Route path="*" element={<PlaceholderPage pageName="Página No Encontrada" />} />
                    </Routes>

                    <Toaster position="top-right" richColors />
                </div>
            </Router>
        </ErrorBoundary>
    );
}
