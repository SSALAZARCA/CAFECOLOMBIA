import React, { useState } from 'react';
import { adminHttpClient } from '@/utils/adminHttpClient';
import { useAdminStore } from '@/stores/adminStore';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Database,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  responseTime?: number;
}

export const AdminApiTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { isAuthenticated, currentAdmin } = useAdminStore();

  const testEndpoints = [
    { endpoint: '/api/health', name: 'Health Check', icon: CheckCircle },
    { endpoint: '/api/auth/admin/profile', name: 'Admin Profile', icon: Shield },
    { endpoint: '/api/users', name: 'Users API', icon: Users },
    { endpoint: '/api/reports/dashboard', name: 'Dashboard Metrics', icon: BarChart3 },
  ];

  const runApiTest = async (endpoint: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      let response;
      
      if (endpoint === '/api/health') {
        // Test health endpoint without auth
        response = await fetch('/api/health');
      } else {
        // Test authenticated endpoints
        response = await adminHttpClient.get(endpoint);
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint,
        status: 'success',
        message: `✅ Success (${responseTime}ms)`,
        responseTime
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint,
        status: 'error',
        message: `❌ Error: ${error.message || 'Unknown error'}`,
        responseTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    toast.info('Iniciando pruebas de API...', {
      description: 'Verificando conectividad con el backend'
    });

    const testResults: TestResult[] = [];

    for (const test of testEndpoints) {
      // Update UI to show current test
      setResults(prev => [...prev, {
        endpoint: test.endpoint,
        status: 'pending',
        message: 'Testing...'
      }]);

      const result = await runApiTest(test.endpoint);
      
      // Update the result
      setResults(prev => 
        prev.map(r => 
          r.endpoint === test.endpoint ? result : r
        )
      );

      testResults.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);

    // Show summary
    const successCount = testResults.filter(r => r.status === 'success').length;
    const totalCount = testResults.length;

    if (successCount === totalCount) {
      toast.success('Todas las pruebas pasaron', {
        description: `${successCount}/${totalCount} endpoints funcionando correctamente`
      });
    } else {
      toast.warning('Algunas pruebas fallaron', {
        description: `${successCount}/${totalCount} endpoints funcionando`
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTestName = (endpoint: string) => {
    const test = testEndpoints.find(t => t.endpoint === endpoint);
    return test?.name || endpoint;
  };

  const getTestIcon = (endpoint: string) => {
    const test = testEndpoints.find(t => t.endpoint === endpoint);
    const IconComponent = test?.icon || Database;
    return <IconComponent className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pruebas de Integración API
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Verificar conectividad y funcionalidad del backend
          </p>
        </div>
        
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isRunning ? 'Ejecutando...' : 'Ejecutar Pruebas'}
        </button>
      </div>

      {/* Authentication Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Estado de Autenticación</span>
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">Autenticado</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">No autenticado</span>
              </>
            )}
          </div>
        </div>
        
        {currentAdmin && (
          <div className="mt-2 text-sm text-gray-600">
            Usuario: {currentAdmin.name} ({currentAdmin.email})
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Haz clic en "Ejecutar Pruebas" para verificar la conectividad</p>
          </div>
        )}

        {results.map((result, index) => (
          <div
            key={result.endpoint}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {getTestIcon(result.endpoint)}
              <div>
                <div className="font-medium text-gray-900">
                  {getTestName(result.endpoint)}
                </div>
                <div className="text-sm text-gray-500">
                  {result.endpoint}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {result.responseTime && (
                <span className="text-xs text-gray-500">
                  {result.responseTime}ms
                </span>
              )}
              <div className="flex items-center space-x-2">
                {getStatusIcon(result.status)}
                <span className={`text-sm ${
                  result.status === 'success' ? 'text-green-700' :
                  result.status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {result.message}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {results.length > 0 && !isRunning && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Resumen:</strong> {results.filter(r => r.status === 'success').length} de {results.length} pruebas exitosas
          </div>
          {results.some(r => r.status === 'error') && (
            <div className="mt-2 text-sm text-red-600">
              ⚠️ Algunas APIs no están disponibles. Esto es normal en modo desarrollo sin backend completo.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminApiTest;