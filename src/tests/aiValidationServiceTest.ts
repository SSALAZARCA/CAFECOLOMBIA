import { AIValidationService } from '../services/aiValidationService';
import type { AIAnalysisRequest } from '../services/aiAgentService';

export const testAIValidationStrictMode = () => {
  console.log('🧪 Iniciando prueba de AIValidationService en modo estricto...');

  try {
    // Instanciar el servicio en modo estricto
    const validationService = new AIValidationService({ strictMode: true });

    // Crear un mock de request sin metadatos
    const mockRequest: AIAnalysisRequest = {
      id: `test_${Date.now()}`,
      imageBlob: new Blob(['dummy content to avoid errors'], { type: 'image/jpeg' }),
      agentType: 'phytosanitary',
      priority: 'medium',
      // metadata está intencionalmente omitido
    };

    console.log('📋 Validando request sin metadatos...');
    const result = validationService.validateAnalysisRequest(mockRequest);

    // Verificar que el error esperado está presente
    const expectedError = 'Metadatos son requeridos en modo estricto';
    const hasExpectedError = result.errors.includes(expectedError);

    if (hasExpectedError) {
      console.log(`✅ Prueba exitosa: Se encontró el error esperado "${expectedError}"`);
      console.log('✅ El resultado de isValid es:', result.isValid);
      return {
        success: true,
        message: 'Modo estricto validado correctamente',
      };
    } else {
      console.error('❌ Prueba fallida: No se encontró el error esperado');
      console.error('Errores actuales:', result.errors);
      return {
        success: false,
        message: 'No se generó el error de modo estricto',
      };
    }
  } catch (error: any) {
    console.error('❌ Error durante la prueba:', error);
    return {
      success: false,
      message: `Error en la prueba: ${error.message}`,
      error
    };
  }
};

// Exportar funciones de prueba para uso en consola del navegador de manera segura
try {
  if (typeof window !== 'undefined') {
    (window as any).testAIValidationStrictMode = testAIValidationStrictMode;

    console.log('🧪 Funciones de prueba disponibles en la consola:');
    console.log('- testAIValidationStrictMode(): Prueba de modo estricto del servicio de validación');
  }
} catch (e) {
  // Ignorar errores en entornos no de navegador
}