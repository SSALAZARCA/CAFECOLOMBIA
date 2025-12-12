import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import { useAuth } from '@/hooks/useAuth';

const ProtectedHome: React.FC = () => {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Home />;
};

export default ProtectedHome;
