import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  Thermometer,
  Droplets,
  Cloud
} from 'lucide-react';
import {
  calculatePestThreshold,
  getPestSpecificRecommendations,
  generateAutomaticAlert,
  calculateClimateRiskIndex,
  type ThresholdCalculation,
  type PestMonitoringData,
  type CoffeeVarietyData
} from '@/utils/pestThresholds';

interface ThresholdCalculatorProps {
  monitoringData?: PestMonitoringData;
  varietyData?: CoffeeVarietyData;
  onRecommendationApply?: (recommendation: string) => void;
}

const ThresholdCalculator: React.FC<ThresholdCalculatorProps> = ({
  monitoringData,
  varietyData,
  onRecommendationApply
}) => {
  const [calculation, setCalculation] = useState<ThresholdCalculation | null>(null);
  const [climateRisk, setClimateRisk] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo si no se proporcionan props
  const defaultMonitoringData: PestMonitoringData = {
    pestType: 'BROCA',
    plantsInspected: 100,
    plantsAffected: 8,
    severity: 3,
    affectedArea: 2.5,
    growthStage: 'FRUIT_DEVELOPMENT',
    weatherConditions: {
      temperature: 24,
      humidity: 75,
      rainfall: 120
    },
    previousTreatments: []
  };

  const defaultVarietyData: CoffeeVarietyData = {
    variety: 'Caturra',
    susceptibility: 3,
    economicValue: 8500,
    yieldPotential: 1800
  };

  useEffect(() => {
    calculateThresholds();
  }, [monitoringData, varietyData]);

  const calculateThresholds = async () => {
    const dataToUse = monitoringData || defaultMonitoringData;
    const varietyToUse = varietyData || defaultVarietyData;
    
    setLoading(true);
    try {
      const result = calculatePestThreshold(dataToUse, varietyToUse);
      setCalculation(result);
      
      const riskIndex = calculateClimateRiskIndex(
        dataToUse.pestType,
        dataToUse.weatherConditions
      );
      setClimateRisk(riskIndex);
    } catch (error) {
      console.error('Error calculating thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'IMMEDIATE': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'SCHEDULE': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'MONITOR': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'NONE': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Calculator className="h-6 w-6 animate-spin mr-2" />
            <span>Calculando umbrales económicos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calculation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No se pudieron calcular los umbrales económicos
          </div>
        </CardContent>
      </Card>
    );
  }

  const alert = generateAutomaticAlert(calculation, monitoringData || defaultMonitoringData);
  const recommendations = getPestSpecificRecommendations(
    calculation.pestType,
    calculation.riskLevel
  );

  return (
    <div className="space-y-6">
      {/* Alerta Principal */}
      <Alert className={`border-l-4 ${getRiskColor(alert.severity).replace('bg-', 'border-l-')}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="font-medium">
          {alert.message}
        </AlertDescription>
      </Alert>

      {/* Resumen de Cálculos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nivel Actual</p>
                <p className="text-2xl font-bold">
                  {(calculation.currentLevel * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Umbral Económico</p>
                <p className="text-2xl font-bold">
                  {(calculation.economicThreshold * 100).toFixed(1)}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Daño Predicho</p>
                <p className="text-lg font-bold">
                  {formatCurrency(calculation.predictedDamage)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Costo/Beneficio</p>
                <p className="text-2xl font-bold">
                  {calculation.costBenefitRatio.toFixed(1)}:1
                </p>
              </div>
              <Calculator className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado del Riesgo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Estado del Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Nivel de Riesgo:</span>
              <Badge className={getRiskColor(calculation.riskLevel)}>
                {calculation.riskLevel}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Urgencia de Tratamiento:</span>
              <div className="flex items-center gap-2">
                {getUrgencyIcon(calculation.treatmentUrgency)}
                <span className="font-medium">{calculation.treatmentUrgency}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso hacia umbral crítico</span>
                <span>{((calculation.currentLevel / (calculation.actionThreshold * 2)) * 100).toFixed(0)}%</span>
              </div>
              <Progress 
                value={(calculation.currentLevel / (calculation.actionThreshold * 2)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Condiciones Climáticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Análisis Climático
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Thermometer className="h-6 w-6 mx-auto mb-1 text-red-500" />
                <p className="text-sm text-gray-600">Temperatura</p>
                <p className="font-bold">{(monitoringData || defaultMonitoringData).weatherConditions.temperature}°C</p>
              </div>
              <div>
                <Droplets className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <p className="text-sm text-gray-600">Humedad</p>
                <p className="font-bold">{(monitoringData || defaultMonitoringData).weatherConditions.humidity}%</p>
              </div>
              <div>
                <Cloud className="h-6 w-6 mx-auto mb-1 text-gray-500" />
                <p className="text-sm text-gray-600">Lluvia</p>
                <p className="font-bold">{(monitoringData || defaultMonitoringData).weatherConditions.rainfall}mm</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Riesgo Climático</span>
                <span>{(climateRisk * 100).toFixed(0)}%</span>
              </div>
              <Progress value={climateRisk * 100} className="h-2" />
              <p className="text-xs text-gray-600">
                Condiciones {climateRisk > 0.7 ? 'muy favorables' : climateRisk > 0.4 ? 'favorables' : 'desfavorables'} para el desarrollo de la plaga
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones de Acción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Acción Recomendada:</h4>
              <p className="text-blue-800">{calculation.recommendedAction}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Medidas Específicas:</h4>
              <div className="grid gap-2">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">{recommendation}</span>
                    {onRecommendationApply && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRecommendationApply(recommendation)}
                      >
                        Aplicar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis Económico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Análisis Económico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Daño Económico Predicho</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(calculation.predictedDamage)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Costo de Tratamiento Est.</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(calculation.predictedDamage / calculation.costBenefitRatio)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Beneficio Neto Est.</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(calculation.predictedDamage - (calculation.predictedDamage / calculation.costBenefitRatio))}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Recomendación Económica:</strong> {' '}
              {calculation.costBenefitRatio > 2 
                ? 'El tratamiento es altamente rentable. Se recomienda aplicación inmediata.'
                : calculation.costBenefitRatio > 1
                ? 'El tratamiento es rentable. Se recomienda considerar la aplicación.'
                : 'El costo del tratamiento puede superar el beneficio. Evaluar alternativas de control.'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Recálculo */}
      <div className="flex justify-center">
        <Button onClick={calculateThresholds} disabled={loading}>
          <Calculator className="h-4 w-4 mr-2" />
          Recalcular Umbrales
        </Button>
      </div>
    </div>
  );
};

export default ThresholdCalculator;