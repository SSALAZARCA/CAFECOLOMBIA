import React from 'react';
import { useNavigate } from 'react-router-dom';

const CTASection: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCreateAccount = () => {
    navigate('/login?tab=register');
  };
  
  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-800 via-green-700 to-amber-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S10 15.523 10 10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-amber-400 rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-16 h-16 bg-green-400 rounded-full opacity-10 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-amber-300 rounded-full opacity-10 animate-pulse delay-500"></div>
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA */}
          <div className="mb-12">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Únete a la revolución del
              <span className="block text-amber-300">
                café colombiano
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
              Empieza hoy mismo. Sin costos de instalación. Soporte personalizado incluido.
            </p>
          </div>
          
          {/* Primary CTA Button */}
          <div className="mb-8">
            <button
              onClick={handleCreateAccount}
              className="group bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-green-900 font-bold py-6 px-12 rounded-full text-xl md:text-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl inline-flex items-center gap-3"
            >
              <span>Crear Cuenta Gratis</span>
              <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
          
          {/* Secondary CTA */}
          <div className="mb-12">
            <button
              onClick={handleLogin}
              className="text-white hover:text-amber-300 font-semibold py-3 px-6 rounded-full text-lg transition-all duration-300 border-2 border-white hover:border-amber-300 backdrop-blur-sm"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid md:grid-cols-3 gap-6 text-center mb-12">
            <div className="text-white">
              <div className="text-2xl font-bold mb-2">✓</div>
              <div className="text-sm opacity-90">Sin tarjeta de crédito</div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold mb-2">✓</div>
              <div className="text-sm opacity-90">Cancela cuando quieras</div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold mb-2">✓</div>
              <div className="text-sm opacity-90">Soporte 24/7</div>
            </div>
          </div>
          
          {/* Urgency Message */}
          <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm border border-white border-opacity-20">
            <div className="flex items-center justify-center gap-3 text-amber-300 mb-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">Oferta especial de lanzamiento</span>
              <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-white text-sm opacity-90">
              Primeros 100 caficultores reciben 3 meses premium gratis
            </p>
          </div>
        </div>
      </div>
      
      {/* Scroll to top indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-white hover:text-amber-300 transition-colors duration-300"
        >
          <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default CTASection;