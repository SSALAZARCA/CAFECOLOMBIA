import { aiAgentService, AIAgentType, AnalysisPriority } from './aiAgentService';
import { offlineDB } from '@/utils/offlineDB';

// Tipos de análisis de imagen
export type ImageAnalysisType = 'quality' | 'content' | 'metadata' | 'preprocessing';

// Calidad de imagen
export interface ImageQualityMetrics {
  brightness: number;
  contrast: number;
  sharpness: number;
  noise: number;
  saturation: number;
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number; // 0-100
}

// Análisis de contenido
export interface ImageContentAnalysis {
  plantDetected: boolean;
  plantPart: 'leaf' | 'stem' | 'fruit' | 'root' | 'flower' | 'whole_plant' | 'unknown';
  plantCoverage: number; // Porcentaje de la imagen que contiene planta
  backgroundType: 'soil' | 'sky' | 'greenhouse' | 'mixed' | 'unknown';
  lightingConditions: 'natural' | 'artificial' | 'mixed' | 'poor';
  focusQuality: 'sharp' | 'slightly_blurred' | 'blurred';
  colorBalance: 'good' | 'warm' | 'cool' | 'poor';
  composition: 'centered' | 'off_center' | 'close_up' | 'wide_shot';
}

// Metadatos de imagen
export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  colorDepth: number;
  hasExif: boolean;
  captureDevice?: string;
  timestamp: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
  };
}

// Resultado completo del análisis
export interface ImageAnalysisResult {
  id: string;
  imageId: string;
  analysisTimestamp: string;
  quality: ImageQualityMetrics;
  content: ImageContentAnalysis;
  metadata: ImageMetadata;
  recommendations: string[];
  suitableForAI: boolean;
  confidence: number;
  processingTime: number;
}

// Configuración de análisis
export interface ImageAnalysisConfig {
  enableQualityCheck: boolean;
  enableContentAnalysis: boolean;
  enablePreprocessing: boolean;
  qualityThreshold: number;
  autoEnhance: boolean;
  saveOriginal: boolean;
  compressionQuality: number;
  maxResolution: { width: number; height: number };
}

class ImageAnalysisService {
  private config: ImageAnalysisConfig = {
    enableQualityCheck: true,
    enableContentAnalysis: true,
    enablePreprocessing: false,
    qualityThreshold: 0.6,
    autoEnhance: false,
    saveOriginal: true,
    compressionQuality: 0.8,
    maxResolution: { width: 1920, height: 1080 }
  };

