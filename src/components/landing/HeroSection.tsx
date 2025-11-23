import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCTAClick = () => {
    navigate('/login');
  };
  
  const handleScrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 via-green-700 to-amber-700 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-amber-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-40 right-20 w-16 h-16 bg-green-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-amber-300 rounded-full opacity-20 animate-pulse delay-500"></div>
      
      <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
        {/* Main Title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="block transform hover:scale-105 transition-transform duration-300">
              Transforma tu
            </span>
            <span className="block text-amber-300 transform hover:scale-105 transition-transform duration-300">
              Cafetal
            </span>
            <span className="block text-3xl md:text-4xl font-light mt-4">
              con Tecnología Colombiana
            </span>
          </h1>
        </div>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed text-green-100">
          Gestión inteligente de tu finca de café - Más productividad, mejor calidad, mayores ingresos
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <button
            onClick={handleCTAClick}
            className="group bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-green-900 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
          >
            <span className="flex items-center gap-2">
              Comienza Gratis Ahora
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
          
          <button
            onClick={handleScrollToFeatures}
            className="border-2 border-white text-white hover:bg-white hover:text-green-800 font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300 backdrop-blur-sm"
          >
            Conoce Más
          </button>
        </div>
        
        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span>100% Colombiano</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-300"></div>
            <span>Sin Costo de Instalación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-600"></div>
            <span>Soporte 24/7</span>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;