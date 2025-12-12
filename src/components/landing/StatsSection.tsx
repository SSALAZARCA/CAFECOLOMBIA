import React, { useState, useEffect } from 'react';

const StatsSection: React.FC = () => {
  const [animatedStats, setAnimatedStats] = useState({
    farmers: 0,
    hectares: 0,
    sales: 0,
    satisfaction: 0
  });

  const stats = [
    {
      label: 'Caficultores Activos',
      value: 5000,
      suffix: '+',
      icon: '👨‍🌾',
      color: 'text-green-600',
      description: 'Productores confían en nosotros'
    },
    {
      label: 'Hectáreas Gestión',
      value: 50000,
      suffix: '+',
      icon: '🌱',
      color: 'text-amber-600',
      description: 'De café produciendo'
    },
    {
      label: 'Ventas Facilitadas',
      value: 2000,
      suffix: 'M+',
      icon: '💰',
      color: 'text-blue-600',
      description: 'En pesos colombianos'
    },
    {
      label: 'Satisfacción',
      value: 95,
      suffix: '%',
      icon: '😊',
      color: 'text-purple-600',
      description: 'De nuestros usuarios'
    }
  ];

  useEffect(() => {
    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        callback(current);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    };

    // Animate stats when component mounts
    animateValue(0, 5000, 2000, (value) => {
      setAnimatedStats(prev => ({ ...prev, farmers: value }));
    });
    animateValue(0, 50000, 2500, (value) => {
      setAnimatedStats(prev => ({ ...prev, hectares: value }));
    });
    animateValue(0, 2000, 3000, (value) => {
      setAnimatedStats(prev => ({ ...prev, sales: value }));
    });
    animateValue(0, 95, 1500, (value) => {
      setAnimatedStats(prev => ({ ...prev, satisfaction: value }));
    });
  }, []);

  const getAnimatedValue = (index: number) => {
    switch (index) {
      case 0: return animatedStats.farmers;
      case 1: return animatedStats.hectares;
      case 2: return animatedStats.sales;
      case 3: return animatedStats.satisfaction;
      default: return 0;
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-white to-green-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23000%22 fill-opacity=%220.05%22 fill-rule=%22evenodd%22%3E%3Cpath d=%22M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S10 15.523 10 10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Números que hablan
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-amber-600">
              por sí solos
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Resultados reales de nuestra comunidad de caficultores
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 text-center"
            >
              {/* Icon */}
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              
              {/* Animated Number */}
              <div className={`text-3xl md:text-4xl font-bold mb-2 ${stat.color}`}>
                {getAnimatedValue(index).toLocaleString()}{stat.suffix}
              </div>
              
              {/* Label */}
              <div className="text-lg font-semibold text-gray-800 mb-2">
                {stat.label}
              </div>
              
              {/* Description */}
              <div className="text-sm text-gray-600">
                {stat.description}
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${stat.color.replace('text-', 'from-')} rounded-full transition-all duration-1000`}
                  style={{ width: `${(getAnimatedValue(index) / stat.value) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional Metrics */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-amber-600 rounded-2xl p-8 text-white text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold mb-2">+2 años</div>
              <div className="text-sm opacity-90">En el mercado</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-sm opacity-90">Soporte disponible</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-sm opacity-90">Colombiano</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;