  // Analizar imagen completa
  async analyzeImage(
    imageData: Blob,
    options: {
      includeQuality?: boolean;
      includeContent?: boolean;
      includeMetadata?: boolean;
      autoSubmitForAI?: boolean;
      aiAgentTypes?: AIAgentType[];
      priority?: AnalysisPriority;
    } = {}
  ): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`[ImageAnalysisService] Starting analysis for image: ${imageId}`);

      // Crear canvas para análisis
      const canvas = await this.createCanvasFromBlob(imageData);
      
      // Análisis de metadatos básicos
      const metadata = await this.extractMetadata(imageData, canvas);
      
      // Análisis de calidad (si está habilitado)
      let quality: ImageQualityMetrics | undefined;
      if (options.includeQuality !== false && this.config.enableQualityCheck) {
        quality = await this.analyzeImageQuality(canvas);
      }

      // Análisis de contenido (si está habilitado)
      let content: ImageContentAnalysis | undefined;
      if (options.includeContent !== false && this.config.enableContentAnalysis) {
        content = await this.analyzeImageContent(canvas);
      }

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(quality, content, metadata);
      
      // Determinar si es adecuada para IA
      const suitableForAI = this.evaluateSuitabilityForAI(quality, content);
      
      // Calcular confianza general
      const confidence = this.calculateOverallConfidence(quality, content);

      const processingTime = Date.now() - startTime;

      const result: ImageAnalysisResult = {
        id: `analysis_${imageId}`,
        imageId,
        analysisTimestamp: new Date().toISOString(),
        quality: quality || this.getDefaultQualityMetrics(),
        content: content || this.getDefaultContentAnalysis(),
        metadata,
        recommendations,
        suitableForAI,
        confidence,
        processingTime
      };

      // Guardar resultado en IndexedDB
      await this.saveAnalysisResult(result);

      // Auto-enviar para análisis de IA si está habilitado y es adecuada
      if (options.autoSubmitForAI && suitableForAI && options.aiAgentTypes) {
        await this.submitForAIAnalysis(
          imageData,
          result,
          options.aiAgentTypes,
          options.priority || 'medium'
        );
      }

      console.log(`[ImageAnalysisService] Completed analysis for image: ${imageId} in ${processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`[ImageAnalysisService] Error analyzing image ${imageId}:`, error);
      throw error;
    }
  }

  // Crear canvas desde blob
  private async createCanvasFromBlob(blob: Blob): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  // Extraer metadatos de imagen
  private async extractMetadata(blob: Blob, canvas: HTMLCanvasElement): Promise<ImageMetadata> {
    return {
      width: canvas.width,
      height: canvas.height,
      size: blob.size,
      format: blob.type,
      colorDepth: 24, // Asumimos 24-bit por defecto
      hasExif: false, // Simplificado por ahora
      timestamp: new Date().toISOString()
    };
  }

  // Analizar calidad de imagen
  private async analyzeImageQuality(canvas: HTMLCanvasElement): Promise<ImageQualityMetrics> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calcular métricas básicas
    const brightness = this.calculateBrightness(data);
    const contrast = this.calculateContrast(data);
    const sharpness = this.calculateSharpness(imageData);
    const noise = this.calculateNoise(data);
    const saturation = this.calculateSaturation(data);

    // Calcular puntuación general
    const score = this.calculateQualityScore(brightness, contrast, sharpness, noise, saturation);
    
    // Determinar calidad general
    let overall: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 80) overall = 'excellent';
    else if (score >= 65) overall = 'good';
    else if (score >= 50) overall = 'fair';
    else overall = 'poor';

    return {
      brightness,
      contrast,
      sharpness,
      noise,
      saturation,
      overall,
      score
    };
  }

  // Analizar contenido de imagen
  private async analyzeImageContent(canvas: HTMLCanvasElement): Promise<ImageContentAnalysis> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Análisis simplificado de contenido
    const plantDetected = this.detectPlant(imageData);
    const plantPart = this.identifyPlantPart(imageData);
    const plantCoverage = this.calculatePlantCoverage(imageData);
    const backgroundType = this.identifyBackground(imageData);
    const lightingConditions = this.analyzeLighting(imageData);
    const focusQuality = this.analyzeFocus(imageData);
    const colorBalance = this.analyzeColorBalance(imageData);
    const composition = this.analyzeComposition(imageData);

    return {
      plantDetected,
      plantPart,
      plantCoverage,
      backgroundType,
      lightingConditions,
      focusQuality,
      colorBalance,
      composition
    };
  }

  // Calcular brillo promedio
  private calculateBrightness(data: Uint8ClampedArray): number {
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      total += (r + g + b) / 3;
    }
    return total / (data.length / 4);
  }

  // Calcular contraste
  private calculateContrast(data: Uint8ClampedArray): number {
    const brightness = this.calculateBrightness(data);
    let variance = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelBrightness = (r + g + b) / 3;
      variance += Math.pow(pixelBrightness - brightness, 2);
    }
    
    return Math.sqrt(variance / (data.length / 4));
  }

  // Calcular nitidez (simplificado)
  private calculateSharpness(imageData: ImageData): number {
    // Implementación simplificada usando detección de bordes
    const data = imageData.data;
    const width = imageData.width;
    let edgeStrength = 0;
    
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        
        edgeStrength += Math.abs(current - right) + Math.abs(current - bottom);
      }
    }
    
    return edgeStrength / ((imageData.width - 2) * (imageData.height - 2));
  }

  // Calcular ruido (simplificado)
  private calculateNoise(data: Uint8ClampedArray): number {
    // Implementación simplificada
    let noise = 0;
    for (let i = 0; i < data.length - 12; i += 4) {
      const r1 = data[i], g1 = data[i + 1], b1 = data[i + 2];
      const r2 = data[i + 4], g2 = data[i + 5], b2 = data[i + 6];
      const r3 = data[i + 8], g3 = data[i + 9], b3 = data[i + 10];
      
      noise += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      noise += Math.abs(r2 - r3) + Math.abs(g2 - g3) + Math.abs(b2 - b3);
    }
    return noise / (data.length / 4);
  }

  // Calcular saturación
  private calculateSaturation(data: Uint8ClampedArray): number {
    let totalSaturation = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      
      totalSaturation += saturation;
    }
    
    return (totalSaturation / (data.length / 4)) * 100;
  }

  // Calcular puntuación de calidad
  private calculateQualityScore(
    brightness: number,
    contrast: number,
    sharpness: number,
    noise: number,
    saturation: number
  ): number {
    // Normalizar métricas a escala 0-100
    const brightnessScore = Math.max(0, 100 - Math.abs(brightness - 128) * 2);
    const contrastScore = Math.min(100, contrast * 2);
    const sharpnessScore = Math.min(100, sharpness / 2);
    const noiseScore = Math.max(0, 100 - noise);
    const saturationScore = Math.min(100, saturation * 2);
    
    // Promedio ponderado
    return (
      brightnessScore * 0.2 +
      contrastScore * 0.25 +
      sharpnessScore * 0.3 +
      noiseScore * 0.15 +
      saturationScore * 0.1
    );
  }

  // Detectar presencia de planta (simplificado)
  private detectPlant(imageData: ImageData): boolean {
    const data = imageData.data;
    let greenPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Detectar tonos verdes
      if (g > r && g > b && g > 80) {
        greenPixels++;
      }
    }
    
    const greenPercentage = (greenPixels / (data.length / 4)) * 100;
    return greenPercentage > 15; // Si más del 15% son píxeles verdes
  }

  // Identificar parte de la planta (simplificado)
  private identifyPlantPart(imageData: ImageData): ImageContentAnalysis['plantPart'] {
    // Implementación simplificada - en producción usaríamos ML
    const data = imageData.data;
    let greenIntensity = 0;
    let brownIntensity = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (g > r && g > b) greenIntensity++;
      if (r > 100 && g > 50 && b < 50) brownIntensity++;
    }
    
    if (greenIntensity > brownIntensity * 3) return 'leaf';
    if (brownIntensity > greenIntensity) return 'stem';
    return 'unknown';
  }

  // Calcular cobertura de planta
  private calculatePlantCoverage(imageData: ImageData): number {
    const data = imageData.data;
    let plantPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Detectar píxeles de planta (verde o marrón)
      if ((g > r && g > b && g > 80) || (r > 100 && g > 50 && b < 50)) {
        plantPixels++;
      }
    }
    
    return (plantPixels / (data.length / 4)) * 100;
  }

  // Identificar tipo de fondo
  private identifyBackground(imageData: ImageData): ImageContentAnalysis['backgroundType'] {
    const data = imageData.data;
    let soilPixels = 0;
    let skyPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Detectar suelo (tonos marrones)
      if (r > 80 && g > 60 && b < 80 && Math.abs(r - g) < 50) {
        soilPixels++;
      }
      
      // Detectar cielo (tonos azules)
      if (b > r && b > g && b > 100) {
        skyPixels++;
      }
    }
    
    const totalPixels = data.length / 4;
    if (soilPixels / totalPixels > 0.3) return 'soil';
    if (skyPixels / totalPixels > 0.3) return 'sky';
    return 'mixed';
  }

  // Analizar condiciones de iluminación
  private analyzeLighting(imageData: ImageData): ImageContentAnalysis['lightingConditions'] {
    const brightness = this.calculateBrightness(imageData.data);
    
    if (brightness < 60) return 'poor';
    if (brightness > 200) return 'artificial';
    return 'natural';
  }

  // Analizar calidad de enfoque
  private analyzeFocus(imageData: ImageData): ImageContentAnalysis['focusQuality'] {
    const sharpness = this.calculateSharpness(imageData);
    
    if (sharpness > 15) return 'sharp';
    if (sharpness > 8) return 'slightly_blurred';
    return 'blurred';
  }

  // Analizar balance de color
  private analyzeColorBalance(imageData: ImageData): ImageContentAnalysis['colorBalance'] {
    const data = imageData.data;
    let rTotal = 0, gTotal = 0, bTotal = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      rTotal += data[i];
      gTotal += data[i + 1];
      bTotal += data[i + 2];
    }
    
    const pixels = data.length / 4;
    const rAvg = rTotal / pixels;
    const gAvg = gTotal / pixels;
    const bAvg = bTotal / pixels;
    
    const maxDiff = Math.max(
      Math.abs(rAvg - gAvg),
      Math.abs(gAvg - bAvg),
      Math.abs(rAvg - bAvg)
    );
    
    if (maxDiff < 20) return 'good';
    if (rAvg > gAvg && rAvg > bAvg) return 'warm';
    if (bAvg > rAvg && bAvg > gAvg) return 'cool';
    return 'poor';
  }

  // Analizar composición
  private analyzeComposition(imageData: ImageData): ImageContentAnalysis['composition'] {
    // Implementación simplificada
    const width = imageData.width;
    const height = imageData.height;
    
    // Analizar distribución de contenido en el centro vs bordes
    const centerX = width / 2;
    const centerY = height / 2;
    const centerRadius = Math.min(width, height) / 4;
    
    let centerContent = 0;
    let totalContent = 0;
    
    const data = imageData.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Detectar contenido (no fondo)
        if (g > 80 || (r > 100 && g > 50)) {
          totalContent++;
          
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          
          if (distanceFromCenter < centerRadius) {
            centerContent++;
          }
        }
      }
    }
    
    if (totalContent === 0) return 'wide_shot';
    
    const centerRatio = centerContent / totalContent;
    if (centerRatio > 0.7) return 'centered';
    if (centerRatio > 0.4) return 'close_up';
    return 'off_center';
  }

  // Generar recomendaciones
  private generateRecommendations(
    quality?: ImageQualityMetrics,
    content?: ImageContentAnalysis,
    metadata?: ImageMetadata
  ): string[] {
    const recommendations: string[] = [];

    if (quality) {
      if (quality.brightness < 80) {
        recommendations.push('Mejorar iluminación - la imagen está muy oscura');
      } else if (quality.brightness > 200) {
        recommendations.push('Reducir exposición - la imagen está sobreexpuesta');
      }

      if (quality.contrast < 30) {
        recommendations.push('Aumentar contraste para mejor definición');
      }

      if (quality.sharpness < 10) {
        recommendations.push('Mejorar enfoque - la imagen está borrosa');
      }

      if (quality.noise > 50) {
        recommendations.push('Reducir ruido - usar mejor iluminación o estabilización');
      }
    }

    if (content) {
      if (!content.plantDetected) {
        recommendations.push('Asegurar que la planta sea visible en la imagen');
      }

      if (content.plantCoverage < 30) {
        recommendations.push('Acercarse más al sujeto para mejor análisis');
      }

      if (content.lightingConditions === 'poor') {
        recommendations.push('Mejorar condiciones de iluminación');
      }

      if (content.focusQuality === 'blurred') {
        recommendations.push('Enfocar mejor el sujeto principal');
      }
    }

    if (metadata) {
      if (metadata.size > 5 * 1024 * 1024) { // 5MB
        recommendations.push('Considerar comprimir la imagen para mejor rendimiento');
      }

      if (metadata.width < 800 || metadata.height < 600) {
        recommendations.push('Usar mayor resolución para mejor análisis');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Imagen adecuada para análisis de IA');
    }

    return recommendations;
  }

  // Evaluar idoneidad para IA
  private evaluateSuitabilityForAI(
    quality?: ImageQualityMetrics,
    content?: ImageContentAnalysis
  ): boolean {
    if (!quality || !content) return false;

    // Criterios mínimos para análisis de IA
    const qualityOk = quality.score >= this.config.qualityThreshold * 100;
    const plantDetected = content.plantDetected;
    const adequateCoverage = content.plantCoverage >= 20;
    const goodFocus = content.focusQuality !== 'blurred';
    const goodLighting = content.lightingConditions !== 'poor';

    return qualityOk && plantDetected && adequateCoverage && goodFocus && goodLighting;
  }

  // Calcular confianza general
  private calculateOverallConfidence(
    quality?: ImageQualityMetrics,
    content?: ImageContentAnalysis
  ): number {
    if (!quality || !content) return 0.5;

    const qualityScore = quality.score / 100;
    const contentScore = (
      (content.plantDetected ? 0.3 : 0) +
      (content.plantCoverage / 100 * 0.2) +
      (content.focusQuality === 'sharp' ? 0.2 : content.focusQuality === 'slightly_blurred' ? 0.1 : 0) +
      (content.lightingConditions === 'natural' ? 0.2 : content.lightingConditions === 'artificial' ? 0.15 : 0.05) +
      (content.colorBalance === 'good' ? 0.1 : 0.05)
    );

    return (qualityScore * 0.6 + contentScore * 0.4);
  }

  // Obtener métricas de calidad por defecto
  private getDefaultQualityMetrics(): ImageQualityMetrics {
    return {
      brightness: 128,
      contrast: 50,
      sharpness: 10,
      noise: 20,
      saturation: 50,
      overall: 'fair',
      score: 50
    };
  }

  // Obtener análisis de contenido por defecto
  private getDefaultContentAnalysis(): ImageContentAnalysis {
    return {
      plantDetected: false,
      plantPart: 'unknown',
      plantCoverage: 0,
      backgroundType: 'unknown',
      lightingConditions: 'natural',
      focusQuality: 'sharp',
      colorBalance: 'good',
      composition: 'centered'
    };
  }

  // Guardar resultado de análisis
  private async saveAnalysisResult(result: ImageAnalysisResult): Promise<void> {
    try {
      // Guardar en localStorage para acceso rápido
      const existingResults = JSON.parse(localStorage.getItem('image_analysis_results') || '[]');
      existingResults.push(result);
      
      // Mantener solo los últimos 100 resultados
      if (existingResults.length > 100) {
        existingResults.splice(0, existingResults.length - 100);
      }
      
      localStorage.setItem('image_analysis_results', JSON.stringify(existingResults));
      
      console.log(`[ImageAnalysisService] Saved analysis result: ${result.id}`);
    } catch (error) {
      console.error('[ImageAnalysisService] Error saving analysis result:', error);
    }
  }

  // Enviar para análisis de IA
  private async submitForAIAnalysis(
    imageData: Blob,
    analysisResult: ImageAnalysisResult,
    agentTypes: AIAgentType[],
    priority: AnalysisPriority
  ): Promise<void> {
    try {
      for (const agentType of agentTypes) {
        await aiAgentService.createAnalysisRequest(
          agentType,
          imageData,
          {
            farmId: 'default',
            lotId: 'default',
            plantPart: analysisResult.content.plantPart,
            gpsCoordinates: analysisResult.metadata.gpsCoordinates,
            captureTimestamp: analysisResult.analysisTimestamp,
            deviceInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language
            },
            imageQuality: analysisResult.quality.overall,
            lightingConditions: analysisResult.content.lightingConditions,
            focusQuality: analysisResult.content.focusQuality
          },
          {
            priority,
            autoAnalyze: true
          }
        );
      }
      
      console.log(`[ImageAnalysisService] Submitted image for AI analysis: ${analysisResult.id}`);
    } catch (error) {
      console.error('[ImageAnalysisService] Error submitting for AI analysis:', error);
    }
  }

  // Obtener configuración actual
  getConfig(): ImageAnalysisConfig {
    return { ...this.config };
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<ImageAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('image_analysis_config', JSON.stringify(this.config));
  }

  // Obtener resultados de análisis guardados
  getAnalysisResults(limit: number = 50): ImageAnalysisResult[] {
    try {
      const results = JSON.parse(localStorage.getItem('image_analysis_results') || '[]');
      return results.slice(-limit).reverse(); // Más recientes primero
    } catch (error) {
      console.error('[ImageAnalysisService] Error getting analysis results:', error);
      return [];
    }
  }

  // Limpiar resultados antiguos
  cleanupOldResults(daysToKeep: number = 7): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const results = this.getAnalysisResults(1000);
      const filteredResults = results.filter(result => 
        new Date(result.analysisTimestamp) > cutoffDate
      );
      
      localStorage.setItem('image_analysis_results', JSON.stringify(filteredResults));
      
      console.log(`[ImageAnalysisService] Cleaned up analysis results older than ${daysToKeep} days`);
    } catch (error) {
      console.error('[ImageAnalysisService] Error cleaning up old results:', error);
    }
  }
}

// Instancia singleton del servicio
export const imageAnalysisService = new ImageAnalysisService();