import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Package, Bug, BarChart3, Settings, Brain, Target, TrendingUp, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

const baseItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Gestión de Finca', href: '/finca', icon: MapPin },
  { name: 'Control de Insumos', href: '/insumos', icon: Package },
  { name: 'Manejo de Plagas', href: '/mip', icon: Bug },
  { name: 'Alertas IA', href: '/alertas-ia', icon: Brain },
  { name: 'Optimización IA', href: '/optimizacion-ia', icon: Target },
  { name: 'Análisis de Mercado', href: '/analisis-mercado', icon: TrendingUp },
  { name: 'Trazabilidad', href: '/trazabilidad', icon: BarChart3 },
  { name: 'Colaboradores', href: '/colaboradores', icon: Users },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Navigation({ isOpen, onClose }: NavigationProps) {
  const location = useLocation();
  const normalizeRole = (r?: string) => {
    if (!r) return '';
    return String(r).toLowerCase().trim().replace(/[\s-]+/g, '_');
  };

  const isGrowerRole = (role: string) => {
    const growerRoles = ['coffee_grower', 'coffee-grower', 'caficultor', 'cafetero', 'farmer', 'usuario', 'user', 'trabajador'];
    return growerRoles.includes(role);
  };

  const initialItems = (() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        const role = normalizeRole(u?.tipo_usuario || u?.role);
        if (isGrowerRole(role)) return baseItems.filter(i => i.name !== 'Dashboard');
      }
    } catch { }
    return baseItems;
  })();

  const [navigationItems, setNavigationItems] = useState(initialItems);

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const rawRole = user?.tipo_usuario || user?.role;
        const role = normalizeRole(rawRole);
        if (isGrowerRole(role)) {
          setNavigationItems(baseItems.filter(i => i.name !== 'Dashboard'));
        } else {
          setNavigationItems(baseItems);
        }
      } catch { }
    }
  }, []);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menú Principal</h2>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Café Colombia v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
