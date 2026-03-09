import { AIValidationService } from '../services/aiValidationService';
import type { AIAnalysisRequest } from '../services/aiAgentService';

export const testMinImageQuality = () => {
  console.log('🧪 Iniciando pruebas de AIValidationService (minImageQuality)...');

  let success = true;

  try {
    // 1. Instanciar servicio con configuración específica
    console.log('📋 Test 1: Configurar AIValidationService con minImageQuality = 0.8');
    const service = new AIValidationService({ minImageQuality: 0.8 });

    // Crear un mock de Blob.
    // Usamos un tamaño mayor a 10KB para evitar la advertencia de imagen muy pequeña.
    // El tipo debe estar en allowedFormats ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')
    const blobData = new Uint8Array(20 * 1024); // 20KB
    const mockBlob = new Blob([blobData], { type: 'image/jpeg' });

    // 2. Prueba 1: Calidad de imagen baja
    console.log('📋 Test 2: Validación advierte con imageQuality = 0.5 (menor que 0.8)');
    const lowQualityRequest: AIAnalysisRequest = {
      id: `test_low_quality_${Date.now()}`,
      imageBlob: mockBlob,
      agentType: 'phytosanitary',
      priority: 'medium',
      metadata: {
        gps: { latitude: 4.7110, longitude: -74.0721 },
        timestamp: new Date().toISOString(),
        imageQuality: 0.5
      }
    };

    const lowQualityResult = service.validateAnalysisRequest(lowQualityRequest);
    const hasLowQualityWarning = lowQualityResult.warnings.some(w => w.includes('Calidad de imagen baja'));

    if (hasLowQualityWarning) {
      console.log('✅ Test 2 Pasado: Advertencia de baja calidad detectada correctamente.');
    } else {
      console.error('❌ Test 2 Falló: No se detectó advertencia de baja calidad.');
      console.log('Resultados:', JSON.stringify(lowQualityResult, null, 2));
      success = false;
    }

    // 3. Prueba 2: Calidad de imagen alta
    console.log('📋 Test 3: Validación pasa sin advertencia con imageQuality = 0.9 (mayor que 0.8)');
    const highQualityRequest: AIAnalysisRequest = {
      id: `test_high_quality_${Date.now()}`,
      imageBlob: mockBlob,
      agentType: 'phytosanitary',
      priority: 'medium',
      metadata: {
        gps: { latitude: 4.7110, longitude: -74.0721 },
        timestamp: new Date().toISOString(),
        imageQuality: 0.9
      }
    };

    const highQualityResult = service.validateAnalysisRequest(highQualityRequest);
    const hasHighQualityWarning = highQualityResult.warnings.some(w => w.includes('Calidad de imagen baja'));

    if (!hasHighQualityWarning) {
      console.log('✅ Test 3 Pasado: Imagen de alta calidad validada correctamente sin advertencia.');
    } else {
      console.error('❌ Test 3 Falló: Advertencia inesperada de baja calidad.');
      console.log('Resultados:', JSON.stringify(highQualityResult, null, 2));
      success = false;
    }

    if (success) {
      console.log('🎉 Todas las pruebas de AIValidationService (minImageQuality) completadas exitosamente!');
    } else {
      console.log('⚠️ Algunas pruebas fallaron.');
    }

    return {
      success,
      tests: {
        lowQualityWarningCaught: hasLowQualityWarning,
        highQualityWarningAvoided: !hasHighQualityWarning
      }
    };

  } catch (error: any) {
    console.error('❌ Error en las pruebas:', error);
    return {
      success: false,
      message: `Error en las pruebas: ${error.message}`,
      error
    };
  }
};

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

// Auto-ejecutar si se corre directamente con Node (ej. para pruebas en CLI)
// Comprobamos el nombre del archivo en argv
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('aiValidationServiceTest')) {
  testMinImageQuality();
  testAIValidationStrictMode();
}

// Exportar funciones de prueba para uso en consola del navegador de manera segura
try {
  if (typeof window !== 'undefined') {
    (window as any).testMinImageQuality = testMinImageQuality;
    (window as any).testAIValidationStrictMode = testAIValidationStrictMode;

    console.log('🧪 Funciones de prueba disponibles en la consola:');
    console.log('- testMinImageQuality(): Prueba restricción de minImageQuality en AIValidationService');
    console.log('- testAIValidationStrictMode(): Prueba de modo estricto del servicio de validación');
  }
} catch (e) {
  // Ignorar errores en entornos no de navegador
}
