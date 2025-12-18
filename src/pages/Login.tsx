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
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/apiClient';

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
  const { login: authLogin } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Obtener mensaje de estado de la navegación
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
      // We use apiClient here for consistency
      const res = await apiClient.post('/auth/admin/login', {
        email: watchedEmail,
        twoFactorCode: twoFactorCode
      });

      if (res.success) {
        const { user, token } = res.data;
        authLogin(token, user);
        navigate('/admin/dashboard');
      } else {
        throw new Error(res.message || 'Error 2FA');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar el código 2FA');
    } finally {
      setLoading(false);
    }
  };



  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');
    try {
      // Determine endpoint
      const res = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
        twoFactorCode: twoFactorCode || undefined
      });

      // Adapt response if strictly needed, but apiClient usually returns standard shape
      const success = res.success || (res as any).content?.token;

      if (success) {
        const responseData = res.data || res;
        const user = responseData.user;
        const token = responseData.token;
        const requiresTwoFactor = responseData.requiresTwoFactor;
        const tempToken = responseData.tempToken;

        if (requiresTwoFactor) {
          navigate('/verify-2fa', { state: { email: data.email, token: tempToken } });
          return;
        }

        if (user && token) {
          authLogin(token, user);

          if (data.rememberMe) {
            localStorage.setItem('rememberUser', data.email);
          } else {
            localStorage.removeItem('rememberUser');
          }

          // Redirect
          const role = user.role || user.tipo_usuario;
          if (['coffee_grower', 'caficultor', 'trabajador'].includes(role)) {
            navigate('/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        } else {
          throw new Error('Respuesta inválida del servidor');
        }
      } else {
        setError(res.message || 'Error en inicio de sesión');
      }
    } catch (error) {
      console.error('Login error', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Effects for rememberMe
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberUser');
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
          {stateMessage && (
            <div className={`mb-4 p-4 rounded-md ${messageType === 'success'
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
                    <AlertCircle className={`h-5 w-5 ${messageType === 'error' ? 'text-red-400' : 'text-blue-400'
                      }`} />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${messageType === 'success'
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
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'
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
                  className={`pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'
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
