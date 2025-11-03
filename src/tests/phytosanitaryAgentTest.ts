// Test script para verificar la funcionalidad del Agente Fitosanitario
import { diseaseDetectionService } from '../services/diseaseDetectionService';
import { offlineAnalysisQueue } from '../services/offlineAnalysisQueue';
import type { PhytosanitaryAnalysisRequest } from '../types/phytosanitary';

// Función de prueba principal
export const testPhytosanitaryAgent = async () => {
  console.log('🧪 Iniciando pruebas del Agente Fitosanitario...');
  
  try {
    // Test 1: Verificar inicialización del servicio
    console.log('📋 Test 1: Verificación de inicialización del servicio');
    const stats = await diseaseDetectionService.getServiceStats();
    console.log('✅ Estadísticas del servicio:', stats);
    
    // Test 2: Crear una solicitud de análisis mock
    console.log('📋 Test 2: Creación de solicitud de análisis mock');
    const mockRequest: PhytosanitaryAnalysisRequest = {
      id: `test_${Date.now()}`,
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      imageBlob: new Blob(['test'], { type: 'image/jpeg' }),
      metadata: {
        farmId: 'test_farm',
        lotId: 'test_lot',
        location: {
          latitude: 4.7110,
          longitude: -74.0721,
          altitude: 2640
        },
        captureDate: new Date(),
        weather: {
          temperature: 18,
          humidity: 75,
          conditions: 'Parcialmente nublado'
        }
      },
      analysisOptions: {
        plantPartFocus: 'LEAF',
        diseaseTypes: ['RUST', 'LEAF_SPOT'],
        severityThreshold: 'MEDIUM',
        includeRecommendations: true,
        enableDetailedAnalysis: true
      }
    };
    
    console.log('✅ Solicitud mock creada:', mockRequest.id);
    
    // Test 3: Simular análisis online
    console.log('📋 Test 3: Simulación de análisis online');
    if (navigator.onLine) {
      const result = await diseaseDetectionService.analyzeImage(mockRequest);
      console.log('✅ Resultado del análisis:', {
        id: result.id,
        detectionsCount: result.detections.length,
        confidence: result.confidence.overall,
        processingTime: result.processingTime
      });
    } else {
      console.log('⚠️ Sin conexión - saltando prueba online');
    }
    
    // Test 4: Verificar cola offline
    console.log('📋 Test 4: Verificación de cola offline');
    const queueStatus = await offlineAnalysisQueue.getQueueStatus();
    console.log('✅ Estado de la cola:', queueStatus);
    
    // Test 5: Agregar elemento a la cola (simulando offline)
    console.log('📋 Test 5: Simulación de análisis offline');
    const queueId = await offlineAnalysisQueue.addToQueue(
      mockRequest,
      mockRequest.imageBlob,
      'MEDIUM'
    );
    console.log('✅ Elemento agregado a la cola:', queueId);
    
    // Test 6: Verificar estadísticas de la cola
    console.log('📋 Test 6: Estadísticas de la cola');
    const queueStats = await offlineAnalysisQueue.getQueueStats();
    console.log('✅ Estadísticas de la cola:', queueStats);
    
    // Test 7: Limpiar cola de prueba
    console.log('📋 Test 7: Limpieza de cola de prueba');
    await offlineAnalysisQueue.clearQueue();
    console.log('✅ Cola limpiada');
    
    console.log('🎉 Todas las pruebas del Agente Fitosanitario completadas exitosamente!');
    
    return {
      success: true,
      message: 'Agente Fitosanitario funcionando correctamente',
      tests: {
        serviceInitialization: true,
        mockRequestCreation: true,
        onlineAnalysis: navigator.onLine,
        offlineQueue: true,
        queueManagement: true,
        cleanup: true
      }
    };
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    return {
      success: false,
      message: `Error en las pruebas: ${error.message}`,
      error
    };
  }
};

// Función para probar la funcionalidad offline
export const testOfflineFunctionality = async () => {
  console.log('🔌 Probando funcionalidad offline...');
  
  try {
    // Simular estado offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    const mockRequest: PhytosanitaryAnalysisRequest = {
      id: `offline_test_${Date.now()}`,
      imageUrl: 'test_offline_image.jpg',
      imageBlob: new Blob(['offline test'], { type: 'image/jpeg' }),
      metadata: {
        farmId: 'offline_farm',
        lotId: 'offline_lot',
        location: {
          latitude: 4.7110,
          longitude: -74.0721,
          altitude: 2640
        },
        captureDate: new Date(),
        weather: {
          temperature: 20,
          humidity: 80,
          conditions: 'Offline test'
        }
      },
      analysisOptions: {
        plantPartFocus: 'FRUIT',
        diseaseTypes: ['ANTHRACNOSE'],
        severityThreshold: 'HIGH',
        includeRecommendations: true,
        enableDetailedAnalysis: false
      }
    };
    
    // Intentar análisis en modo offline
    const result = await diseaseDetectionService.analyzeImage(mockRequest);
    
    console.log('✅ Análisis offline completado:', {
      id: result.id,
      isQueued: result.id.startsWith('queued_'),
      queueId: result.metadata.queueId
    });
    
    // Restaurar estado online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    return {
      success: true,
      message: 'Funcionalidad offline verificada',
      queuedAnalysis: result
    };
    
  } catch (error) {
    console.error('❌ Error en prueba offline:', error);
    
    // Restaurar estado online en caso de error
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    return {
      success: false,
      message: `Error en prueba offline: ${error.message}`,
      error
    };
  }
};

// Exportar funciones de prueba para uso en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).testPhytosanitaryAgent = testPhytosanitaryAgent;
  (window as any).testOfflineFunctionality = testOfflineFunctionality;
  
  console.log('🧪 Funciones de prueba disponibles en la consola:');
  console.log('- testPhytosanitaryAgent(): Prueba completa del agente');
  console.log('- testOfflineFunctionality(): Prueba funcionalidad offline');
}