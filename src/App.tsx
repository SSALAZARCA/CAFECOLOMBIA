import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import LandingPage from '@/pages/LandingPage';
import LoginUniversal from '@/pages/LoginUniversal';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCoffeeGrowers from '@/pages/admin/AdminCoffeeGrowers';
import AdminFarms from '@/pages/admin/AdminFarms';
import AdminPayments from '@/pages/admin/AdminPayments';
import AdminSubscriptions from '@/pages/admin/AdminSubscriptions';
import AdminReports from '@/pages/admin/AdminReports';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminSubscriptionPlans from '@/pages/admin/AdminSubscriptionPlans';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSecurity from '@/pages/admin/AdminSecurity';
import AdminAudit from '@/pages/admin/AdminAudit';
import AdminProfile from '@/pages/admin/AdminProfile';

// Importaciones de Páginas de Caficultor
import Finca from '@/pages/Finca';
import Insumos from '@/pages/Insumos';
import MIP from '@/pages/MIP';
import AlertasIA from '@/pages/AlertasIA';
import OptimizacionIA from '@/pages/OptimizacionIA';
import AnalisisMercado from '@/pages/AnalisisMercado';
import Traceability from '@/pages/Traceability';
import Workers from '@/pages/Workers';
import Configuracion from '@/pages/Configuracion';

function App() {
    return (
        <Router>
            <Toaster position="top-right" />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginUniversal />} />

                {/* Rutas de Caficultor - Los componentes ya incluyen Layout internamente */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/finca" element={<Finca />} />
                <Route path="/insumos" element={<Insumos />} />
                <Route path="/mip" element={<MIP />} />
                <Route path="/alertas-ia" element={<AlertasIA />} />
                <Route path="/optimizacion-ia" element={<OptimizacionIA />} />
                <Route path="/colaboradores" element={<Workers />} />
                <Route path="/analisis-mercado" element={<AnalisisMercado />} />
                <Route path="/trazabilidad" element={<Traceability />} />
                <Route path="/configuracion" element={<Configuracion />} />

                {/* Rutas de Admin - Protegidas por AdminLayout */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />

                    {/* Módulos de Administración */}
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="coffee-growers" element={<AdminCoffeeGrowers />} />
                    <Route path="farms" element={<AdminFarms />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="subscriptions" element={<AdminSubscriptions />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="subscription-plans" element={<AdminSubscriptionPlans />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="security" element={<AdminSecurity />} />
                    <Route path="audit" element={<AdminAudit />} />
                    <Route path="profile" element={<AdminProfile />} />
                </Route>

                {/* Redirección por defecto */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
