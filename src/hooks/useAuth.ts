import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  nombre: string;
  email: string;
  tipo_usuario: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const isLikelyJWT = (token: string) => token.startsWith('eyJ') && token.length > 100;

  const parseJwt = (token: string): any | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload;
    } catch {
      return null;
    }
  };

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('token');
      const raw = localStorage.getItem('user');

      // Invalidate obviously bad tokens and user data
      if (!token || token === 'undefined' || token === 'null' || token.length < 16 || !isLikelyJWT(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } else if (raw && raw !== 'undefined' && raw !== 'null') {
        // Check JWT expiry (exp claim in seconds)
        const payload = parseJwt(token);
        if (!payload || (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now())) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        try {
          const parsedUser = JSON.parse(raw);
          // Validate basic user shape
          if (!parsedUser || !parsedUser.id || !parsedUser.email) {
            throw new Error('Invalid user shape');
          }
          
          // Normalizar rol de caficultor
          const validCoffeeGrowerRoles = ['coffee_grower', 'coffee-grower', 'farmer', 'user', 'caficultor'];
          const userRole = parsedUser.tipo_usuario || parsedUser.role;
          if (validCoffeeGrowerRoles.includes(userRole)) {
            parsedUser.tipo_usuario = 'coffee_grower';
            parsedUser.role = 'coffee_grower';
          }
          
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (parseErr) {
          console.warn('Invalid user data in storage. Clearing.');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    getToken
  };
};
