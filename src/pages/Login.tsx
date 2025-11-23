import React, { useState, useEffect } from 'react';
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
  Coffee,
  Shield,
  User
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  // Eliminado estado duplicado de userRole

  // Obtener mensaje de estado de la navegación (ej: desde registro exitoso)
  const stateMessage = location.state?.message;
  const messageType = location.state?.type || 'info';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const watchedEmail = watch('email');

  // Función para manejar el envío del código 2FA
  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          twoFactorCode: twoFactorCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al verificar el código 2FA');
      }

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir al dashboard de admin
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar el código 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Detectar tipo de usuario basado en el email mientras escribe
  useEffect(() => {
    const detectUserType = async () => {
      if (watchedEmail && watchedEmail.includes('@')) {
        try {
          const response = await fetch('/api/auth/detect-user-type', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: watchedEmail })
          });
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role || '');
          }
        } catch (error) {
          console.error('Error detectando tipo de usuario:', error);
          setUserRole('');
        }
      } else {
        setUserRole('');
      }
    };

    // Debounce para no hacer muchas peticiones
    const timer = setTimeout(detectUserType, 500);
    return () => clearTimeout(timer);
  }, [watchedEmail]);

  // Detectar tipo de usuario cuando cambia el email
  const detectUserType = async (email: string) => {
    if (!email || !email.includes('@')) {
      setUserRole('');
      return;
    }

    try {
      const response = await fetch('/api/auth/detect-user-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok && data.exists) {
        setUserRole(data.role || '');
      } else {
        setUserRole('');
      }
    } catch (error) {
      console.error('Error detectando tipo de usuario:', error);
      setUserRole('');
    }
  };

  // Debounce para la detección de usuario
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchedEmail) {
        detectUserType(watchedEmail);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedEmail]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      let result;

      // Determinar qué endpoint usar basado en el tipo de usuario detectado
      if (userRole === 'super_admin' || userRole === 'admin') {
        // Para administradores, usar el endpoint de admin/login
        response = await fetch('/api/auth/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            twoFactorCode: twoFactorCode || undefined
          }),
        });
      } else {
        // Para caficultores y trabajadores, usar el endpoint de login normal
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password
          }),
        });
      }

      result = await response.json();

      if (response.ok && result && result.user) {
        // Guardar token en localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Recordar usuario si está marcado
        if (data.rememberMe) {
          localStorage.setItem('rememberUser', data.email);
        } else {
          localStorage.removeItem('rememberUser');
        }

        // Si el login de admin requiere 2FA, manejarlo
        if (result.requiresTwoFactor) {
          // Redirigir a la página de verificación 2FA
          navigate('/verify-2fa', { state: { email: data.email, token: result.tempToken } });
          return;
        }

        // Redirigir según el tipo de usuario con sistema inteligente
        const role = result.user?.role;
        const targetPath = location.state?.from?.pathname;
        
        // Si hay una ruta objetivo desde la que vino, priorizar esa
        if (targetPath && !targetPath.includes('/login')) {
          navigate(targetPath, { replace: true });
          return;
        }
        
        // Redirección basada en roles
        switch (role) {
          case 'super_admin':
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'coffee_grower':
            navigate('/dashboard');
            break;
          case 'trabajador':
            navigate('/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        const msg = result?.message || 'Error en el inicio de sesión';
        setError(msg);
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar email recordado al montar el componente
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberUser');
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  // Función para obtener icono según el rol detectado
  const getRoleIcon = () => {
    switch (userRole) {
      case 'super_admin':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'coffee_grower':
        return <Leaf className="h-4 w-4 text-green-500" />;
      case 'trabajador':
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Función para obtener texto descriptivo del rol
  const getRoleDescription = () => {
    switch (userRole) {
      case 'super_admin':
        return 'Super Administrador';
      case 'admin':
        return 'Administrador';
      case 'coffee_grower':
        return 'Caficultor';
      case 'trabajador':
        return 'Trabajador';
      default:
        return '';
    }
  };

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
          Ingreso unificado para todos los usuarios
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

          {/* Indicador de tipo de usuario detectado */}
          {userRole && (
            <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200">
              <div className="flex items-center">
                {getRoleIcon()}
                <span className="ml-2 text-sm text-blue-800">
                  Detectado como: <strong>{getRoleDescription()}</strong>
                </span>
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
                  id="email"
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
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
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

            {/* Campo de código 2FA para administradores */}
            {(userRole === 'super_admin' || userRole === 'admin') && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700">
                  Código de autenticación (2FA)
                </label>
                <div className="mt-1 relative">
                  <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="twoFactorCode"
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Ingresa el código de 6 dígitos de tu aplicación de autenticación
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-green-600 hover:text-green-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Ingresar'
                )}
              </button>
            </div>

            <div className="text-center space-y-3">
              <span className="text-sm text-gray-600 block">
                ¿No tienes una cuenta?
              </span>
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full py-2 px-4 border-2 border-green-600 text-sm font-semibold rounded-md text-green-700 bg-white hover:bg-green-50 hover:border-green-700 transition-colors"
              >
                Crear cuenta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
