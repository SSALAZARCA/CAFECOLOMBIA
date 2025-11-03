import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualizar el estado para mostrar la UI de error
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);

    // Generar ID único para el error
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Llamar callback personalizado si existe
    this.props.onError?.(error, errorInfo);

    // Reportar error a servicio de monitoreo (si está configurado)
    this.reportError(error, errorInfo, eventId);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset automático cuando cambian las props especificadas
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset cuando cambian las resetKeys
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys![idx] !== resetKey
      );
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, eventId: string) => {
    // En desarrollo, solo log a consola
    if (import.meta.env.DEV) {
      console.group(`🐛 Error Report [${eventId}]`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Stack:', error.stack);
      console.groupEnd();
      return;
    }

    // En producción, enviar a servicio de monitoreo
    try {
      // Aquí se podría integrar con Sentry, LogRocket, etc.
      const errorReport = {
        eventId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Por ahora solo guardamos en localStorage para debugging
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push(errorReport);
      
      // Mantener solo los últimos 10 errores
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('app_errors', JSON.stringify(existingErrors));
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorDetails = () => {
    const { error, errorInfo, eventId } = this.state;
    const errorDetails = {
      eventId,
      error: {
        message: error?.message,
        stack: error?.stack,
      },
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Detalles del error copiados al portapapeles');
      })
      .catch(() => {
        console.error('Failed to copy error details');
      });
  };

  render() {
    const { hasError, error, errorInfo, eventId } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Si hay un fallback personalizado, usarlo
      if (fallback) {
        return fallback;
      }

      // UI de error por defecto
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  ¡Oops! Algo salió mal
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
                </p>
                
                {eventId && (
                  <p className="mt-2 text-xs text-gray-500">
                    ID del error: {eventId}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recargar página
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir al inicio
                </button>
              </div>

              {(showDetails || import.meta.env.DEV) && error && (
                <div className="mt-6">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      <span className="flex items-center">
                        <Bug className="w-4 h-4 mr-2" />
                        Detalles técnicos
                      </span>
                      <span className="ml-2 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    
                    <div className="mt-3 p-3 bg-gray-100 rounded-md">
                      <div className="text-xs font-mono text-gray-800 space-y-2">
                        <div>
                          <strong>Error:</strong>
                          <pre className="mt-1 whitespace-pre-wrap break-words">
                            {error.message}
                          </pre>
                        </div>
                        
                        {error.stack && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        
                        {errorInfo?.componentStack && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={this.copyErrorDetails}
                        className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Copiar detalles del error
                      </button>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

// Hook para usar con componentes funcionales
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('🚨 Manual error report:', error);
    if (errorInfo) {
      console.error('📍 Error Info:', errorInfo);
    }
    
    // En desarrollo, lanzar el error para que lo capture el Error Boundary
    if (import.meta.env.DEV) {
      throw error;
    }
  };
};

// Componente wrapper para casos específicos
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};