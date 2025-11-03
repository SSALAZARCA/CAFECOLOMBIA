// Servicio de Detección de Enfermedades - Agente Fitosanitario
import { 
  CoffeeDiseaseType, 
  PlantPartType, 
  SeverityLevel, 
  ConfidenceLevel,
  ImageQualityMetrics,
  DiseaseDetection,
  TreatmentRecommendation,
  PhytosanitaryAnalysisRequest,
  PhytosanitaryAnalysisResult,
  DiagnosisHistory,
  PhytosanitaryConfig,
  PhytosanitaryNotification,
  PhytosanitaryStats
} from '../types/phytosanitary';
import { offlineDB } from '../utils/offlineDB';
import { notificationService } from './notificationService';
import { offlineAnalysisQueue } from './offlineAnalysisQueue';

export class DiseaseDetectionService {
  private static instance: DiseaseDetectionService;
  private config: PhytosanitaryConfig;
  private analysisQueue: PhytosanitaryAnalysisRequest[] = [];
  private isProcessing = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.loadQueueFromStorage();
  }

  static getInstance(): DiseaseDetectionService {
    if (!DiseaseDetectionService.instance) {
      DiseaseDetectionService.instance = new DiseaseDetectionService();
    }
    return DiseaseDetectionService.instance;
  }

  private getDefaultConfig(): PhytosanitaryConfig {
    return {
      modelSettings: {
        confidenceThreshold: 70,
        enableMultipleDetections: true,
        maxDetectionsPerImage: 5,
        enableSeverityAnalysis: true
      },
      imageProcessing: {
        maxImageSize: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        autoEnhancement: true,
        qualityThreshold: 60
      },
      notifications: {
        enableRealTime: true,
        criticalThreshold: 'HIGH',
        notifyOnLowConfidence: false,
        emailNotifications: false,
        pushNotifications: true
      },
      offline: {
        enableOfflineAnalysis: true,
        maxQueueSize: 50,
        autoSyncWhenOnline: true,
        cacheResults: true,
        cacheDuration: 30
      }
    };
  }

  // Análisis principal de imagen
  async analyzeImage(request: PhytosanitaryAnalysisRequest): Promise<PhytosanitaryAnalysisResult> {
    try {
      console.log(`[DiseaseDetection] Iniciando análisis de imagen: ${request.id}`);
      
      // Si no hay conexión, agregar a la cola offline
      if (!navigator.onLine) {
        console.log('Sin conexión - agregando análisis a cola offline');
        const queueId = await offlineAnalysisQueue.addToQueue(
          request, 
          request.imageBlob,
          this.determinePriority(request)
        );
        
        // Retornar resultado temporal indicando que está en cola
        return this.createQueuedResult(request, queueId);
      }
      
      // Validar imagen
      const imageQuality = await this.assessImageQuality(request.imageUrl, request.imageBlob);
      
      if (imageQuality.overall < this.config.imageProcessing.qualityThreshold) {
        throw new Error(`Calidad de imagen insuficiente: ${imageQuality.overall}%`);
      }

      // Simular procesamiento (en producción sería llamada a modelo de IA)
      const detections = await this.performDiseaseDetection(request, imageQuality);
      
      // Generar recomendaciones de tratamiento
      const recommendations = await this.generateTreatmentRecommendations(detections);
      
      // Calcular métricas de salud
      const healthScore = this.calculateHealthScore(detections);
      const riskAssessment = this.assessRisk(detections);
      
      const result: PhytosanitaryAnalysisResult = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId: request.id,
        imageQuality,
        detections,
        primaryDiagnosis: detections.length > 0 ? detections[0] : undefined,
        recommendations,
        overallHealthScore: healthScore,
        riskAssessment,
        confidence: {
          overall: detections.length > 0 ? Math.max(...detections.map(d => d.confidence)) : 0,
          detection: detections.length > 0 ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length : 0,
          severity: detections.length > 0 ? detections.reduce((sum, d) => sum + this.severityToNumber(d.severity), 0) / detections.length : 0,
          treatment: recommendations.length > 0 ? recommendations.reduce((sum, r) => sum + r.effectiveness, 0) / recommendations.length : 0
        },
        processingTime: Math.random() * 3000 + 1000, // 1-4 segundos simulado
        modelVersion: 'CafeColombiaAI-v1.2.0',
        analysisDate: new Date(),
        notes: this.generateAnalysisNotes(detections, imageQuality)
      };

      // Guardar resultado
      await this.saveAnalysisResult(result);
      
      // Enviar notificaciones si es necesario
      await this.handleNotifications(result);
      
      console.log(`[DiseaseDetection] Análisis completado: ${result.id}`);
      return result;

    } catch (error) {
      console.error('[DiseaseDetection] Error en análisis:', error);
      
      // Si hay error y no hay conexión, intentar agregar a cola
      if (!navigator.onLine) {
        const queueId = await offlineAnalysisQueue.addToQueue(
          request, 
          request.imageBlob,
          'HIGH' // Prioridad alta para reintentos
        );
        return this.createQueuedResult(request, queueId);
      }
      
      throw error;
    }
  }

  // Evaluación de calidad de imagen
  private async assessImageQuality(imageUrl: string, imageBlob?: Blob): Promise<ImageQualityMetrics> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Crear canvas para análisis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Análisis básico de calidad (simulado)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Calcular métricas básicas
        const brightness = this.calculateBrightness(pixels);
        const contrast = this.calculateContrast(pixels);
        const sharpness = this.calculateSharpness(pixels, canvas.width, canvas.height);
        const colorBalance = this.calculateColorBalance(pixels);
        const noiseLevel = this.calculateNoiseLevel(pixels);

        const overall = Math.round((brightness + contrast + sharpness + colorBalance + (100 - noiseLevel)) / 5);

        resolve({
          overall,
          sharpness,
          brightness,
          contrast,
          colorBalance,
          noiseLevel,
          resolution: {
            width: img.width,
            height: img.height,
            megapixels: Math.round((img.width * img.height) / 1000000 * 100) / 100
          },
          lighting: overall > 80 ? 'EXCELLENT' : overall > 60 ? 'GOOD' : overall > 40 ? 'FAIR' : 'POOR',
          focus: sharpness > 80 ? 'SHARP' : sharpness > 60 ? 'SLIGHTLY_BLURRED' : 'BLURRED',
          composition: overall > 75 ? 'EXCELLENT' : overall > 55 ? 'GOOD' : overall > 35 ? 'FAIR' : 'POOR'
        });
      };
      img.src = imageUrl;
    });
  }

  // Detección de enfermedades (simulada con lógica inteligente)
  private async performDiseaseDetection(
    request: PhytosanitaryAnalysisRequest, 
    imageQuality: ImageQualityMetrics
  ): Promise<DiseaseDetection[]> {
    
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    const detections: DiseaseDetection[] = [];
    
    // Lógica de detección simulada basada en probabilidades realistas
    const diseaseDatabase = this.getDiseaseDatabase();
    const plantPart = request.analysisOptions.plantPartFocus || 'LEAF';
    
    // Factores que influyen en la detección
    const qualityFactor = imageQuality.overall / 100;
    const seasonalFactor = this.getSeasonalFactor();
    const altitudeFactor = this.getAltitudeFactor(request.metadata.gpsCoordinates?.latitude);
    
    // Probabilidades base por enfermedad
    const baseProbabilities = {
      'ROYA': 0.25 * seasonalFactor,
      'BROCA': 0.20 * seasonalFactor,
      'ANTRACNOSIS': 0.15,
      'MANCHA_HIERRO': 0.12,
      'OJO_GALLO': 0.08 * altitudeFactor,
      'DEFICIENCIA_N': 0.10,
      'DEFICIENCIA_K': 0.08,
      'HEALTHY': 0.30
    };

    // Generar detecciones basadas en probabilidades
    for (const [disease, baseProbability] of Object.entries(baseProbabilities)) {
      const adjustedProbability = baseProbability * qualityFactor;
      
      if (Math.random() < adjustedProbability && disease !== 'HEALTHY') {
        const confidence = Math.round(60 + Math.random() * 35); // 60-95%
        
        if (confidence >= this.config.modelSettings.confidenceThreshold) {
          const detection = this.createDiseaseDetection(
            disease as CoffeeDiseaseType,
            confidence,
            plantPart,
            imageQuality
          );
          detections.push(detection);
        }
      }
    }

    // Si no se detectaron enfermedades, considerar planta saludable
    if (detections.length === 0 && Math.random() > 0.3) {
      detections.push(this.createDiseaseDetection('HEALTHY', 85 + Math.random() * 10, plantPart, imageQuality));
    }

    // Ordenar por confianza
    return detections.sort((a, b) => b.confidence - a.confidence);
  }

  private createDiseaseDetection(
    disease: CoffeeDiseaseType,
    confidence: number,
    plantPart: PlantPartType,
    imageQuality: ImageQualityMetrics
  ): DiseaseDetection {
    const diseaseInfo = this.getDiseaseInfo(disease);
    const severity = this.calculateSeverity(disease, confidence);
    const affectedArea = this.calculateAffectedArea(severity);

    return {
      disease,
      confidence,
      confidenceLevel: this.getConfidenceLevel(confidence),
      severity,
      affectedArea,
      plantPart,
      symptoms: diseaseInfo.symptoms,
      description: diseaseInfo.description,
      boundingBox: {
        x: Math.random() * 0.3,
        y: Math.random() * 0.3,
        width: 0.4 + Math.random() * 0.3,
        height: 0.4 + Math.random() * 0.3
      }
    };
  }

  // Generar recomendaciones de tratamiento
  private async generateTreatmentRecommendations(detections: DiseaseDetection[]): Promise<TreatmentRecommendation[]> {
    const recommendations: TreatmentRecommendation[] = [];

    for (const detection of detections) {
      if (detection.disease === 'HEALTHY') continue;

      const treatmentData = this.getTreatmentData(detection.disease, detection.severity);
      
      const recommendation: TreatmentRecommendation = {
        id: `treatment_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        disease: detection.disease,
        severity: detection.severity,
        treatment: treatmentData.treatment,
        preventiveMeasures: treatmentData.preventiveMeasures,
        urgency: this.calculateUrgency(detection.severity, detection.confidence),
        effectiveness: treatmentData.effectiveness,
        environmentalImpact: treatmentData.environmentalImpact,
        safetyPrecautions: treatmentData.safetyPrecautions,
        relatedProducts: treatmentData.relatedProducts
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  // Base de datos de enfermedades
  private getDiseaseDatabase() {
    return {
      'ROYA': {
        symptoms: ['Manchas amarillas en hojas', 'Polvillo naranja en envés', 'Defoliación prematura'],
        description: 'Roya del café causada por Hemileia vastatrix, hongo que afecta principalmente las hojas'
      },
      'BROCA': {
        symptoms: ['Perforaciones en frutos', 'Granos dañados', 'Caída prematura de frutos'],
        description: 'Broca del café (Hypothenemus hampei), insecto que perfora y daña los granos'
      },
      'ANTRACNOSIS': {
        symptoms: ['Manchas necróticas en hojas', 'Lesiones en frutos', 'Defoliación'],
        description: 'Antracnosis causada por Colletotrichum spp., afecta hojas y frutos'
      },
      'MANCHA_HIERRO': {
        symptoms: ['Manchas circulares pardas', 'Halo amarillento', 'Defoliación gradual'],
        description: 'Mancha de hierro por Cercospora coffeicola, común en condiciones húmedas'
      },
      'OJO_GALLO': {
        symptoms: ['Manchas circulares con centro claro', 'Anillos concéntricos', 'Perforaciones'],
        description: 'Ojo de gallo causado por Mycena citricolor, típico de zonas altas y húmedas'
      },
      'DEFICIENCIA_N': {
        symptoms: ['Amarillamiento general', 'Crecimiento lento', 'Hojas pequeñas'],
        description: 'Deficiencia de nitrógeno, nutriente esencial para el crecimiento'
      },
      'DEFICIENCIA_K': {
        symptoms: ['Bordes amarillos en hojas', 'Necrosis marginal', 'Frutos pequeños'],
        description: 'Deficiencia de potasio, importante para la calidad del fruto'
      },
      'HEALTHY': {
        symptoms: ['Hojas verdes vigorosas', 'Crecimiento normal', 'Sin síntomas patológicos'],
        description: 'Planta saludable sin signos de enfermedad o deficiencias nutricionales'
      }
    };
  }

  // Datos de tratamiento por enfermedad
  private getTreatmentData(disease: CoffeeDiseaseType, severity: SeverityLevel) {
    const treatments = {
      'ROYA': {
        treatment: {
          type: 'CHEMICAL' as const,
          name: 'Fungicida cúprico + Triazol',
          activeIngredient: 'Oxicloruro de cobre + Tebuconazole',
          dosage: '2-3 kg/ha + 0.5 L/ha',
          applicationMethod: 'Aspersión foliar',
          frequency: 'Cada 21-28 días',
          duration: '3-4 aplicaciones',
          cost: { estimated: 45000, currency: 'COP', unit: 'por hectárea' }
        },
        preventiveMeasures: [
          'Manejo de sombra adecuado',
          'Poda sanitaria',
          'Fertilización balanceada',
          'Monitoreo constante'
        ],
        effectiveness: 85,
        environmentalImpact: 'MEDIUM' as const,
        safetyPrecautions: [
          'Usar equipo de protección personal',
          'No aplicar con viento fuerte',
          'Respetar período de carencia'
        ],
        relatedProducts: ['fungicida_cuprico', 'triazol_tebuconazole']
      },
      'BROCA': {
        treatment: {
          type: 'INTEGRATED' as const,
          name: 'Control biológico + Cultural',
          activeIngredient: 'Beauveria bassiana',
          dosage: '2-3 kg/ha',
          applicationMethod: 'Aspersión + Recolección sanitaria',
          frequency: 'Cada 15-20 días',
          duration: 'Durante cosecha',
          cost: { estimated: 35000, currency: 'COP', unit: 'por hectárea' }
        },
        preventiveMeasures: [
          'Recolección oportuna',
          'Repase frecuente',
          'Eliminación de frutos brocados',
          'Trampas con alcohol'
        ],
        effectiveness: 75,
        environmentalImpact: 'LOW' as const,
        safetyPrecautions: [
          'Almacenar en lugar fresco y seco',
          'No mezclar con fungicidas químicos'
        ],
        relatedProducts: ['beauveria_bassiana', 'trampa_alcohol']
      }
      // Agregar más tratamientos según sea necesario
    };

    return treatments[disease] || treatments['ROYA']; // Fallback
  }

  // Métodos auxiliares para cálculos
  private calculateBrightness(pixels: Uint8ClampedArray): number {
    let sum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      sum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    }
    return Math.round((sum / (pixels.length / 4)) / 255 * 100);
  }

  private calculateContrast(pixels: Uint8ClampedArray): number {
    const brightness = this.calculateBrightness(pixels);
    let variance = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const pixelBrightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      variance += Math.pow(pixelBrightness - brightness * 2.55, 2);
    }
    const stdDev = Math.sqrt(variance / (pixels.length / 4));
    return Math.min(100, Math.round(stdDev / 2.55));
  }

  private calculateSharpness(pixels: Uint8ClampedArray, width: number, height: number): number {
    // Algoritmo simplificado de detección de bordes
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
  }

  private calculateColorBalance(pixels: Uint8ClampedArray): number {
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
  }

  private calculateNoiseLevel(pixels: Uint8ClampedArray): number {
    // Estimación simple de ruido
    return Math.round(Math.random() * 20 + 5); // 5-25% simulado
  }

  private getSeasonalFactor(): number {
    const month = new Date().getMonth();
    // Temporada de lluvias en Colombia (abril-noviembre)
    return month >= 3 && month <= 10 ? 1.3 : 0.8;
  }

  private getAltitudeFactor(latitude?: number): number {
    // Factor basado en altitud estimada por latitud
    if (!latitude) return 1;
    return latitude > 4 ? 1.2 : 0.9; // Zonas más altas tienen más riesgo de ciertas enfermedades
  }

  private calculateSeverity(disease: CoffeeDiseaseType, confidence: number): SeverityLevel {
    if (disease === 'HEALTHY') return 'VERY_LOW';
    
    const severityScore = confidence * (0.7 + Math.random() * 0.6);
    
    if (severityScore >= 85) return 'CRITICAL';
    if (severityScore >= 70) return 'VERY_HIGH';
    if (severityScore >= 55) return 'HIGH';
    if (severityScore >= 40) return 'MODERATE';
    if (severityScore >= 25) return 'LOW';
    return 'VERY_LOW';
  }

  private calculateAffectedArea(severity: SeverityLevel): number {
    const ranges = {
      'VERY_LOW': [0, 10],
      'LOW': [11, 25],
      'MODERATE': [26, 50],
      'HIGH': [51, 75],
      'VERY_HIGH': [76, 90],
      'CRITICAL': [91, 100]
    };
    
    const [min, max] = ranges[severity];
    return Math.round(min + Math.random() * (max - min));
  }

  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 86) return 'VERY_HIGH';
    if (confidence >= 71) return 'HIGH';
    if (confidence >= 51) return 'MODERATE';
    if (confidence >= 31) return 'LOW';
    return 'VERY_LOW';
  }

  private calculateHealthScore(detections: DiseaseDetection[]): number {
    if (detections.length === 0) return 50;
    
    const healthyDetection = detections.find(d => d.disease === 'HEALTHY');
    if (healthyDetection) return healthyDetection.confidence;
    
    // Calcular score basado en severidad de enfermedades
    const avgSeverity = detections.reduce((sum, d) => sum + this.severityToNumber(d.severity), 0) / detections.length;
    return Math.max(0, 100 - avgSeverity);
  }

  private severityToNumber(severity: SeverityLevel): number {
    const mapping = {
      'VERY_LOW': 5,
      'LOW': 18,
      'MODERATE': 38,
      'HIGH': 63,
      'VERY_HIGH': 83,
      'CRITICAL': 95
    };
    return mapping[severity];
  }

  private assessRisk(detections: DiseaseDetection[]) {
    const maxSeverity = detections.reduce((max, d) => {
      const severityNum = this.severityToNumber(d.severity);
      return severityNum > max ? severityNum : max;
    }, 0);

    const getRiskLevel = (score: number) => {
      if (score >= 80) return 'CRITICAL' as const;
      if (score >= 60) return 'HIGH' as const;
      if (score >= 30) return 'MEDIUM' as const;
      return 'LOW' as const;
    };

    return {
      spreadRisk: getRiskLevel(maxSeverity),
      economicImpact: getRiskLevel(maxSeverity * 0.8),
      urgencyLevel: getRiskLevel(maxSeverity),
      timeToAction: maxSeverity >= 80 ? '24 horas' : maxSeverity >= 60 ? '3-5 días' : '1-2 semanas'
    };
  }

  private calculateUrgency(severity: SeverityLevel, confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityScore = this.severityToNumber(severity);
    const urgencyScore = (severityScore + confidence) / 2;
    
    if (urgencyScore >= 80) return 'CRITICAL';
    if (urgencyScore >= 60) return 'HIGH';
    if (urgencyScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private generateAnalysisNotes(detections: DiseaseDetection[], imageQuality: ImageQualityMetrics): string {
    const notes = [];
    
    if (imageQuality.overall < 70) {
      notes.push('Calidad de imagen subóptima. Considere tomar nuevas fotos con mejor iluminación.');
    }
    
    if (detections.length === 0) {
      notes.push('No se detectaron enfermedades evidentes. Continúe con monitoreo preventivo.');
    } else if (detections.length > 3) {
      notes.push('Múltiples problemas detectados. Se recomienda consulta con especialista.');
    }
    
    const criticalDetections = detections.filter(d => d.severity === 'CRITICAL' || d.severity === 'VERY_HIGH');
    if (criticalDetections.length > 0) {
      notes.push('Atención inmediata requerida para prevenir propagación.');
    }
    
    return notes.join(' ');
  }

  private getDiseaseInfo(disease: CoffeeDiseaseType) {
    const database = this.getDiseaseDatabase();
    return database[disease] || database['HEALTHY'];
  }

  // Determinar prioridad del análisis
  private determinePriority(request: PhytosanitaryAnalysisRequest): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Prioridad basada en el contexto del análisis
    if (request.analysisOptions.plantPartFocus === 'FRUIT') {
      return 'HIGH'; // Frutos son críticos para la cosecha
    }
    
    if (request.metadata.lotId && request.metadata.lotId.includes('critical')) {
      return 'CRITICAL';
    }
    
    return 'MEDIUM';
  }

  // Crear resultado temporal para análisis en cola
  private createQueuedResult(request: PhytosanitaryAnalysisRequest, queueId: string): PhytosanitaryAnalysisResult {
    return {
      id: `queued_${request.id}`,
      requestId: request.id,
      imageQuality: {
        overall: 0,
        sharpness: 0,
        brightness: 0,
        contrast: 0,
        colorBalance: 0,
        noiseLevel: 0,
        resolution: { width: 0, height: 0, megapixels: 0 },
        lighting: 'POOR',
        focus: 'BLURRED',
        composition: 'POOR'
      },
      detections: [],
      primaryDiagnosis: undefined,
      recommendations: [],
      overallHealthScore: 0,
      riskAssessment: {
        spreadRisk: 'LOW',
        economicImpact: 'LOW',
        urgencyLevel: 'LOW',
        timeToAction: 'Pendiente análisis'
      },
      confidence: {
        overall: 0,
        detection: 0,
        severity: 0,
        treatment: 0
      },
      processingTime: 0,
      modelVersion: 'CafeColombiaAI-v1.2.0',
      analysisDate: new Date(),
      notes: `Análisis en cola offline. ID: ${queueId}`
    };
  }

  // Gestión de persistencia y notificaciones
  private async saveAnalysisResult(result: PhytosanitaryAnalysisResult): Promise<void> {
    try {
      // Guardar en IndexedDB
      await offlineDB.phytosanitaryAnalyses.add({
        id: result.id,
        requestId: result.requestId,
        lotId: result.requestId.split('_')[1] || '',
        farmId: result.requestId.split('_')[2] || '',
        result: JSON.stringify(result),
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING'
      });
      
      console.log(`[DiseaseDetection] Resultado guardado: ${result.id}`);
    } catch (error) {
      console.error('[DiseaseDetection] Error guardando resultado:', error);
    }
  }

  private async handleNotifications(result: PhytosanitaryAnalysisResult): Promise<void> {
    if (!this.config.notifications.enableRealTime) return;

    const criticalDetections = result.detections.filter(d => 
      this.severityToNumber(d.severity) >= this.severityToNumber(this.config.notifications.criticalThreshold)
    );

    if (criticalDetections.length > 0) {
      for (const detection of criticalDetections) {
        await notificationService.sendNotification({
          title: '🚨 Enfermedad Crítica Detectada',
          message: `${this.getDiseaseInfo(detection.disease).description} - Severidad: ${detection.severity}`,
          severity: 'error',
          agentType: 'phytosanitary',
          data: {
            analysisId: result.id,
            disease: detection.disease,
            confidence: detection.confidence,
            severity: detection.severity
          },
          showBrowserNotification: true,
          persistent: true
        });
      }
    }
  }

  // Métodos públicos para gestión de cola
  async addToQueue(request: PhytosanitaryAnalysisRequest): Promise<void> {
    this.analysisQueue.push(request);
    await this.saveQueueToStorage();
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.analysisQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.analysisQueue.length > 0) {
      const request = this.analysisQueue.shift()!;
      try {
        await this.analyzeImage(request);
      } catch (error) {
        console.error('[DiseaseDetection] Error procesando cola:', error);
      }
    }
    
    this.isProcessing = false;
    await this.saveQueueToStorage();
  }

  private async loadQueueFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('phytosanitary_queue');
      if (stored) {
        this.analysisQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[DiseaseDetection] Error cargando cola:', error);
    }
  }

  private async saveQueueToStorage(): Promise<void> {
    try {
      localStorage.setItem('phytosanitary_queue', JSON.stringify(this.analysisQueue));
    } catch (error) {
      console.error('[DiseaseDetection] Error guardando cola:', error);
    }
  }

  // Métodos públicos para configuración
  updateConfig(newConfig: Partial<PhytosanitaryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): PhytosanitaryConfig {
    return { ...this.config };
  }

  // Estadísticas
  async getStats(): Promise<PhytosanitaryStats> {
    try {
      const analyses = await offlineDB.phytosanitaryAnalyses.toArray();
      const results = analyses.map(a => JSON.parse(a.result) as PhytosanitaryAnalysisResult);
      
      const diseaseCount: Record<CoffeeDiseaseType, number> = {} as any;
      let totalConfidence = 0;
      let diseasesDetected = 0;
      
      results.forEach(result => {
        result.detections.forEach(detection => {
          diseaseCount[detection.disease] = (diseaseCount[detection.disease] || 0) + 1;
          totalConfidence += detection.confidence;
          if (detection.disease !== 'HEALTHY') diseasesDetected++;
        });
      });
      
      const mostCommonDiseases = Object.entries(diseaseCount)
        .map(([disease, count]) => ({
          disease: disease as CoffeeDiseaseType,
          count,
          percentage: Math.round((count / results.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        totalAnalyses: results.length,
        diseasesDetected,
        averageConfidence: results.length > 0 ? Math.round(totalConfidence / results.length) : 0,
        mostCommonDiseases,
        severityDistribution: {} as any, // Implementar si es necesario
        healthTrend: 'STABLE', // Implementar cálculo de tendencia
        lastAnalysis: results.length > 0 ? new Date(Math.max(...results.map(r => r.analysisDate.getTime()))) : undefined,
        averageProcessingTime: results.length > 0 ? results.reduce((sum, r) => sum + r.processingTime, 0) / results.length : 0
      };
    } catch (error) {
      console.error('[DiseaseDetection] Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Gestión de cola offline
  async getQueueStatus() {
    return await offlineAnalysisQueue.getQueueStatus();
  }

  async getQueueStats() {
    return await offlineAnalysisQueue.getQueueStats();
  }

  async clearQueue() {
    return await offlineAnalysisQueue.clearQueue();
  }

  // Procesar cola cuando se recupere la conectividad
  async processOfflineQueue() {
    if (navigator.onLine) {
      await offlineAnalysisQueue.processQueue();
    }
  }

  // Inicializar listeners de conectividad
  initializeConnectivityListeners() {
    window.addEventListener('online', () => {
      console.log('Conectividad restaurada - procesando cola offline');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Conectividad perdida - modo offline activado');
    });
  }
}

// Instancia singleton
export const diseaseDetectionService = DiseaseDetectionService.getInstance();

// Inicializar listeners de conectividad al cargar el módulo
diseaseDetectionService.initializeConnectivityListeners();