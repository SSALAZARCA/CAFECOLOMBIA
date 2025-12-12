import React from 'react';

const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: '📈',
      title: 'Aumenta tu Productividad',
      description: 'Hasta 30% más rendimiento con nuestro sistema de gestión inteligente',
      color: 'from-green-600 to-green-700',
      features: ['Análisis de rendimiento', 'Optimización de procesos', 'Control de calidad']
    },
    {
      icon: '🤝',
      title: 'Conecta con Compradores',
      description: 'Accede directamente a mercados nacionales e internacionales',
      color: 'from-amber-600 to-amber-700',
      features: ['Catálogo digital', 'Contacto directo', 'Mejores precios']
    },
    {
      icon: '📱',
      title: 'Gestión Simplificada',
      description: 'Control total de tu finca desde tu celular',
      color: 'from-blue-600 to-blue-700',
      features: ['App móvil', 'Acceso offline', 'Sincronización automática']
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23000%22 fill-opacity=%220.1%22 fill-rule=%22evenodd%22%3E%3Cpath d=%22M0 40L40 0H20L0 20M40 40V20L20 40%22/%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Por qué miles de caficultores eligen
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-amber-600">
              Café Colombia
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tecnología desarrollada por y para caficultores colombianos
          </p>
        </div>
        
        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
            >
              {/* Card Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${benefit.color} text-white text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
              
              {/* Features List */}
              <div className="space-y-3">
                {benefit.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${benefit.color}`}></div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Hover Effect Border */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          ))}
        </div>
        
        {/* Stats Bar */}
        <div className="mt-16 bg-gradient-to-r from-green-50 to-amber-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-green-700 mb-2">5,000+</div>
              <div className="text-gray-600 text-sm">Caficultores Activos</div>
            </div>
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-amber-700 mb-2">50,000+</div>
              <div className="text-gray-600 text-sm">Hectáreas Gestión</div>
            </div>
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-blue-700 mb-2">95%</div>
              <div className="text-gray-600 text-sm">Satisfacción</div>
            </div>
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-purple-700 mb-2">24/7</div>
              <div className="text-gray-600 text-sm">Soporte</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;