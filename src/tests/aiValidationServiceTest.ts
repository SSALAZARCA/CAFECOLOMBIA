import { AIValidationService, ValidationResult } from '../services/aiValidationService';
import { AIAgentType, AIAnalysisRequest, AIAnalysisResult } from '../services/aiAgentService';
import { ImageAnalysisResult } from '../services/imageAnalysisService';

/**
 * Test suite for AIValidationService
 */
export const runAIValidationTests = () => {
  console.log('🧪 Starting AIValidationService tests...');

  const validationService = new AIValidationService();
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const assert = (name: string, condition: boolean, message?: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      results.push({ name, passed: true });
    } else {
      console.error(`❌ [FAIL] ${name}${message ? `: ${message}` : ''}`);
      results.push({ name, passed: false, error: message });
    }
  };

  const assertIsValid = (name: string, result: ValidationResult) => {
    assert(name, result.isValid, `Expected valid, but got errors: ${result.errors.join(', ')}`);
  };

  const assertIsInvalid = (name: string, result: ValidationResult, expectedError?: string) => {
    if (result.isValid) {
      assert(name, false, 'Expected invalid, but got valid');
    } else if (expectedError && !result.errors.some(e => e.includes(expectedError))) {
      assert(name, false, `Expected error containing "${expectedError}", but got: ${result.errors.join(', ')}`);
    } else {
      assert(name, true);
    }
  };

  const assertHasWarning = (name: string, result: ValidationResult, expectedWarning: string) => {
    const hasWarning = result.warnings.some(w => w.includes(expectedWarning));
    assert(name, hasWarning, `Expected warning containing "${expectedWarning}", but got: ${result.warnings.join(', ')}`);
  };

  // --- 1. validateImage Tests ---
  console.log('\n--- Testing validateImage ---');

  const validBlob = new Blob(['x'.repeat(100 * 1024)], { type: 'image/jpeg' });
  assertIsValid('Valid image blob', validationService.validateImage(validBlob));

  const tooLargeBlob = new Blob(['x'.repeat(11 * 1024 * 1024)], { type: 'image/jpeg' });
  assertIsInvalid('Too large image blob', validationService.validateImage(tooLargeBlob), 'muy grande');

  const tooSmallBlob = new Blob(['x'.repeat(5 * 1024)], { type: 'image/jpeg' });
  assertHasWarning('Too small image blob warning', validationService.validateImage(tooSmallBlob), 'muy pequeña');

  const invalidFormatBlob = new Blob(['test'], { type: 'image/gif' });
  assertIsInvalid('Invalid image format', validationService.validateImage(invalidFormatBlob), 'Formato no soportado');

  // --- 2. validateMetadata Tests ---
  console.log('\n--- Testing validateMetadata ---');

  const validMetadata = {
    gps: { latitude: 4.7110, longitude: -74.0721 },
    timestamp: new Date().toISOString(),
    imageQuality: 0.8,
    device: { userAgent: 'Mozilla/5.0' }
  };
  assertIsValid('Valid metadata', validationService.validateMetadata(validMetadata));

  const missingGPSMetadata = { ...validMetadata, gps: undefined };
  assertIsInvalid('Missing GPS metadata', validationService.validateMetadata(missingGPSMetadata), 'GPS son requeridas');

  const invalidGPSMetadata = { ...validMetadata, gps: { latitude: 100, longitude: -74.0721 } };
  assertIsInvalid('Invalid GPS coordinates', validationService.validateMetadata(invalidGPSMetadata), 'Latitud no válida');

  const outsideColombiaMetadata = { ...validMetadata, gps: { latitude: 40.7128, longitude: -74.0060 } };
  const outsideColombiaResult = validationService.validateMetadata(outsideColombiaMetadata);
  assertHasWarning('Outside Colombia warning', outsideColombiaResult, 'territorio colombiano');

  const futureMetadata = { ...validMetadata, timestamp: new Date(Date.now() + 100000).toISOString() };
  assertIsInvalid('Future timestamp', validationService.validateMetadata(futureMetadata), 'Timestamp en el futuro');

  const oldMetadata = { ...validMetadata, timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString() };
  assertHasWarning('Old image warning', validationService.validateMetadata(oldMetadata), 'hace más de 24 horas');

  // --- 3. validateAgentConfig Tests ---
  console.log('\n--- Testing validateAgentConfig ---');

  assertIsValid('Valid phytosanitary config', validationService.validateAgentConfig('phytosanitary', { plantPart: 'leaf', confidenceThreshold: 0.7 }));
  assertIsInvalid('Invalid phytosanitary plant part', validationService.validateAgentConfig('phytosanitary', { plantPart: 'invalid_part' }), 'Parte de planta no válida');
  assertHasWarning('Low confidence threshold warning', validationService.validateAgentConfig('phytosanitary', { confidenceThreshold: 0.2 }), 'muy bajo');

  assertIsValid('Valid predictive config', validationService.validateAgentConfig('predictive', { timeframe: '1_week', includeWeather: true }));
  assertIsInvalid('Invalid predictive timeframe', validationService.validateAgentConfig('predictive', { timeframe: '1_year' }), 'Marco temporal no válido');

  assertIsValid('Valid RAG config', validationService.validateAgentConfig('rag_assistant', { language: 'es', maxSuggestions: 5 }));
  assertHasWarning('Unsupported RAG language warning', validationService.validateAgentConfig('rag_assistant', { language: 'fr' }), 'Idioma no soportado');

  // --- 4. validateAnalysisRequest Tests ---
  console.log('\n--- Testing validateAnalysisRequest ---');

  const validRequest: AIAnalysisRequest = {
    id: 'test_req_1',
    agentType: 'phytosanitary',
    imageBlob: validBlob,
    metadata: {
      gps: { latitude: 4.7110, longitude: -74.0721 },
      timestamp: new Date().toISOString()
    } as any,
    priority: 'medium',
    autoAnalyze: true,
    requestTimestamp: new Date().toISOString()
  };
  assertIsValid('Valid analysis request', validationService.validateAnalysisRequest(validRequest));

  const missingIDRequest = { ...validRequest, id: undefined } as any;
  assertIsInvalid('Missing ID in request', validationService.validateAnalysisRequest(missingIDRequest), 'ID de solicitud es requerido');

  const invalidPriorityRequest = { ...validRequest, priority: 'ultra-high' } as any;
  assertIsInvalid('Invalid priority in request', validationService.validateAnalysisRequest(invalidPriorityRequest), 'Prioridad no válida');

  // Test strict mode
  const strictService = new AIValidationService({ strictMode: true });
  const requestWithoutMetadata = { ...validRequest, metadata: undefined } as any;
  assertIsInvalid('Strict mode: metadata required', strictService.validateAnalysisRequest(requestWithoutMetadata), 'Metadatos son requeridos');

  // --- 5. validateAnalysisResult Tests ---
  console.log('\n--- Testing validateAnalysisResult ---');

  const validResult: AIAnalysisResult = {
    id: 'res_1',
    requestId: 'test_req_1',
    agentType: 'phytosanitary',
    status: 'completed',
    confidence: 0.85,
    processingTime: 1200,
    timestamp: new Date().toISOString(),
    results: {
      pestDetection: [
        { pestType: 'coffee_leaf_rust', confidence: 0.9, severity: 'high' }
      ]
    }
  } as any;
  assertIsValid('Valid analysis result', validationService.validateAnalysisResult(validResult));

  const lowConfidenceResult = { ...validResult, confidence: 0.3 } as any;
  assertHasWarning('Low confidence result warning', validationService.validateAnalysisResult(lowConfidenceResult), 'Confianza baja');

  const invalidPhytosanitaryResult = {
    ...validResult,
    results: {
      pestDetection: [{ confidence: 0.9 }] // Missing pestType
    }
  } as any;
  assertIsInvalid('Invalid phytosanitary result results', validationService.validateAnalysisResult(invalidPhytosanitaryResult), 'Tipo de plaga requerido');

  // --- 6. calculateDataQuality Tests ---
  console.log('\n--- Testing calculateDataQuality ---');

  const highQualityData = {
    id: 'q_1',
    timestamp: new Date().toISOString(),
    agentType: 'phytosanitary',
    confidence: 0.9,
    imageBlob: validBlob,
    metadata: validMetadata
  };
  const highQuality = validationService.calculateDataQuality(highQualityData);
  assert('High completeness', highQuality.completeness === 1);
  assert('High overall quality', highQuality.overall > 0.8);

  const poorQualityData = {
    id: 'q_2',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    agentType: 'phytosanitary'
  };
  const poorQuality = validationService.calculateDataQuality(poorQualityData);
  assert('Timeliness should be 0 for old data', poorQuality.timeliness === 0);
  assert('Lower overall quality', poorQuality.overall < 0.6);

  // --- 7. validateImageAnalysisResult Tests ---
  console.log('\n--- Testing validateImageAnalysisResult ---');

  const validImgAnalysis: ImageAnalysisResult = {
    id: 'ia_1',
    imageId: 'img_1',
    analysisTimestamp: new Date().toISOString(),
    quality: {
      brightness: 0.7,
      contrast: 0.6,
      sharpness: 0.8,
      noise: 0.1,
      overall: 'good'
    },
    content: {
      plantDetected: true,
      plantCoverage: 0.6
    },
    metadata: {
      width: 1920,
      height: 1080
    },
    suitableForAI: true,
    confidence: 0.9,
    processingTime: 500
  } as any;
  assertIsValid('Valid image analysis result', validationService.validateImageAnalysisResult(validImgAnalysis));

  const noPlantImgAnalysis = {
    ...validImgAnalysis,
    content: { plantDetected: false }
  } as any;
  assertHasWarning('No plant detected warning', validationService.validateImageAnalysisResult(noPlantImgAnalysis), 'No se detectó planta');

  // Summary
  const passed = results.filter(r => r.passed).length;
  console.log(`\n📊 Test Summary: ${passed}/${results.length} passed`);
  if (typeof console.table === 'function') {
    console.table(results.map(r => ({ Test: r.name, Status: r.passed ? '✅ PASS' : '❌ FAIL', Error: r.error || '-' })));
  }

  return {
    success: passed === results.length,
    total: results.length,
    passed,
    failed: results.length - passed,
    results
  };
};

// Auto-run if in browser environment or explicitly called
if (typeof window !== 'undefined') {
  (window as any).runAIValidationTests = runAIValidationTests;
  console.log('🧪 AIValidationService tests loaded. Run runAIValidationTests() to execute.');
}
