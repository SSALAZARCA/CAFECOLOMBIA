// Componente para mostrar resultados de diagnóstico fitosanitario
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Eye, 
  Calendar,
  MapPin,
  Thermometer,
  Droplets,
  Sun,
  Bug,
  Leaf,
  TrendingUp,
  Download,
  Share2,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { 
  PhytosanitaryAnalysisResult, 
  DiseaseDetection, 
  TreatmentRecommendation,
  SeverityLevel,
  ConfidenceLevel
} from '../types/phytosanitary';

interface DiagnosisResultsProps {
  result: PhytosanitaryAnalysisResult;
  onClose?: () => void;
  onSaveReport?: (result: PhytosanitaryAnalysisResult) => void;
  onShareResult?: (result: PhytosanitaryAnalysisResult) => void;
  onViewDetails?: (detection: DiseaseDetection) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({
  result,
  onClose,
  onSaveReport,
  onShareResult,
  onViewDetails,
  showActions = true,
  compact = false
}) => {
  const [selectedDetection, setSelectedDetection] = useState<DiseaseDetection | null>(null);
  const [showAllTreatments, setShowAllTreatments] = useState(false);

  // Obtener color según severidad
  const getSeverityColor = (severity: SeverityLevel): string => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'VERY_HIGH': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      case 'VERY_LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  // Obtener icono según severidad
  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
      case 'VERY_HIGH':
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM':
        return <Info className="h-4 w-4" />;
      case 'LOW':
      case 'VERY_LOW':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Obtener color de confianza
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Formatear fecha
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Obtener detecciones críticas
  const criticalDetections = result.detections.filter(d => 
    d.severity === 'CRITICAL' || d.severity === 'VERY_HIGH'
  );

  // Obtener tratamientos prioritarios
  const priorityTreatments = result.treatments
    .filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL')
    .slice(0, showAllTreatments ? undefined : 3);

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                result.detections.length > 0 ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <span className="font-medium">
                {result.detections.length > 0 
                  ? `${result.detections.length} problema(s) detectado(s)`
                  : 'Planta saludable'
                }
              </span>
            </div>
            <Badge variant="outline" className={getConfidenceColor(result.confidence.overall)}>
              {result.confidence.overall}% confianza
            </Badge>
          </div>
          
          {result.detections.length > 0 && (
            <div className="space-y-2">
              {result.detections.slice(0, 2).map((detection, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{detection.diseaseType}</span>
                  <Badge variant={getSeverityColor(detection.severity)} size="sm">
                    {detection.severity}
                  </Badge>
                </div>
              ))}
              {result.detections.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{result.detections.length - 2} más...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header con resumen general */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Resultado del Diagnóstico Fitosanitario
            </CardTitle>
            {showActions && onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Estado general */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                result.detections.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {result.detections.length > 0 ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <CheckCircle className="h-6 w-6" />
                )}
              </div>
              <div className="font-semibold">
                {result.detections.length > 0 
                  ? `${result.detections.length} Problema(s)`
                  : 'Planta Saludable'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Estado detectado
              </div>
            </div>

            {/* Confianza general */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className={`font-semibold text-2xl ${getConfidenceColor(result.confidence.overall)}`}>
                {result.confidence.overall}%
              </div>
              <div className="text-sm text-muted-foreground">
                Confianza general
              </div>
            </div>

            {/* Fecha de análisis */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="font-semibold text-sm">
                {formatDate(result.analysisDate)}
              </div>
              <div className="text-sm text-muted-foreground">
                Fecha de análisis
              </div>
            </div>
          </div>

          {/* Información de contexto */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {result.metadata.lotId && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Lote: {result.metadata.lotId}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-muted-foreground" />
              <span>Parte: {result.analysisOptions.plantPartFocus}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <span>Calidad: {result.imageQuality.lighting}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span>Enfoque: {result.imageQuality.focus}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detecciones críticas */}
      {criticalDetections.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Detecciones Críticas ({criticalDetections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalDetections.map((detection, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-red-800">{detection.diseaseType}</h4>
                    <Badge variant="destructive">
                      {detection.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700 mb-2">{detection.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Confianza: {detection.confidence}%
                    </span>
                    {onViewDetails && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewDetails(detection)}
                      >
                        Ver detalles
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todas las detecciones */}
      {result.detections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Detecciones Completas ({result.detections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {result.detections.map((detection, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(detection.severity)}
                        <h4 className="font-semibold">{detection.diseaseType}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(detection.severity)}>
                          {detection.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {detection.confidence}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {detection.description}
                    </p>
                    
                    {detection.affectedArea && (
                      <div className="text-xs text-muted-foreground">
                        Área afectada: {detection.affectedArea.percentage}% 
                        ({detection.affectedArea.coordinates.length} regiones)
                      </div>
                    )}
                    
                    <Progress 
                      value={detection.confidence} 
                      className="mt-2 h-2"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones de tratamiento */}
      {result.treatments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Recomendaciones de Tratamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityTreatments.map((treatment, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{treatment.name}</h4>
                    <Badge variant={treatment.priority === 'CRITICAL' ? 'destructive' : 'default'}>
                      {treatment.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {treatment.description}
                  </p>
                  
                  {treatment.steps.length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium mb-2">Pasos a seguir:</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {treatment.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duración estimada:</span>
                      <div>{treatment.estimatedDuration}</div>
                    </div>
                    <div>
                      <span className="font-medium">Efectividad esperada:</span>
                      <div>{treatment.expectedEffectiveness}%</div>
                    </div>
                  </div>
                  
                  {treatment.products.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-medium mb-2">Productos recomendados:</h5>
                      <div className="flex flex-wrap gap-2">
                        {treatment.products.map((product, productIndex) => (
                          <Badge key={productIndex} variant="outline">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {result.treatments.length > 3 && !showAllTreatments && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllTreatments(true)}
                  className="w-full"
                >
                  Ver todos los tratamientos ({result.treatments.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calidad de imagen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Calidad de Imagen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{result.imageQuality.overall}%</div>
              <div className="text-sm text-muted-foreground">General</div>
              <Progress value={result.imageQuality.overall} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{result.imageQuality.sharpness}%</div>
              <div className="text-sm text-muted-foreground">Nitidez</div>
              <Progress value={result.imageQuality.sharpness} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{result.imageQuality.brightness}%</div>
              <div className="text-sm text-muted-foreground">Brillo</div>
              <Progress value={result.imageQuality.brightness} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{result.imageQuality.contrast}%</div>
              <div className="text-sm text-muted-foreground">Contraste</div>
              <Progress value={result.imageQuality.contrast} className="mt-2" />
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">{result.imageQuality.resolution.megapixels} MP</div>
              <div className="text-muted-foreground">Resolución</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{result.imageQuality.lighting}</div>
              <div className="text-muted-foreground">Iluminación</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{result.imageQuality.focus}</div>
              <div className="text-muted-foreground">Enfoque</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      {showActions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {onSaveReport && (
                <Button onClick={() => onSaveReport(result)} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Guardar Reporte
                </Button>
              )}
              {onShareResult && (
                <Button variant="outline" onClick={() => onShareResult(result)} className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
              )}
              <Button variant="outline" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Guía de Tratamientos
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Consultar Experto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};