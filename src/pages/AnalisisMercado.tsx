import React, { useState } from 'react';
import { ArrowLeft, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AnalisisMercadoIA from '../components/AnalisisMercadoIA';

const AnalisisMercado: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'analysis' | 'dashboard'>('analysis');

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header de Navegación */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver al Inicio</span>
                </button>

                <div className="h-6 w-px bg-gray-300"></div>

                <h1 className="text-xl font-semibold text-gray-900">
                  Análisis de Mercado IA
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="relative">
          <AnalisisMercadoIA />
        </div>
      </div>
    </Layout>
  );
};

export default AnalisisMercado;