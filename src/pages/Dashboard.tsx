import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

interface User {
  id: number;
  nombre: string;
  email: string;
  tipo_usuario?: string;
  role?: string;
}

interface FarmData {
  totalHectareas: number;
  rendimientoPromedio: number;
  ingresosEstimados: number;
  actividadesRecientes: Array<{
    titulo: string;
    lote: string;
    fecha: string;
    tipo: 'fertilizacion' | 'plagas' | 'cosecha';
  }>;
  alertas: Array<{
    titulo: string;
    descripcion: string;
    tipo: 'info' | 'warning' | 'success';
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [restricted, setRestricted] = useState(false);
  const [farmData, setFarmData] = useState<FarmData>({
    totalHectareas: 0,
    rendimientoPromedio: 0,
    ingresosEstimados: 0,
    actividadesRecientes: [],
    alertas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      try {
        const userData = JSON.parse(userRaw);
        setUser(userData);
        const role = userData?.tipo_usuario || userData?.role;
        const coffeeGrowerRoles = ['coffee_grower', 'coffee-grower', 'farmer', 'user', 'caficultor', 'trabajador'];
        if (coffeeGrowerRoles.includes(role)) {
          setRestricted(true);
          navigate('/finca', { replace: true });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    setTimeout(() => {
      setFarmData({
        totalHectareas: 15.5,
        rendimientoPromedio: 1850,
        ingresosEstimados: 28700000,
        actividadesRecientes: [
          {
            titulo: 'Fertilización realizada',
            lote: 'Lote A',
            fecha: 'Hace 2 días',
            tipo: 'fertilizacion'
          },
          {
            titulo: 'Control de plagas aplicado',
            lote: 'Lote B',
            fecha: 'Hace 5 días',
            tipo: 'plagas'
          },
          {
            titulo: 'Cosecha programada',
            lote: 'Lote C',
            fecha: 'Próxima semana',
            tipo: 'cosecha'
          }
        ],
        alertas: [
          {
            titulo: 'Condiciones óptimas',
            descripcion: 'El clima es favorable para el crecimiento',
            tipo: 'success'
          },
          {
            titulo: 'Riego recomendado',
            descripcion: 'Programar riego para el lote A mañana',
            tipo: 'info'
          },
          {
            titulo: 'Mantenimiento preventivo',
            descripcion: 'Revisar equipos de riego próximamente',
            tipo: 'warning'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const getActivityColor = (tipo: string) => {
    switch (tipo) {
      case 'fertilizacion': return 'bg-green-500';
      case 'plagas': return 'bg-blue-500';
      case 'cosecha': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Dashboard {user?.nombre || 'Caficultor'}
          </h1>
          <p className="text-gray-600">Resumen de tu actividad agrícola</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hectáreas Cultivadas</p>
                <p className="text-2xl font-semibold text-gray-900">{farmData.totalHectareas}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rendimiento Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">{farmData.rendimientoPromedio}</p>
                <p className="text-xs text-gray-500">kg/hectárea</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos Estimados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(farmData.ingresosEstimados / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500">COP/año</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades Recientes</h3>
            <div className="space-y-3">
              {farmData.actividadesRecientes.map((actividad, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 ${getActivityColor(actividad.tipo)} rounded-full mr-3`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{actividad.titulo}</p>
                    <p className="text-xs text-gray-500">{actividad.lote} - {actividad.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas y Recomendaciones</h3>
            <div className="space-y-3">
              {farmData.alertas.map((alerta, index) => (
                <div key={index} className={`p-3 border rounded-lg ${getAlertColor(alerta.tipo)}`}>
                  <p className="text-sm font-medium">{alerta.titulo}</p>
                  <p className="text-xs mt-1">{alerta.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;