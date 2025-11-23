import React from 'react';

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Carlos Rodríguez',
      location: 'Antioquia',
      image: '👨‍🌾',
      testimonial: 'Aumenté mi producción en un 25% el primer año. El sistema me ayudó a optimizar el uso de fertilizantes y controlar mejor las plagas.',
      rating: 5,
      farmSize: '15 hectáreas',
      improvement: '+25% producción'
    },
    {
      name: 'María González',
      location: 'Huila',
      image: '👩‍🌾',
      testimonial: 'Ahora vendo mi café directamente a exportadores. He duplicado mis ingresos al eliminar intermediarios y acceder a mejores precios.',
      rating: 5,
      farmSize: '8 hectáreas',
      improvement: '2x ingresos'
    },
    {
      name: 'Juan Pérez',
      location: 'Nariño',
      image: '👨‍💼',
      testimonial: 'El sistema me ha ahorrado tiempo y dinero. Puedo controlar toda mi finca desde mi celular y tomar decisiones más inteligentes.',
      rating: 5,
      farmSize: '20 hectáreas',
      improvement: '-30% costos'
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23000%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S10 15.523 10 10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Caficultores que ya transformaron
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-amber-600">
              su negocio
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Historias reales de éxito de productores colombianos
          </p>
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 text-6xl text-green-200 opacity-20">
                "
              </div>
              
              {/* Profile */}
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-amber-500 rounded-full flex items-center justify-center text-2xl text-white mr-4 shadow-lg">
                  {testimonial.image}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{testimonial.name}</h3>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                  <div className="flex mt-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-amber-400">⭐</span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Testimonial Text */}
              <p className="text-gray-700 leading-relaxed mb-6 italic">
                "{testimonial.testimonial}"
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{testimonial.farmSize}</div>
                  <div className="text-xs text-gray-500">Tamaño finca</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{testimonial.improvement}</div>
                  <div className="text-xs text-gray-500">Mejora</div>
                </div>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-amber-100 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
            </div>
          ))}
        </div>
        
        {/* CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-amber-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            ¿Quieres ser el próximo caso de éxito?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Únete a miles de caficultores que ya están transformando su negocio
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Resultados comprobados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Soporte personalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Tecnología innovadora</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;