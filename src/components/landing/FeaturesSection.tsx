import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: '📊',
      title: 'Análisis de Rendimiento',
      description: 'Métricas detalladas de producción con gráficos interactivos y reportes personalizados',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: '🌱',
      title: 'Seguimiento de Cultivos',
      description: 'Control de crecimiento, salud y desarrollo de cada plantación en tiempo real',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: '💰',
      title: 'Gestión Financiera',
      description: 'Control completo de ingresos, egresos y rentabilidad de tu negocio',
      color: 'from-amber-500 to-amber-600'
    },
    {
      icon: '🌤️',
      title: 'Alertas Climáticas',
      description: 'Notificaciones personalizadas sobre condiciones meteorológicas y riesgos',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: '📦',
      title: 'Control de Inventario',
      description: 'Gestión inteligente de insumos, productos y materiales con alertas automáticas',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: '🚚',
      title: 'Logística Optimizada',
      description: 'Planificación y seguimiento de transporte para mayor eficiencia',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-green-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23059669%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Todo lo que necesitas para tu cafetal
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-amber-600">
              en un solo lugar
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Herramientas poderosas diseñadas específicamente para caficultores colombianos
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} rounded-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
              
              {/* Icon */}
              <div className="relative z-10 mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white text-2xl mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
        
        {/* Additional Features Banner */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Y mucho más...
            </h3>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-2xl mb-2">📱</div>
                <div className="text-sm font-semibold text-gray-700">App Móvil</div>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-sm font-semibold text-gray-700">Seguridad Total</div>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-sm font-semibold text-gray-700">Rapidez</div>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm font-semibold text-gray-700">Precisión</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;