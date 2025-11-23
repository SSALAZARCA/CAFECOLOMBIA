# Documentación Técnica - Landing Page Caficultores

## 1. Arquitectura de Componentes

### 1.1 Estructura de Archivos
```
src/
├── pages/
│   ├── LandingPage.tsx          # Componente principal
│   └── LoginUniversal.tsx       # Login unificado existente
├── components/
│   └── landing/
│       ├── HeroSection.tsx
│       ├── BenefitsSection.tsx
│       ├── FeaturesSection.tsx
│       ├── TestimonialsSection.tsx
│       ├── StatsSection.tsx
│       ├── CTASection.tsx
│       └── FooterSection.tsx
├── components/ui/
│   ├── ButtonCTA.tsx
│   ├── FeatureCard.tsx
│   ├── TestimonialCard.tsx
│   └── StatItem.tsx
└── assets/
    └── images/
        ├── hero-coffee-farm.jpg
        ├── farmer-1.jpg
        ├── farmer-2.jpg
        ├── farmer-3.jpg
        └── coffee-beans-bg.jpg
```

### 1.2 Componente Principal - LandingPage.tsx
```typescript
import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import StatsSection from '../components/landing/StatsSection';
import CTASection from '../components/landing/CTASection';
import FooterSection from '../components/landing/FooterSection';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-white">
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <StatsSection />
      <CTASection />
      <FooterSection />
    </div>
  );
};

export default LandingPage;
```

## 2. Configuración de Rutas en App.tsx

### 2.1 Actualización de Rutas
```typescript
import LandingPage from './pages/LandingPage';
import LoginUniversal from './pages/LoginUniversal';

// Dentro del componente Routes:
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<LoginUniversal />} />
<Route path="/admin/login" element={<Navigate to="/login" replace />} />
```

### 2.2 Protección de Rutas Existentes
Mantener la lógica actual de rutas protegidas sin cambios.

## 3. Componentes Detallados

### 3.1 HeroSection.tsx
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonCTA from '../ui/ButtonCTA';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCTAClick = () => {
    navigate('/login');
  };
  
  const handleScrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-coffee-green to-coffee-brown">
      <div className="absolute inset-0 bg-coffee-farm bg-cover bg-center opacity-30"></div>
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Transforma tu Cafetal con Tecnología Colombiana
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Gestión inteligente de tu finca de café - Más productividad, mejor calidad, mayores ingresos
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ButtonCTA onClick={handleCTAClick} variant="primary">
            Comienza Gratis Ahora
          </ButtonCTA>
          <ButtonCTA onClick={handleScrollToFeatures} variant="secondary">
            Conoce Más
          </ButtonCTA>
        </div>
      </div>
    </section>
  );
};
```

### 3.2 BenefitsSection.tsx
```typescript
import React from 'react';
import FeatureCard from '../ui/FeatureCard';

const benefits = [
  {
    icon: '📈',
    title: 'Aumenta tu Productividad',
    description: 'Hasta 30% más rendimiento con nuestro sistema de gestión inteligente',
    color: 'bg-green-coffee'
  },
  {
    icon: '🤝',
    title: 'Conecta con Compradores',
    description: 'Accede directamente a mercados nacionales e internacionales',
    color: 'bg-brown-coffee'
  },
  {
    icon: '📱',
    title: 'Gestión Simplificada',
    description: 'Control total de tu finca desde tu celular',
    color: 'bg-gold-coffee'
  }
];

const BenefitsSection: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
          Por qué miles de caficultores eligen Café Colombia
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <FeatureCard key={index} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  );
};
```

### 3.3 FeaturesSection.tsx
```typescript
import React from 'react';

