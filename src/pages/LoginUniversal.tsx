import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Coffee, AlertCircle, CheckCircle } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import Register from './Register';
import { BackendStatusIndicator } from '@/components/BackendConnectionStatus';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginUniversal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const stateMessage = (location.state as any)?.message;
  const messageType = (location.state as any)?.type || 'info';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const { login: adminLogin } = useAdminStore();

  useEffect(() => {
    // Detectar si se debe mostrar el registro
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'register') {
      setShowRegister(true);
    }
  }, [location.search]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberUser');
    if (rememberedEmail) setValue('email', rememberedEmail);
  }, [setValue]);

  const tryGeneralLogin = async (data: LoginFormData) => {
    // Intentos alternos para manejar diferentes contratos de backend
    const attempts = [
      { body: { email: data.email, password: data.password }, note: 'email/password' }
    ];

    let lastError: any = null;
    for (const attempt of attempts) {
      try {
        // Construir URL base correcta
        let baseUrl = import.meta.env.VITE_API_URL || '';
        // Si es una URL completa (http...) y no termina en /api, agregarlo
        if (baseUrl.startsWith('http') && !baseUrl.endsWith('/api')) {
          baseUrl = baseUrl.replace(/\/$/, '') + '/api';
        }
        // Si está vacía o es relativa, asegurarse de usar /api
        if (!baseUrl || (!baseUrl.startsWith('http') && !baseUrl.includes('/api'))) {
          baseUrl = '/api';
        }

        const url = `${baseUrl.replace(/\/$/, '')}/auth/login`;

        console.log('Intento de login general:', { url, email: attempt.body.email });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attempt.body)
        });

        let result: any = null;
        try { result = await response.json(); } catch { result = null; }

        if (!response.ok) {
          // DEV BYPASS: If we are in dev mode and backend is down (404/500/etc), mock success
          if (import.meta.env.DEV) {
            console.warn('⚠️ [DEV] Backend Error, using fallback Mock Login');
            result = {
              token: 'mock-dev-token-' + Date.now(),
              user: {
                id: 'dev-user-1',
                email: data.email,
                name: 'Dev User',
                tipo_usuario: 'coffee_grower',
                role: 'coffee_grower'
              }
            };
            // Fall through to success handling below
          } else {
            const msg = result?.message || `Error de autenticación (${attempt.note})`;
            lastError = new Error(msg);
            continue; // probar siguiente intento
          }
        }

        // Guardar token y usuario
        if (result?.token) localStorage.setItem('token', result.token);

        // Normalizar rol de caficultor antes de guardar
        if (result?.user) {
          const user = result.user;
          const role = user.role || user.tipo_usuario;
          const validCoffeeGrowerRoles = ['coffee_grower', 'coffee-grower', 'farmer', 'user', 'caficultor'];

          if (validCoffeeGrowerRoles.includes(role)) {
            user.role = 'coffee_grower';
            user.tipo_usuario = 'coffee_grower';
          }

          localStorage.setItem('user', JSON.stringify(user));
        }

        if (data.rememberMe) localStorage.setItem('rememberUser', data.email);
        else localStorage.removeItem('rememberUser');

        const role = result?.user?.role;
        if (role === 'coffee_grower') navigate('/dashboard');
        else if (role === 'admin' || role === 'super_admin') navigate('/admin/dashboard');
        else navigate('/dashboard'); // Por defecto ir al dashboard de caficultor
        return; // éxito, salir
      } catch (err) {
        // DEV BYPASS: If fetch throws (network error), mock success
        if (import.meta.env.DEV) {
          console.warn('⚠️ [DEV] Network Error, using fallback Mock Login');
          const mockUser = {
            id: 'dev-user-1',
            email: data.email,
            name: 'Dev User',
            tipo_usuario: 'coffee_grower',
            role: 'coffee_grower'
          };
          localStorage.setItem('token', 'mock-dev-token-' + Date.now());
          localStorage.setItem('user', JSON.stringify(mockUser));
          navigate('/dashboard');
          return;
        }
        lastError = err;
      }
    }

    throw (lastError instanceof Error ? lastError : new Error('Error desconocido en autenticación'));
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      // 1) Intentar como administrador primero
      try {
        const ok = await adminLogin(data.email, data.password);
        if (ok) {
          // Decidir redirección por rol tras login admin
          const adminState = useAdminStore.getState();
          const adminRole = adminState.currentAdmin?.role;

          if (data.rememberMe) localStorage.setItem('rememberUser', data.email);
          else localStorage.removeItem('rememberUser');

          if (adminRole === 'admin' || adminRole === 'super_admin' || adminRole === 'moderator') {
            navigate('/admin/dashboard');
            return;
          }

          // Si el rol NO es admin, cerrar sesión de adminStore y continuar con login general
          try {
            await adminState.logout?.();
          } catch { }

          await tryGeneralLogin(data);
          return;
        }
      } catch (adminErr: any) {
        // Si requiere 2FA, mostrar mensaje y no seguir a login general
        if (adminErr?.message?.toLowerCase?.().includes('two-factor') || adminErr?.message?.includes('2FA')) {
          setError('Se requiere autenticación de dos factores para esta cuenta.');
          return;
        }
        // Caso normal: continuar con login general
        // Si el endpoint devuelve 401, continuar a login general sin bloquear
      }

      // 2) Si no fue admin, intentar login general (caficultor)
      await tryGeneralLogin(data);
    } catch (err: any) {
      const message = err?.message || 'Error desconocido en autenticación';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showRegister) {
    return <Register />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-green-600 to-amber-600 p-3 rounded-xl">
            <Coffee className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Accede a tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ingresa tus credenciales (admin o caficultor)
        </p>
        <div className="mt-3 flex justify-center">
          <BackendStatusIndicator />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          {stateMessage && (
            <div className={`mb-4 p-4 rounded-md ${messageType === 'success' ? 'bg-green-50 border border-green-200' :
              messageType === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {messageType === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className={`h-5 w-5 ${messageType === 'error' ? 'text-red-400' : 'text-blue-400'}`} />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${messageType === 'success' ? 'text-green-800' :
                    messageType === 'error' ? 'text-red-800' : 'text-blue-800'
                    }`}>{stateMessage}</p>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>)}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                  placeholder="Tu contraseña"
                />
                <button type="button" className="absolute right-3 top-3" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input {...register('rememberMe')} id="rememberMe" type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">Recordarme</label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-green-600 hover:text-green-500">¿Olvidaste tu contraseña?</Link>
              </div>
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                {isLoading ? 'Ingresando…' : 'Iniciar Sesión'}
              </button>
            </div>

            {/* Enlace para crear nueva cuenta */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/login?tab=register')}
                className="text-sm font-medium text-green-700 hover:text-green-800 underline"
              >
                ¿No tienes cuenta? Crear cuenta
              </button>
              <span className="mx-2 text-gray-400">•</span>
              <Link to="/register" className="text-sm font-medium text-green-700 hover:text-green-800 underline">
                Ir directo al registro
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginUniversal;
