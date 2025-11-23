import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que redirige automáticamente según el estado de autenticación
 * - Si hay usuario logueado: redirige a /dashboard (coffee_grower) o /admin/dashboard (admin)
 * - Si no hay usuario: redirige a /login
 */
export default function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    if (!token || !userRaw) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      const role = user?.tipo_usuario || user?.role;

      if (role === 'admin' || role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if (role === 'coffee_grower' || role === 'coffee-grower' || role === 'farmer' || role === 'user' || role === 'caficultor') {
        // Caficultores van directamente a gestión de finca (sin dashboard)
        navigate('/finca');
      } else {
        // Para cualquier otro rol, ir a gestión de finca
        navigate('/finca');
      }
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  return null; // No renderiza nada, solo redirige
}