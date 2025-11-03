import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, MapPin, CreditCard, FileText, Clock, ArrowRight } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'user' | 'farm' | 'payment' | 'report' | 'page';
  url: string;
  icon: React.ComponentType<any>;
  metadata?: string;
}

interface GlobalSearchProps {
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { useAuthenticatedFetch } = useAdminStore();

  // Cargar búsquedas recientes del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      
      // Simular búsqueda en múltiples endpoints
      const [usersResponse, farmsResponse, paymentsResponse] = await Promise.allSettled([
        searchUsers(searchQuery),
        searchFarms(searchQuery),
        searchPayments(searchQuery)
      ]);

      const searchResults: SearchResult[] = [];

      // Procesar resultados de usuarios
      if (usersResponse.status === 'fulfilled') {
        usersResponse.value.forEach((user: any) => {
          searchResults.push({
            id: `user-${user.id}`,
            title: `${user.firstName} ${user.lastName}`,
            subtitle: user.email,
            type: 'user',
            url: `/admin/users?search=${user.id}`,
            icon: Users,
            metadata: user.role
          });
        });
      }

      // Procesar resultados de fincas
      if (farmsResponse.status === 'fulfilled') {
        farmsResponse.value.forEach((farm: any) => {
          searchResults.push({
            id: `farm-${farm.id}`,
            title: farm.name,
            subtitle: `${farm.location} - ${farm.ownerName}`,
            type: 'farm',
            url: `/admin/coffee-growers?farm=${farm.id}`,
            icon: MapPin,
            metadata: `${farm.area} hectáreas`
          });
        });
      }

      // Procesar resultados de pagos
      if (paymentsResponse.status === 'fulfilled') {
        paymentsResponse.value.forEach((payment: any) => {
          searchResults.push({
            id: `payment-${payment.id}`,
            title: `Pago #${payment.id}`,
            subtitle: `${payment.amount} - ${payment.userEmail}`,
            type: 'payment',
            url: `/admin/payments?payment=${payment.id}`,
            icon: CreditCard,
            metadata: payment.status
          });
        });
      }

      // Agregar páginas del sistema que coincidan
      const systemPages = getSystemPages().filter(page => 
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      searchResults.push(...systemPages);

      setResults(searchResults.slice(0, 10)); // Limitar a 10 resultados
    } catch (error) {
      console.error('Error en búsqueda:', error);
      toast.error('Error al realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return data.users || [];
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
    return [];
  };

  const searchFarms = async (query: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/farms/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return data.farms || [];
      }
    } catch (error) {
      console.error('Error searching farms:', error);
    }
    return [];
  };

  const searchPayments = async (query: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/payments/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return data.payments || [];
      }
    } catch (error) {
      console.error('Error searching payments:', error);
    }
    return [];
  };

  const getSystemPages = (): SearchResult[] => {
    return [
      {
        id: 'page-dashboard',
        title: 'Dashboard',
        subtitle: 'Panel principal de administración',
        type: 'page',
        url: '/admin/dashboard',
        icon: FileText
      },
      {
        id: 'page-users',
        title: 'Gestión de Usuarios',
        subtitle: 'Administrar usuarios del sistema',
        type: 'page',
        url: '/admin/users',
        icon: Users
      },
      {
        id: 'page-farms',
        title: 'Caficultores y Fincas',
        subtitle: 'Gestionar fincas cafeteras',
        type: 'page',
        url: '/admin/coffee-growers',
        icon: MapPin
      },
      {
        id: 'page-payments',
        title: 'Gestión de Pagos',
        subtitle: 'Administrar pagos y suscripciones',
        type: 'page',
        url: '/admin/payments',
        icon: CreditCard
      }
    ];
  };

  const handleResultClick = (result: SearchResult) => {
    // Guardar en búsquedas recientes
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('admin-recent-searches', JSON.stringify(newRecentSearches));

    // Navegar al resultado
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    inputRef.current?.focus();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'farm': return 'bg-green-100 text-green-800';
      case 'payment': return 'bg-purple-100 text-purple-800';
      case 'report': return 'bg-amber-100 text-amber-800';
      case 'page': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar usuarios, fincas, pagos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Búsquedas recientes
                  </h4>
                  <div className="space-y-1">
                    {recentSearches.map((recentQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(recentQuery)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                      >
                        {recentQuery}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Escribe al menos 2 caracteres para buscar
                </p>
              )}
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => {
                const IconComponent = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 group"
                  >
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getTypeColor(result.type)}`}>
                          {result.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      {result.metadata && (
                        <p className="text-xs text-gray-400">{result.metadata}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 2 && !loading ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No se encontraron resultados</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;