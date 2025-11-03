import { 
  Home, 
  MapPin, 
  Package, 
  Bug, 
  Wheat, 
  DollarSign, 
  FileText, 
  CheckSquare,
  X,
  LogOut
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: MapPin, label: 'Finca', path: '/finca' },
  { icon: Package, label: 'Insumos', path: '/inventory' },
  { icon: Bug, label: 'MIP', path: '/pests' },
  { icon: Wheat, label: 'Cosecha', path: '/harvests' },
  { icon: DollarSign, label: 'Finanzas', path: '/finance' },
  { icon: CheckSquare, label: 'Tareas', path: '/tasks' },
  { icon: FileText, label: 'Reportes', path: '/reports' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info and logout section */}
          <div className="p-4 border-t border-gray-200">
            {user && (
              <div className="mb-3 px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}