// Hook para capacidades de captura fitosanitaria
import { useState, useCallback } from 'react';
import { diseaseDetectionService } from '../services/diseaseDetectionService';
import { useAINotifications } from './useAINotifications';
import { 
  PhytosanitaryAnalysisRequest, 
  PhytosanitaryAnalysisResult,
  PlantPartType,
  ImageQualityMetrics
} from '../types/phytosanitary';

interface PhotoMetadata {
  id: string;
  filename: string;
  url: string;
  thumbnail: string;
  timestamp: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  pestType?: string;
  lotId?: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'ERROR';
  size: number;
  format: string;
  aiMetadata?: any;
  aiAnalysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysisResult?: PhytosanitaryAnalysisResult;
}

interface UsePhytosanitaryCaptureProps {
  lotId?: string;
  farmId?: string;
  plantPartFocus?: PlantPartType;
  enableValidation?: boolean;
  onAnalysisComplete?: (result: PhytosanitaryAnalysisResult) => void;
}

export const usePhytosanitaryCapture = ({
  lotId,
  farmId,
  plantPartFocus = 'LEAF',
  enableValidation = true,
  onAnalysisComplete
}: UsePhytosanitaryCaptureProps = {}) => {
  const [analysisProgress, setAnalysisProgress] = useState<Record<string, number>>({});
  const [phytosanitaryResults, setPhytosanitaryResults] = useState<Record<string, PhytosanitaryAnalysisResult>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const { notifyPhytosanitaryResult } = useAINotifications();

  // Análisis de calidad de imagen detallado
  const analyzeImageQualityDetailed = useCallback(async (canvas: HTMLCanvasElement): Promise<ImageQualityMetrics> => {
    const context = canvas.getContext('2d');
    if (!context) {
      return {
        overall: 50,
        sharpness: 50,
        brightness: 50,
        contrast: 50,
        colorBalance: 50,
        noiseLevel: 20,
        resolution: {
          width: canvas.width,
          height: canvas.height,
          megapixels: Math.round((canvas.width * canvas.height) / 1000000 * 100) / 100
        },
        lighting: 'FAIR',
        focus: 'SLIGHTLY_BLURRED',
        composition: 'FAIR'
      };
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Calcular métricas detalladas
    const brightness = calculateBrightness(pixels);
    const contrast = calculateContrast(pixels);
    const sharpness = calculateSharpness(pixels, canvas.width, canvas.height);
    const colorBalance = calculateColorBalance(pixels);
    const noiseLevel = calculateNoiseLevel(pixels);

    const overall = Math.round((brightness + contrast + sharpness + colorBalance + (100 - noiseLevel)) / 5);

    return {
      overall,
      sharpness,
      brightness,
      contrast,
      colorBalance,
      noiseLevel,
      resolution: {
        width: canvas.width,
        height: canvas.height,
        megapixels: Math.round((canvas.width * canvas.height) / 1000000 * 100) / 100
      },
      lighting: overall > 80 ? 'EXCELLENT' : overall > 60 ? 'GOOD' : overall > 40 ? 'FAIR' : 'POOR',
      focus: sharpness > 80 ? 'SHARP' : sharpness > 60 ? 'SLIGHTLY_BLURRED' : 'BLURRED',
      composition: overall > 75 ? 'EXCELLENT' : overall > 55 ? 'GOOD' : overall > 35 ? 'FAIR' : 'POOR'
    };
  }, []);

  // Funciones auxiliares para cálculo de métricas
  const calculateBrightness = (pixels: Uint8ClampedArray): number => {
    let sum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      sum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    }
    return Math.round((sum / (pixels.length / 4)) / 255 * 100);
  };

  const calculateContrast = (pixels: Uint8ClampedArray): number => {
    const brightness = calculateBrightness(pixels);
    let variance = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const pixelBrightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      variance += Math.pow(pixelBrightness - brightness * 2.55, 2);
    }
    const stdDev = Math.sqrt(variance / (pixels.length / 4));
    return Math.min(100, Math.round(stdDev / 2.55));
  };

  const calculateSharpness = (pixels: Uint8ClampedArray, width: number, height: number): number => {
    let edgeSum = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        const current = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        const right = (pixels[i + 4] + pixels[i + 5] + pixels[i + 6]) / 3;
        const bottom = (pixels[i + width * 4] + pixels[i + width * 4 + 1] + pixels[i + width * 4 + 2]) / 3;
        edgeSum += Math.abs(current - right) + Math.abs(current - bottom);
      }
    }
    return Math.min(100, Math.round(edgeSum / ((width - 2) * (height - 2)) / 2.55));
  };

  const calculateColorBalance = (pixels: Uint8ClampedArray): number => {
    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      rSum += pixels[i];
      gSum += pixels[i + 1];
      bSum += pixels[i + 2];
    }
    const pixelCount = pixels.length / 4;
    const rAvg = rSum / pixelCount;
    const gAvg = gSum / pixelCount;
    const bAvg = bSum / pixelCount;
    
    const balance = 1 - (Math.abs(rAvg - gAvg) + Math.abs(gAvg - bAvg) + Math.abs(bAvg - rAvg)) / (3 * 255);
    return Math.round(balance * 100);
  };

  const calculateNoiseLevel = (pixels: Uint8ClampedArray): number => {
    // Estimación simple de ruido basada en variación local
    let noiseSum = 0;
    const sampleSize = Math.min(1000, pixels.length / 4);
    
    for (let i = 0; i < sampleSize; i++) {
      const idx = Math.floor(Math.random() * (pixels.length / 4)) * 4;
      const current = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      
      // Comparar con píxeles adyacentes si existen
      if (idx + 4 < pixels.length) {
        const next = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;
        noiseSum += Math.abs(current - next);
      }
    }
    
    const avgNoise = noiseSum / sampleSize;
    return Math.min(100, Math.round(avgNoise / 2.55));
  };

  // Validación específica para análisis fitosanitario
  const validatePhytosanitaryImage = useCallback((imageQuality: ImageQualityMetrics): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } => {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validar calidad mínima
    if (imageQuality.overall < 60) {
      issues.push('Calidad general de imagen insuficiente');
      recommendations.push('Tome la foto con mejor iluminación y enfoque');
    }

    // Validar nitidez
    if (imageQuality.sharpness < 70) {
      issues.push('Imagen desenfocada');
      recommendations.push('Asegúrese de que la cámara esté enfocada en la planta');
    }

    // Validar iluminación
    if (imageQuality.brightness < 40 || imageQuality.brightness > 85) {
      issues.push('Iluminación inadecuada');
      recommendations.push('Use luz natural o mejore la iluminación artificial');
    }

    // Validar contraste
    if (imageQuality.contrast < 50) {
      issues.push('Contraste insuficiente');
      recommendations.push('Evite fondos que se confundan con la planta');
    }

    // Validar resolución
    if (imageQuality.resolution.megapixels < 2) {
      issues.push('Resolución muy baja');
      recommendations.push('Use una cámara de mayor resolución o acérquese más');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }, []);

  // Análisis fitosanitario automático
  const performPhytosanitaryAnalysis = useCallback(async (
    photoMetadata: PhotoMetadata, 
    blob: Blob
  ): Promise<PhytosanitaryAnalysisResult | null> => {
    try {
      setAnalysisProgress(prev => ({ ...prev, [photoMetadata.id]: 0 }));

      // Crear request de análisis
      const analysisRequest: PhytosanitaryAnalysisRequest = {
        id: `analysis_${photoMetadata.id}`,
        imageUrl: photoMetadata.url,
        imageBlob: blob,
        metadata: {
          lotId: lotId || '',
          farmId: farmId || '',
          captureDate: new Date(photoMetadata.timestamp),
          gpsCoordinates: photoMetadata.gpsCoordinates,
          deviceInfo: photoMetadata.deviceInfo,
          imageMetadata: {
            fileName: photoMetadata.filename,
            fileSize: blob.size,
            mimeType: blob.type
          }
        },
        analysisOptions: {
          plantPartFocus: plantPartFocus,
          enableSeverityAnalysis: true,
          enableTreatmentRecommendations: true,
          confidenceThreshold: 70
        }
      };

      // Simular progreso
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => ({
          ...prev,
          [photoMetadata.id]: Math.min((prev[photoMetadata.id] || 0) + Math.random() * 15 + 5, 95)
        }));
      }, 300);

      // Ejecutar análisis
      const result = await diseaseDetectionService.analyzeImage(analysisRequest);
      
      clearInterval(progressInterval);
      setAnalysisProgress(prev => ({ ...prev, [photoMetadata.id]: 100 }));

      // Guardar resultado
      setPhytosanitaryResults(prev => ({ ...prev, [photoMetadata.id]: result }));

      // Notificar resultado
      onAnalysisComplete?.(result);

      // Enviar notificación si hay detecciones críticas
      if (result.detections.length > 0) {
        const criticalDetections = result.detections.filter(d => 
          d.severity === 'CRITICAL' || d.severity === 'VERY_HIGH'
        );
        
        if (criticalDetections.length > 0) {
          notifyPhytosanitaryResult({
            photoId: photoMetadata.id,
            detections: criticalDetections,
            confidence: result.confidence.overall,
            timestamp: new Date()
          });
        }
      }

      return result;

    } catch (error) {
      console.error('Error en análisis fitosanitario:', error);
      
      setAnalysisProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[photoMetadata.id];
        return newProgress;
      });

      return null;
    }
  }, [lotId, farmId, plantPartFocus, onAnalysisComplete, notifyPhytosanitaryResult]);

  // Procesar imagen capturada con validación fitosanitaria
  const processPhytosanitaryImage = useCallback(async (
    canvas: HTMLCanvasElement,
    blob: Blob,
    photoMetadata: Partial<PhotoMetadata>
  ): Promise<{
    isValid: boolean;
    imageQuality: ImageQualityMetrics;
    validationResult?: {
      isValid: boolean;
      issues: string[];
      recommendations: string[];
    };
    analysisResult?: PhytosanitaryAnalysisResult;
  }> => {
    // Analizar calidad de imagen
    const imageQuality = await analyzeImageQualityDetailed(canvas);
    
    // Validar imagen si está habilitado
    let validationResult;
    if (enableValidation) {
      validationResult = validatePhytosanitaryImage(imageQuality);
      
      if (!validationResult.isValid) {
        setValidationErrors(prev => ({
          ...prev,
          [photoMetadata.id || 'temp']: validationResult.issues
        }));
        
        return {
          isValid: false,
          imageQuality,
          validationResult
        };
      }
    }

    // Si la imagen es válida y se proporciona metadata completa, realizar análisis
    let analysisResult;
    if (photoMetadata.id && photoMetadata.filename) {
      analysisResult = await performPhytosanitaryAnalysis(photoMetadata as PhotoMetadata, blob);
    }

    return {
      isValid: true,
      imageQuality,
      validationResult,
      analysisResult: analysisResult || undefined
    };
  }, [enableValidation, validatePhytosanitaryImage, analyzeImageQualityDetailed, performPhytosanitaryAnalysis]);

  // Obtener resultado de análisis
  const getAnalysisResult = useCallback((photoId: string): PhytosanitaryAnalysisResult | undefined => {
    return phytosanitaryResults[photoId];
  }, [phytosanitaryResults]);

  // Obtener progreso de análisis
  const getAnalysisProgress = useCallback((photoId: string): number => {
    return analysisProgress[photoId] || 0;
  }, [analysisProgress]);

  // Obtener errores de validación
  const getValidationErrors = useCallback((photoId: string): string[] => {
    return validationErrors[photoId] || [];
  }, [validationErrors]);

  // Limpiar datos de análisis
  const clearAnalysisData = useCallback((photoId?: string) => {
    if (photoId) {
      setAnalysisProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[photoId];
        return newProgress;
      });
      setPhytosanitaryResults(prev => {
        const newResults = { ...prev };
        delete newResults[photoId];
        return newResults;
      });
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[photoId];
        return newErrors;
      });
    } else {
      setAnalysisProgress({});
      setPhytosanitaryResults({});
      setValidationErrors({});
    }
  }, []);

  return {
    // Funciones principales
    analyzeImageQualityDetailed,
    validatePhytosanitaryImage,
    performPhytosanitaryAnalysis,
    processPhytosanitaryImage,
    
    // Getters
    getAnalysisResult,
    getAnalysisProgress,
    getValidationErrors,
    
    // Utilidades
    clearAnalysisData,
    
    // Estados
    analysisProgress,
    phytosanitaryResults,
    validationErrors
  };
};