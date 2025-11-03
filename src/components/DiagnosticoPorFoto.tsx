// Componente Principal - Diagnóstico Fitosanitario por Foto
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Upload, RotateCcw, CheckCircle, AlertTriangle, Info, Loader2, MapPin, Clock, Zap, Settings, History, Download, Share2, Trash2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import PhotoCapture from './PhotoCapture';
import { diseaseDetectionService } from '../services/diseaseDetectionService';
import { useAINotifications } from '../hooks/useAINotifications';
import { offlineDB } from '../utils/offlineDB';
import { 
  PhytosanitaryAnalysisRequest, 
  PhytosanitaryAnalysisResult, 
  DiagnosisUIState,
  CoffeeDiseaseType,
  SeverityLevel,
  PlantPartType
} from '../types/phytosanitary';

interface DiagnosticoPorFotoProps {
  lotId?: string;
  farmId?: string;
  onAnalysisComplete?: (result: PhytosanitaryAnalysisResult) => void;
  onBack?: () => void;
}

export const DiagnosticoPorFoto: React.FC<DiagnosticoPorFotoProps> = ({
  lotId,
  farmId,
  onAnalysisComplete,
  onBack
}) => {
  // Estados principales
  const [uiState, setUIState] = useState<DiagnosisUIState>({
    currentStep: 'CAPTURE',
    isAnalyzing: false,
    analysisProgress: 0,
    showResults: false,
    error: null,
    selectedPlantPart: 'LEAF'
  });

  const [capturedImage, setCapturedImage] = useState<{
    url: string;
    blob: Blob;
    metadata: any;
  } | null>(null);

  const [analysisResult, setAnalysisResult] = useState<PhytosanitaryAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<PhytosanitaryAnalysisResult[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Hooks
  const { sendNotification } = useAINotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efectos
  useEffect(() => {
    loadAnalysisHistory();
    updateQueueStatus();
    
    // Listeners de conectividad
    const handleOnline = () => {
      setIsOnline(true);
      setIsOffline(false);
      updateQueueStatus();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsOffline(true);
      updateQueueStatus();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Actualizar estado de cola cada 30 segundos
    const queueInterval = setInterval(updateQueueStatus, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(queueInterval);
    };
  }, []);

  // Cargar historial de análisis
  const loadAnalysisHistory = useCallback(async () => {
    try {
      // Check if offlineDB and aiAnalysis table exist
      if (!offlineDB || !offlineDB.aiAnalysis) {
        console.warn('[DiagnosticoPorFoto] OfflineDB or aiAnalysis table not available');
        setAnalysisHistory([]);
        return;
      }

      // Get phytosanitary analyses from the aiAnalysis table
      const analyses = await offlineDB.aiAnalysis
        .where('agentType')
        .equals('phytosanitary')
        .reverse()
        .limit(10)
        .toArray();
      
      // Filter by farmId if provided and convert results
      const filteredAnalyses = analyses.filter(a => 
        !farmId || (a.inputData && a.inputData.farmId === farmId)
      );
      
      const results = filteredAnalyses
        .filter(a => a.result)
        .map(a => a.result as PhytosanitaryAnalysisResult);
      
      setAnalysisHistory(results);
    } catch (error) {
      console.error('[DiagnosticoPorFoto] Error cargando historial:', error);
      // Set empty array on error to prevent further issues
      setAnalysisHistory([]);
    }
  }, [farmId]);

  // Actualizar estado de la cola offline
  const updateQueueStatus = async () => {
    try {
      const status = await diseaseDetectionService.getQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('Error obteniendo estado de cola:', error);
    }
  };

  // Manejar captura de foto desde PhotoCapture
  const handlePhotoCapture = useCallback((photoData: {
    url: string;
    blob: Blob;
    metadata: any;
  }) => {
    setCapturedImage(photoData);
    setUIState(prev => ({ ...prev, currentStep: 'CONFIGURE' }));
  }, []);

  // Manejar selección de archivo
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUIState(prev => ({ 
        ...prev, 
        error: 'Formato de archivo no soportado. Use JPG, PNG o WebP.' 
      }));
      return;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      setUIState(prev => ({ 
        ...prev, 
        error: 'El archivo es demasiado grande. Máximo 10MB.' 
      }));
      return;
    }

    const url = URL.createObjectURL(file);
    setCapturedImage({
      url,
      blob: file,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      }
    });
    
    setUIState(prev => ({ ...prev, currentStep: 'CONFIGURE', error: null }));
  }, []);

  // Iniciar análisis
  const startAnalysis = useCallback(async () => {
    if (!capturedImage) return;

    setUIState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      analysisProgress: 0,
      currentStep: 'ANALYZING',
      error: null 
    }));

    try {
      // Simular progreso de análisis
      const progressInterval = setInterval(() => {
        setUIState(prev => ({
          ...prev,
          analysisProgress: Math.min(prev.analysisProgress + Math.random() * 15 + 5, 95)
        }));
      }, 300);

      // Crear request de análisis
      const analysisRequest: PhytosanitaryAnalysisRequest = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: capturedImage.url,
        imageBlob: capturedImage.blob,
        metadata: {
          lotId: lotId || '',
          farmId: farmId || '',
          captureDate: new Date(),
          gpsCoordinates: capturedImage.metadata.gpsCoordinates,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          },
          imageMetadata: {
            fileName: capturedImage.metadata.fileName || 'captured_image.jpg',
            fileSize: capturedImage.blob.size,
            mimeType: capturedImage.blob.type
          }
        },
        analysisOptions: {
          plantPartFocus: uiState.selectedPlantPart,
          enableSeverityAnalysis: true,
          enableTreatmentRecommendations: true,
          confidenceThreshold: 70
        }
      };

      // Ejecutar análisis
      const result = await diseaseDetectionService.analyzeImage(analysisRequest);
      
      clearInterval(progressInterval);
      setUIState(prev => ({ ...prev, analysisProgress: 100 }));
      
      // Pequeña pausa para mostrar 100%
      setTimeout(() => {
        setAnalysisResult(result);
        setUIState(prev => ({ 
          ...prev, 
          isAnalyzing: false, 
          showResults: true,
          currentStep: 'RESULTS'
        }));
        
        // Notificar resultado
        onAnalysisComplete?.(result);
        
        // Recargar historial
        loadAnalysisHistory();
        
        // Enviar notificación de éxito
        sendNotification({
          title: '✅ Análisis Completado',
          message: `Se detectaron ${result.detections.length} problema(s) en la imagen`,
          severity: 'success',
          agentType: 'phytosanitary',
          data: { analysisId: result.id }
        });
        
      }, 500);

    } catch (error) {
      console.error('[DiagnosticoPorFoto] Error en análisis:', error);
      setUIState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: error instanceof Error ? error.message : 'Error desconocido en el análisis',
        currentStep: 'CONFIGURE'
      }));
      
      sendNotification({
        title: '❌ Error en Análisis',
        message: 'No se pudo completar el análisis de la imagen',
        severity: 'error',
        agentType: 'phytosanitary'
      });
    }
  }, [capturedImage, uiState.selectedPlantPart, lotId, farmId, onAnalysisComplete, loadAnalysisHistory, sendNotification]);

  // Reiniciar proceso
  const resetAnalysis = useCallback(() => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setUIState({
      currentStep: 'CAPTURE',
      isAnalyzing: false,
      analysisProgress: 0,
      showResults: false,
      error: null,
      selectedPlantPart: 'LEAF'
    });
  }, []);

  // Obtener color de severidad
  const getSeverityColor = (severity: SeverityLevel): string => {
    const colors = {
      'VERY_LOW': 'bg-green-100 text-green-800',
      'LOW': 'bg-green-100 text-green-700',
      'MODERATE': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'VERY_HIGH': 'bg-red-100 text-red-800',
      'CRITICAL': 'bg-red-200 text-red-900'
    };
    return colors[severity] || colors['MODERATE'];
  };

  // Obtener icono de enfermedad
  const getDiseaseIcon = (disease: CoffeeDiseaseType) => {
    if (disease === 'HEALTHY') return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-orange-600" />;
  };

  // Renderizar paso actual
  const renderCurrentStep = () => {
    switch (uiState.currentStep) {
      case 'CAPTURE':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Diagnóstico Fitosanitario
              </h2>
              <p className="text-gray-600">
                Capture o seleccione una imagen de la planta para análisis
              </p>
            </div>

            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Cámara
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Subir Archivo
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera" className="mt-4">
                <PhotoCapture
                  onPhotoCapture={handlePhotoCapture}
                  enableAIAnalysis={true}
                  analysisType="phytosanitary"
                />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Seleccionar imagen
                      </p>
                      <p className="text-gray-600 mb-4">
                        JPG, PNG o WebP hasta 10MB
                      </p>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Examinar archivos
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {!isOnline && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sin conexión. Los análisis se procesarán cuando se restablezca la conectividad.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'CONFIGURE':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configurar Análisis
              </h2>
              <p className="text-gray-600">
                Ajuste los parámetros antes del análisis
              </p>
            </div>

            {capturedImage && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={capturedImage.url}
                        alt="Imagen capturada"
                        className="w-full h-64 object-cover rounded-lg border"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Parte de la planta a analizar
                        </label>
                        <select
                          value={uiState.selectedPlantPart}
                          onChange={(e) => setUIState(prev => ({ 
                            ...prev, 
                            selectedPlantPart: e.target.value as PlantPartType 
                          }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="LEAF">Hojas</option>
                          <option value="FRUIT">Frutos</option>
                          <option value="STEM">Tallos</option>
                          <option value="ROOT">Raíces</option>
                          <option value="FLOWER">Flores</option>
                          <option value="WHOLE_PLANT">Planta completa</option>
                        </select>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">
                          Consejos para mejor análisis:
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Asegúrese de que la imagen esté bien iluminada</li>
                          <li>• Enfoque la parte afectada de la planta</li>
                          <li>• Evite sombras excesivas o reflejos</li>
                          <li>• Incluya síntomas visibles claramente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetAnalysis}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Nueva Imagen
              </Button>
              <Button
                onClick={startAnalysis}
                disabled={!capturedImage}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Iniciar Análisis
              </Button>
            </div>
          </div>
        );

      case 'ANALYZING':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analizando Imagen...
              </h2>
              <p className="text-gray-600">
                Nuestro agente de IA está procesando la imagen
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progreso del análisis</span>
                    <span>{Math.round(uiState.analysisProgress)}%</span>
                  </div>
                  <Progress value={uiState.analysisProgress} className="h-2" />
                  
                  <div className="text-center text-sm text-gray-500">
                    {uiState.analysisProgress < 30 && "Procesando imagen..."}
                    {uiState.analysisProgress >= 30 && uiState.analysisProgress < 60 && "Detectando enfermedades..."}
                    {uiState.analysisProgress >= 60 && uiState.analysisProgress < 90 && "Analizando severidad..."}
                    {uiState.analysisProgress >= 90 && "Generando recomendaciones..."}
                  </div>
                </div>
              </CardContent>
            </Card>

            {capturedImage && (
              <Card>
                <CardContent className="pt-6">
                  <img
                    src={capturedImage.url}
                    alt="Imagen en análisis"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'RESULTS':
        return analysisResult && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Resultados del Análisis
              </h2>
              <p className="text-gray-600">
                Análisis completado el {analysisResult.analysisDate.toLocaleString()}
              </p>
            </div>

            {/* Resumen principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {analysisResult.primaryDiagnosis ? 
                    getDiseaseIcon(analysisResult.primaryDiagnosis.disease) :
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  }
                  Diagnóstico Principal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.primaryDiagnosis ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {analysisResult.primaryDiagnosis.disease === 'HEALTHY' ? 
                          'Planta Saludable' : 
                          analysisResult.primaryDiagnosis.disease.replace(/_/g, ' ')
                        }
                      </h3>
                      <Badge className={getSeverityColor(analysisResult.primaryDiagnosis.severity)}>
                        {analysisResult.primaryDiagnosis.severity}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600">
                      {analysisResult.primaryDiagnosis.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Confianza:</span>
                        <span className="ml-2">{analysisResult.primaryDiagnosis.confidence}%</span>
                      </div>
                      <div>
                        <span className="font-medium">Área afectada:</span>
                        <span className="ml-2">{analysisResult.primaryDiagnosis.affectedArea}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="text-lg font-medium text-green-800">
                      No se detectaron problemas
                    </p>
                    <p className="text-green-600">
                      La planta parece estar saludable
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Métricas de salud */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisResult.overallHealthScore}%
                    </div>
                    <p className="text-sm text-gray-600">Salud General</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResult.detections.length}
                    </div>
                    <p className="text-sm text-gray-600">Problemas Detectados</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(analysisResult.processingTime / 1000)}s
                    </div>
                    <p className="text-sm text-gray-600">Tiempo de Análisis</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recomendaciones */}
            {analysisResult.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones de Tratamiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.recommendations.map((rec, index) => (
                      <div key={rec.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{rec.treatment.name}</h4>
                          <Badge variant={rec.urgency === 'CRITICAL' ? 'destructive' : 'secondary'}>
                            {rec.urgency}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {rec.treatment.activeIngredient} - {rec.treatment.dosage}
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Método:</span>
                            <span className="ml-2">{rec.treatment.applicationMethod}</span>
                          </div>
                          <div>
                            <span className="font-medium">Frecuencia:</span>
                            <span className="ml-2">{rec.treatment.frequency}</span>
                          </div>
                          <div>
                            <span className="font-medium">Efectividad:</span>
                            <span className="ml-2">{rec.effectiveness}%</span>
                          </div>
                          <div>
                            <span className="font-medium">Costo estimado:</span>
                            <span className="ml-2">
                              ${rec.treatment.cost.estimated.toLocaleString()} {rec.treatment.cost.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetAnalysis}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Nuevo Análisis
              </Button>
              {onBack && (
                <Button
                  onClick={onBack}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Volver al MIP
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Agente Fitosanitario
            </h1>
            <p className="text-sm text-gray-600">
              Diagnóstico por imagen con IA
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Estado de conectividad y cola */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'En línea' : 'Sin conexión'}
              </span>
            </div>
            
            {/* Estado de cola offline */}
            {queueStatus && queueStatus.totalItems > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="w-4 h-4" />
                <span>{queueStatus.totalItems} análisis en cola</span>
              </div>
            )}
          </div>
          
          {!isOnline && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
          {lotId && (
            <Badge variant="outline">
              <MapPin className="w-3 h-3 mr-1" />
              Lote: {lotId}
            </Badge>
          )}
        </div>
      </div>

      {/* Error display */}
      {uiState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{uiState.error}</AlertDescription>
        </Alert>
      )}

      {/* Contenido principal */}
      {renderCurrentStep()}

      {/* Historial reciente */}
      {analysisHistory.length > 0 && uiState.currentStep === 'CAPTURE' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisHistory.slice(0, 3).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {analysis.primaryDiagnosis ? 
                      getDiseaseIcon(analysis.primaryDiagnosis.disease) :
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    }
                    <div>
                      <p className="font-medium text-sm">
                        {analysis.primaryDiagnosis?.disease === 'HEALTHY' ? 
                          'Planta Saludable' : 
                          analysis.primaryDiagnosis?.disease.replace(/_/g, ' ') || 'Sin diagnóstico'
                        }
                      </p>
                      <p className="text-xs text-gray-600">
                        {analysis.analysisDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {analysis.primaryDiagnosis?.confidence || 0}%
                    </p>
                    <p className="text-xs text-gray-600">confianza</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};