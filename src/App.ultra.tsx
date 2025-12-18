import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "sonner";

// Ultra-minimal placeholder
function SimplePage({ title }: { title: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-2xl">
                <h1 className="text-3xl font-bold mb-4">{title}</h1>
                <p className="text-gray-600 mb-6">Versión mínima de la aplicación desplegada para debugging.</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                        ✅ Backend operacional en <code className="bg-green-100 px-2 py-1 rounded">http://31.97.128.11:3001</code>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function App() {
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
                        <Route path="*" element={<SimplePage title="Café Colombia - Modo Mantenimiento" />} />
                    </Routes>
                    <Toaster position="top-right" richColors />
                </div>
            </Router>
        </ErrorBoundary>
    );
}
