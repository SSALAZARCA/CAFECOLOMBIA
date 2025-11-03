// =====================================================
// PÁGINA DE LOGIN ADMINISTRATIVO CON 2FA
// Café Colombia - Super Administrator Panel
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

// =====================================================
// ESQUEMAS DE VALIDACIÓN
// =====================================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

const twoFactorSchema = z.object({
  code: z
    .string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
    .regex(/^\d+$/, 'El código debe contener solo números'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [loginData, setLoginData] = useState<LoginFormData | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  const {
    isAuthenticated,
    isLoading,
    login,
    addNotification,
    setLoading
  } = useAdminStore();

  // =====================================================
  // FORMULARIO DE LOGIN
  // =====================================================

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    setError: setLoginError,
    clearErrors: clearLoginErrors
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // =====================================================
  // FORMULARIO DE 2FA
  // =====================================================

  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: twoFactorErrors },
    setError: set2FAError,
    clearErrors: clear2FAErrors,
    watch: watch2FA,
    setValue: setValue2FA
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: ''
    }
  });

  const twoFactorCode = watch2FA('code');

  // =====================================================
  // REDIRECCIÓN SI YA ESTÁ AUTENTICADO
  // =====================================================

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // =====================================================
  // MANEJO DE BLOQUEO POR INTENTOS FALLIDOS
  // =====================================================

  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockTimeRemaining]);

  // =====================================================
  // MANEJO DEL LOGIN
  // =====================================================

  const onLoginSubmit = async (data: LoginFormData) => {
    if (isLocked) {
      addNotification({
        id: Date.now().toString(),
        type: 'warning',
        title: 'Cuenta bloqueada',
        message: `Demasiados intentos fallidos. Intenta de nuevo en ${lockTimeRemaining} segundos.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      setLoading(true);
      clearLoginErrors();

      // Intentar login inicial (sin 2FA)
      try {
        await login(data.email, data.password);
        
        // Si llegamos aquí, el login fue exitoso sin 2FA
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Acceso autorizado',
          message: 'Has iniciado sesión exitosamente.',
          timestamp: new Date().toISOString()
        });

        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from, { replace: true });

      } catch (error: any) {
        // Si el error indica que se requiere 2FA
        if (error.message?.includes('2FA') || error.message?.includes('two-factor')) {
          setLoginData(data);
          setStep('2fa');
          setAttempts(0);
          
          addNotification({
            id: Date.now().toString(),
            type: 'info',
            title: 'Verificación requerida',
            message: 'Ingresa el código de autenticación de dos factores.',
            timestamp: new Date().toISOString()
          });
        } else {
          // Error de credenciales
          setAttempts(prev => {
            const newAttempts = prev + 1;
            
            if (newAttempts >= 5) {
              setIsLocked(true);
              setLockTimeRemaining(300); // 5 minutos
              
              addNotification({
                id: Date.now().toString(),
                type: 'error',
                title: 'Cuenta bloqueada',
                message: 'Demasiados intentos fallidos. La cuenta ha sido bloqueada por 5 minutos.',
                timestamp: new Date().toISOString()
              });
            } else {
              setLoginError('email', {
                type: 'manual',
                message: `Credenciales incorrectas. ${5 - newAttempts} intentos restantes.`
              });
            }
            
            return newAttempts;
          });
        }
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MANEJO DEL 2FA
  // =====================================================

  const on2FASubmit = async (data: TwoFactorFormData) => {
    if (!loginData) {
      setStep('login');
      return;
    }

    try {
      setLoading(true);
      clear2FAErrors();

      await login(loginData.email, loginData.password, data.code);

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Acceso autorizado',
        message: 'Autenticación de dos factores exitosa.',
        timestamp: new Date().toISOString()
      });

      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });

    } catch (error: any) {
      console.error('Error en 2FA:', error);
      
      setAttempts(prev => {
        const newAttempts = prev + 1;
        
        if (newAttempts >= 3) {
          setStep('login');
          setLoginData(null);
          setValue2FA('code', '');
          
          addNotification({
            id: Date.now().toString(),
            type: 'error',
            title: 'Demasiados intentos',
            message: 'Demasiados códigos incorrectos. Inicia sesión nuevamente.',
            timestamp: new Date().toISOString()
          });
        } else {
          set2FAError('code', {
            type: 'manual',
            message: `Código incorrecto. ${3 - newAttempts} intentos restantes.`
          });
          setValue2FA('code', '');
        }
        
        return newAttempts;
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VOLVER AL LOGIN DESDE 2FA
  // =====================================================

  const handleBackToLogin = () => {
    setStep('login');
    setLoginData(null);
    setAttempts(0);
    setValue2FA('code', '');
    clear2FAErrors();
  };

  // =====================================================
  // FORMATEAR TIEMPO DE BLOQUEO
  // =====================================================

  const formatLockTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // =====================================================
  // RENDER DEL COMPONENTE
  // =====================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Panel de Administración
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'login' 
              ? 'Accede con tus credenciales de administrador'
              : 'Ingresa tu código de autenticación'
            }
          </p>
        </div>

        {/* Indicador de bloqueo */}
        {isLocked && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Cuenta temporalmente bloqueada
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Tiempo restante: {formatLockTime(lockTimeRemaining)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Login */}
        {step === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmitLogin(onLoginSubmit)}>
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    {...registerLogin('email')}
                    type="email"
                    autoComplete="email"
                    disabled={isLocked}
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      loginErrors.email ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    placeholder="admin@cafecolombiaapp.com"
                  />
                  {loginErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...registerLogin('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      disabled={isLocked}
                      className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                        loginErrors.password ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLocked}
                    >
                      {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Botón de login */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading || isLocked}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RotateCcw className="h-5 w-5 animate-spin" />
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Formulario de 2FA */}
        {step === '2fa' && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit2FA(on2FASubmit)}>
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Verificación de Dos Factores
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Ingresa el código de 6 dígitos de tu aplicación de autenticación
                </p>
              </div>

              <div className="space-y-4">
                {/* Código 2FA */}
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                    Código de verificación
                  </label>
                  <input
                    {...register2FA('code')}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      twoFactorErrors.code ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest`}
                    placeholder="000000"
                  />
                  {twoFactorErrors.code && (
                    <p className="mt-1 text-sm text-red-600">{twoFactorErrors.code.message}</p>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || twoFactorCode.length !== 6}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RotateCcw className="h-5 w-5 animate-spin" />
                  ) : (
                    'Verificar Código'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volver al Login
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 Café Colombia. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Sistema de administración seguro con autenticación de dos factores
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;