const features = [
  { icon: '📊', title: 'Análisis de Rendimiento', desc: 'Métricas detalladas de producción' },
  { icon: '🌱', title: 'Seguimiento de Cultivos', desc: 'Control de crecimiento y salud' },
  { icon: '💰', title: 'Gestión Financiera', desc: 'Ingresos, egresos y rentabilidad' },
  { icon: '🌤️', title: 'Alertas Climáticas', desc: 'Notificaciones personalizadas' },
  { icon: '📦', title: 'Inventario', desc: 'Control de insumos y productos' },
  { icon: '🚚', title: 'Logística', desc: 'Optimización de transporte' }
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-16 bg-cream-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
          Todo lo que necesitas para tu cafetal en un solo lugar
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

### 3.4 CTASection.tsx
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonCTA from '../ui/ButtonCTA';

const CTASection: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 bg-gradient-to-r from-coffee-green to-coffee-brown text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Únete a la revolución del café colombiano
        </h2>
        <p className="text-xl mb-8">
          Empieza hoy mismo. Sin costos de instalación.
        </p>
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <ButtonCTA onClick={() => navigate('/login?tab=register')} variant="primary">
            Crear Cuenta Gratis
          </ButtonCTA>
          <ButtonCTA onClick={() => navigate('/login')} variant="outline">
            ¿Ya tienes cuenta? Inicia sesión
          </ButtonCTA>
        </div>
      </div>
    </section>
  );
};
```

## 4. Estilos CSS - Tailwind Config

### 4.1 Extensión de Colores
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'coffee-green': '#4A5D23',
        'coffee-brown': '#8B4513',
        'coffee-gold': '#D4AF37',
        'cream-white': '#FFF8F0',
      },
      backgroundImage: {
        'coffee-farm': "url('/src/assets/images/hero-coffee-farm.jpg')",
        'coffee-beans': "url('/src/assets/images/coffee-beans-bg.jpg')",
      }
    }
  }
}
```

### 4.2 Animaciones
```css
/* Animaciones suaves */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s ease-out;
}
```

## 5. Optimización de Imágenes

### 5.1 Formatos y Tamaños
- Hero image: 1920x1080px, formato WebP, < 200KB
- Testimonios: 400x400px, formato WebP, < 50KB cada una
- Backgrounds: Patrones SVG o WebP optimizados

### 5.2 Lazy Loading
```typescript
import { LazyLoadImage } from 'react-lazy-load-image-component';

const HeroSection: React.FC = () => {
  return (
    <div className="relative">
      <LazyLoadImage
        src="/images/hero-coffee-farm.webp"
        alt="Finca de café en Colombia"
        effect="blur"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};
```

## 6. SEO y Metadatos

### 6.1 React Helmet
```typescript
import { Helmet } from 'react-helmet';

const LandingPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Café Colombia - Transforma tu Cafetal con Tecnología</title>
        <meta name="description" content="Gestión inteligente de fincas de café en Colombia. Aumenta tu productividad, conecta con compradores y controla todo desde tu celular." />
        <meta name="keywords" content="café colombia, gestión finca café, caficultores, tecnología café, producción café" />
        <meta property="og:title" content="Café Colombia - Tecnología para Caficultores" />
        <meta property="og:description" content="Transforma tu cafetal con tecnología colombiana" />
        <meta property="og:image" content="/images/og-image.jpg" />
      </Helmet>
      {/* Resto del componente */}
    </>
  );
};
```

## 7. Testing

### 7.1 Tests Unitarios
```typescript
// LandingPage.test.tsx
describe('LandingPage', () => {
  it('renders hero section', () => {
    render(<LandingPage />);
    expect(screen.getByText('Transforma tu Cafetal')).toBeInTheDocument();
  });
  
  it('navigates to login on CTA click', () => {
    render(<LandingPage />);
    const ctaButton = screen.getByText('Comienza Gratis Ahora');
    fireEvent.click(ctaButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
```

### 7.2 Tests de Responsive
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

## 8. Performance

### 8.1 Bundle Size
- Target: < 200KB para landing page
- Code splitting para componentes pesados
- Lazy loading de imágenes

### 8.2 Lighthouse Score Targets
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95

## 9. Analytics

### 9.1 Event Tracking
```typescript
// Google Analytics events
const trackCTAClick = (buttonText: string) => {
  gtag('event', 'click', {
    event_category: 'CTA',
    event_label: buttonText,
    value: 1
  });
};
```

### 9.2 Conversion Funnel
1. Landing page view
2. CTA click
3. Login page view
4. Registration start
5. Registration complete

## 10. Deployment Checklist

- [ ] Optimizar imágenes
- [ ] Minificar CSS/JS
- [ ] Configurar CDN
- [ ] Set up analytics
- [ ] Test en staging
- [ ] Mobile testing
- [ ] Cross-browser testing
- [ ] Performance audit
- [ ] SEO validation
- [ ] Deploy a producción