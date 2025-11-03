// =====================================================
// NAVEGACIÓN CON BREADCRUMBS Y PÁGINAS RECIENTES
// Café Colombia - Super Administrator Panel
// =====================================================

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Clock,
  Star,
  StarOff,
  X,
  MoreHorizontal
} from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ComponentType<any>;
}

interface RecentPage {
  path: string;
  label: string;
  timestamp: number;
  icon?: React.ComponentType<any>;
}

interface FavoritePage {
  path: string;
  label: string;
  icon?: React.ComponentType<any>;
}

interface BreadcrumbNavigationProps {
  className?: string;
  maxRecentPages?: number;
  maxBreadcrumbs?: number;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  className = '',
  maxRecentPages = 5,
  maxBreadcrumbs = 4
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [favoritePages, setFavoritePages] = useState<FavoritePage[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);

  // =====================================================
  // MAPEO DE RUTAS A LABELS E ICONOS
  // =====================================================

  const routeMap: Record<string, { label: string; icon?: React.ComponentType<any> }> = {
    '/admin': { label: 'Dashboard', icon: Home },
    '/admin/users': { label: 'Usuarios' },
    '/admin/coffee-growers': { label: 'Caficultores' },
    '/admin/payments': { label: 'Pagos' },
    '/admin/analytics': { label: 'Analíticas' },
    '/admin/settings': { label: 'Configuración' },
    '/admin/profile': { label: 'Mi Perfil' },
    '/admin/security': { label: 'Seguridad' },
    '/admin/notifications': { label: 'Notificaciones' },
    '/admin/reports': { label: 'Reportes' },
    '/admin/system': { label: 'Sistema' }
  };

  // =====================================================
  // CARGAR DATOS DESDE LOCALSTORAGE
  // =====================================================

  useEffect(() => {
    const savedRecent = localStorage.getItem('admin_recent_pages');
    const savedFavorites = localStorage.getItem('admin_favorite_pages');

    if (savedRecent) {
      try {
        setRecentPages(JSON.parse(savedRecent));
      } catch (error) {
        console.error('Error loading recent pages:', error);
      }
    }

    if (savedFavorites) {
      try {
        setFavoritePages(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorite pages:', error);
      }
    }
  }, []);

  // =====================================================
  // ACTUALIZAR PÁGINAS RECIENTES
  // =====================================================

  useEffect(() => {
    const currentPath = location.pathname;
    const routeInfo = routeMap[currentPath];

    if (routeInfo && currentPath !== '/admin') {
      const newPage: RecentPage = {
        path: currentPath,
        label: routeInfo.label,
        timestamp: Date.now(),
        icon: routeInfo.icon
      };

      setRecentPages(prev => {
        // Remover la página si ya existe
        const filtered = prev.filter(page => page.path !== currentPath);
        // Agregar al inicio
        const updated = [newPage, ...filtered].slice(0, maxRecentPages);
        
        // Guardar en localStorage
        localStorage.setItem('admin_recent_pages', JSON.stringify(updated));
        
        return updated;
      });
    }
  }, [location.pathname, maxRecentPages]);

  // =====================================================
  // GENERAR BREADCRUMBS
  // =====================================================

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Siempre incluir el dashboard como inicio
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/admin',
      icon: Home
    });

    // Construir breadcrumbs basados en la ruta actual
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      if (currentPath !== '/admin') {
        const routeInfo = routeMap[currentPath];
        if (routeInfo) {
          breadcrumbs.push({
            label: routeInfo.label,
            path: currentPath,
            icon: routeInfo.icon
          });
        }
      }
    });

    return breadcrumbs;
  };

  // =====================================================
  // MANEJO DE FAVORITOS
  // =====================================================

  const toggleFavorite = (path: string, label: string, icon?: React.ComponentType<any>) => {
    setFavoritePages(prev => {
      const exists = prev.find(fav => fav.path === path);
      let updated: FavoritePage[];

      if (exists) {
        updated = prev.filter(fav => fav.path !== path);
      } else {
        updated = [...prev, { path, label, icon }];
      }

      localStorage.setItem('admin_favorite_pages', JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (path: string): boolean => {
    return favoritePages.some(fav => fav.path === path);
  };

  // =====================================================
  // LIMPIAR PÁGINAS RECIENTES
  // =====================================================

  const clearRecentPages = () => {
    setRecentPages([]);
    localStorage.removeItem('admin_recent_pages');
    setShowRecentDropdown(false);
  };

  // =====================================================
  // FORMATEAR TIEMPO RELATIVO
  // =====================================================

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentPath = location.pathname;
  const currentRoute = routeMap[currentPath];

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 flex-1">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const shouldTruncate = breadcrumbs.length > maxBreadcrumbs && 
                                   index > 0 && 
                                   index < breadcrumbs.length - 2;

              if (shouldTruncate && index === 1) {
                return (
                  <React.Fragment key="truncated">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <button className="text-gray-500 hover:text-gray-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </React.Fragment>
                );
              }

              if (shouldTruncate) {
                return null;
              }

              return (
                <React.Fragment key={item.path}>
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                  
                  <div className="flex items-center space-x-1">
                    {isLast ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-gray-900 font-medium">
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span>{item.label}</span>
                        </div>
                        
                        {/* Botón de favorito */}
                        {currentPath !== '/admin' && (
                          <button
                            onClick={() => toggleFavorite(
                              currentPath, 
                              currentRoute?.label || 'Página', 
                              currentRoute?.icon
                            )}
                            className={`p-1 rounded transition-colors ${
                              isFavorite(currentPath)
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={isFavorite(currentPath) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          >
                            {isFavorite(currentPath) ? (
                              <Star className="h-4 w-4 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Páginas recientes y favoritas */}
          <div className="flex items-center space-x-4">
            {/* Favoritos */}
            {favoritePages.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Favoritos:</span>
                <div className="flex space-x-1">
                  {favoritePages.slice(0, 3).map((favorite) => (
                    <Link
                      key={favorite.path}
                      to={favorite.path}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors"
                      title={favorite.label}
                    >
                      {favorite.icon && <favorite.icon className="h-3 w-3" />}
                      <span className="max-w-20 truncate">{favorite.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Páginas recientes */}
            {recentPages.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  <span>Recientes</span>
                </button>

                {showRecentDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">Páginas Recientes</h3>
                        <button
                          onClick={clearRecentPages}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Limpiar
                        </button>
                      </div>
                      
                      <div className="space-y-1">
                        {recentPages.map((page) => (
                          <Link
                            key={page.path}
                            to={page.path}
                            onClick={() => setShowRecentDropdown(false)}
                            className="flex items-center justify-between p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              {page.icon && <page.icon className="h-4 w-4 text-gray-400" />}
                              <span>{page.label}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(page.timestamp)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreadcrumbNavigation;