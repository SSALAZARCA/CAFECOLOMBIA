import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Leaf, 
  AlertCircle,
  CheckCircle,
  Coffee
} from 'lucide-react';

// Esquema de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Obtener mensaje de estado de la navegación (ej: desde registro exitoso)
  const stateMessage = location.state?.message;
  const messageType = location.state?.type || 'info';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Guardar token en localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Recordar usuario si está marcado
        if (data.rememberMe) {
          localStorage.setItem('rememberUser', data.email);
        } else {
          localStorage.removeItem('rememberUser');
        }

        // Redirigir según el tipo de usuario
        if (result.user.role === 'coffee_grower') {
          navigate('/dashboard');
        } else if (result.user.role === 'admin' || result.user.role === 'super_admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Error en el inicio de sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar email recordado al montar el componente
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberUser');
    if (rememberedEmail) {
      // Usar setValue si tienes acceso al form
      const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
      if (emailInput) {
        emailInput.value = rememberedEmail;
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo y título */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-green-600 to-amber-600 p-3 rounded-xl">
            <Coffee className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Café Colombia
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Inicia sesión en tu cuenta
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          {/* Mensaje de estado */}
          {stateMessage && (
            <div className={`mb-4 p-4 rounded-md ${
              messageType === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : messageType === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {messageType === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className={`h-5 w-5 ${
                      messageType === 'error' ? 'text-red-400' : 'text-blue-400'
                    }`} />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    messageType === 'success' 
                      ? 'text-green-800' 
                      : messageType === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                  }`}>
                    {stateMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error de login */}
          {error && (
            <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">¿Nuevo en Café Colombia?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/register"
                  className="w-full flex justify-center py-2 px-4 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Leaf className="h-4 w-4 mr-2" />
                  Registrar mi finca
                </Link>
              </div>
            </div>
          </form>

          {/* Enlaces adicionales */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              <Link
                to="/admin/login"
                className="font-medium text-gray-500 hover:text-gray-400"
              >
                ¿Eres administrador? Ingresa aquí
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 Café Colombia. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;