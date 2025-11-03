import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  Leaf, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  MapPin,
  Thermometer,
  Droplets,
  Eye,
  Camera,
  FileText
} from 'lucide-react';

interface CoffeePestData {
  id: string;
  pestType: 'BROCA' | 'ROYA' | 'MINADOR' | 'COCHINILLA';
  lotId: string;
  lotName: string;
  incidenceLevel: number; // Porcentaje de incidencia
  severityLevel: number; // Nivel de severidad 1-5
  plantsInspected: number;
  plantsAffected: number;
  samplingDate: string;
  growthStage: string;
  weatherConditions: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
  symptoms: string[];
  photos: string[];
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
  recommendations: string[];
  treatmentHistory: Array<{
    date: string;
    product: string;
    dosage: string;
    efficacy: number;
  }>;
}

interface CoffeeSpecificPestsProps {
  farmId?: string;
  onNewMonitoring?: () => void;
  onViewDetails?: (pestData: CoffeePestData) => void;
}

const CoffeeSpecificPests: React.FC<CoffeeSpecificPestsProps> = ({
  farmId = '1',
  onNewMonitoring,
  onViewDetails
}) => {
  const [pestData, setPestData] = useState<CoffeePestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPest, setSelectedPest] = useState<'BROCA' | 'ROYA' | 'MINADOR' | 'COCHINILLA'>('BROCA');

  useEffect(() => {
    fetchCoffeePestData();
  }, [farmId]);

  const fetchCoffeePestData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pests/coffee-specific?farmId=${farmId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPestData(data);
      } else {
        // Datos de ejemplo si no hay conexión al backend
        setPestData(getMockPestData());
      }
    } catch (error) {
      console.error('Error fetching coffee pest data:', error);
      // Usar datos de ejemplo en caso de error
      setPestData(getMockPestData());
    } finally {
      setLoading(false);
    }
  };

  const getMockPestData = (): CoffeePestData[] => {
    return [
      {
        id: '1',
        pestType: 'BROCA',
        lotId: '1',
        lotName: 'Lote El Mirador',
        incidenceLevel: 8.5,
        severityLevel: 3,
        plantsInspected: 100,
        plantsAffected: 8,
        samplingDate: new Date().toISOString(),
        growthStage: 'FRUIT_DEVELOPMENT',
        weatherConditions: {
          temperature: 24,
          humidity: 75,
          rainfall: 120
        },
        symptoms: ['Perforaciones en frutos', 'Frutos prematuros'],
        photos: [],
        recommendations: ['Recolección oportuna', 'Uso de trampas'],
        treatmentHistory: []
      },
      {
        id: '2',
        pestType: 'ROYA',
        lotId: '2',
        lotName: 'Lote La Esperanza',
        incidenceLevel: 12.3,
        severityLevel: 4,
        plantsInspected: 150,
        plantsAffected: 18,
        samplingDate: new Date().toISOString(),
        growthStage: 'FLOWERING',
        weatherConditions: {
          temperature: 22,
          humidity: 85,
          rainfall: 180
        },
        symptoms: ['Manchas amarillas', 'Polvillo anaranjado'],
        photos: [],
        recommendations: ['Aplicar fungicida', 'Mejorar ventilación'],
        treatmentHistory: []
      }
    ];
  };

  const getPestIcon = (pestType: string) => {
    switch (pestType) {
      case 'BROCA': return <Bug className="h-5 w-5 text-red-600" />;
      case 'ROYA': return <Leaf className="h-5 w-5 text-orange-600" />;
      case 'MINADOR': return <Leaf className="h-5 w-5 text-yellow-600" />;
      case 'COCHINILLA': return <Bug className="h-5 w-5 text-purple-600" />;
      default: return <Bug className="h-5 w-5" />;
    }
  };

  const getPestColor = (pestType: string) => {
    switch (pestType) {
      case 'BROCA': return 'border-red-200 bg-red-50';
      case 'ROYA': return 'border-orange-200 bg-orange-50';
      case 'MINADOR': return 'border-yellow-200 bg-yellow-50';
      case 'COCHINILLA': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'bg-red-500';
    if (severity >= 3) return 'bg-orange-500';
    if (severity >= 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPestDescription = (pestType: string) => {
    const descriptions = {
      BROCA: {
        name: 'Broca del Café',
        scientificName: 'Hypothenemus hampei',
        description: 'Pequeño escarabajo que perfora los frutos del café, causando pérdidas significativas en calidad y cantidad.',
        criticalThreshold: '2-5%',
        symptoms: [
          'Perforaciones circulares en frutos',
          'Frutos prematuramente maduros',
          'Caída de frutos',
          'Presencia de adultos en trampas'
        ],
        prevention: [
          'Recolección oportuna',
          'Eliminación de frutos brocados',
          'Uso de trampas con alcohol',
          'Control biológico con Beauveria bassiana'
        ]
      },
      ROYA: {
        name: 'Roya del Café',
        scientificName: 'Hemileia vastatrix',
        description: 'Hongo que ataca las hojas del café, reduciendo la capacidad fotosintética y debilitando la planta.',
        criticalThreshold: '5-10%',
        symptoms: [
          'Manchas amarillas en hojas',
          'Polvillo anaranjado en el envés',
          'Defoliación prematura',
          'Debilitamiento general de la planta'
        ],
        prevention: [
          'Manejo adecuado de sombra',
          'Nutrición balanceada',
          'Poda sanitaria',
          'Aplicación preventiva de fungicidas'
        ]
      },
      MINADOR: {
        name: 'Minador de la Hoja',
        scientificName: 'Leucoptera coffeella',
        description: 'Larva que forma galerías en las hojas, afectando la fotosíntesis y el desarrollo de la planta.',
        criticalThreshold: '15-25%',
        symptoms: [
          'Galerías serpenteantes en hojas',
          'Manchas necróticas',
          'Defoliación en ataques severos',
          'Reducción del área foliar'
        ],
        prevention: [
          'Control de malezas hospederas',
          'Conservación de enemigos naturales',
          'Manejo de sombra',
          'Liberación de parasitoides'
        ]
      },
      COCHINILLA: {
        name: 'Cochinilla',
        scientificName: 'Planococcus citri',
        description: 'Insecto que se alimenta de la savia, debilitando la planta y favoreciendo el desarrollo de fumagina.',
        criticalThreshold: '8-15%',
        symptoms: [
          'Masas algodonosas blancas',
          'Amarillamiento de hojas',
          'Presencia de fumagina',
          'Debilitamiento de ramas'
        ],
        prevention: [
          'Control de hormigas',
          'Poda sanitaria',
          'Control biológico',
          'Aplicación de aceites minerales'
        ]
      }
    };

    return descriptions[pestType as keyof typeof descriptions];
  };

  const filteredData = pestData.filter(data => data.pestType === selectedPest);
  const pestInfo = getPestDescription(selectedPest);

  const calculateAverageIncidence = (pestType: string) => {
    const filtered = pestData.filter(data => data.pestType === pestType);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, data) => sum + data.incidenceLevel, 0) / filtered.length;
  };

  const getRecentTrend = (pestType: string) => {
    const filtered = pestData
      .filter(data => data.pestType === pestType)
      .sort((a, b) => new Date(b.samplingDate).getTime() - new Date(a.samplingDate).getTime())
      .slice(0, 3);
    
    if (filtered.length < 2) return 'stable';
    
    const recent = filtered[0].incidenceLevel;
    const previous = filtered[1].incidenceLevel;
    
    if (recent > previous * 1.1) return 'increasing';
    if (recent < previous * 0.9) return 'decreasing';
    return 'stable';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Bug className="h-6 w-6 animate-pulse mr-2" />
            <span>Cargando datos de plagas específicas del café...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['BROCA', 'ROYA', 'MINADOR', 'COCHINILLA'].map((pest) => {
          const avgIncidence = calculateAverageIncidence(pest);
          const trend = getRecentTrend(pest);
          
          return (
            <Card key={pest} className={`cursor-pointer transition-all ${
              selectedPest === pest ? 'ring-2 ring-blue-500' : ''
            } ${getPestColor(pest)}`}
            onClick={() => setSelectedPest(pest as any)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  {getPestIcon(pest)}
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`h-4 w-4 ${
                      trend === 'increasing' ? 'text-red-500' : 
                      trend === 'decreasing' ? 'text-green-500' : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                <h3 className="font-medium text-sm">{pest}</h3>
                <p className="text-2xl font-bold">{avgIncidence.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Incidencia promedio</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información Detallada de la Plaga Seleccionada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPestIcon(selectedPest)}
            {pestInfo?.name}
            <Badge variant="outline" className="ml-auto">
              {pestInfo?.scientificName}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
              <TabsTrigger value="symptoms">Síntomas</TabsTrigger>
              <TabsTrigger value="prevention">Prevención</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-sm text-gray-600">{pestInfo?.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Umbral Crítico</h4>
                  <p className="text-lg font-bold text-red-600">{pestInfo?.criticalThreshold}</p>
                  <p className="text-xs text-gray-600">de incidencia para acción inmediata</p>
                </div>
              </div>
              
              {filteredData.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Últimos Registros</h4>
                  <div className="space-y-2">
                    {filteredData.slice(0, 3).map((data) => (
                      <div key={data.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{data.lotName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(data.samplingDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{data.incidenceLevel.toFixed(1)}%</p>
                          <Badge className={getSeverityColor(data.severityLevel)}>
                            Nivel {data.severityLevel}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="monitoring" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Registros de Monitoreo</h4>
                <Button onClick={onNewMonitoring}>
                  <Camera className="h-4 w-4 mr-2" />
                  Nuevo Monitoreo
                </Button>
              </div>
              
              {filteredData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bug className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay registros de monitoreo para {pestInfo?.name}</p>
                  <Button className="mt-4" onClick={onNewMonitoring}>
                    Realizar Primer Monitoreo
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredData.map((data) => (
                    <Card key={data.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => onViewDetails?.(data)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{data.lotName}</span>
                              <Badge variant="outline">
                                {data.growthStage}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Incidencia</p>
                                <p className="font-bold">{data.incidenceLevel.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Plantas Inspeccionadas</p>
                                <p className="font-bold">{data.plantsInspected}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Plantas Afectadas</p>
                                <p className="font-bold">{data.plantsAffected}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Fecha</p>
                                <p className="font-bold">
                                  {new Date(data.samplingDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {data.gpsCoordinates && (
                              <div className="mt-2 text-xs text-gray-500">
                                GPS: {data.gpsCoordinates.lat.toFixed(6)}, {data.gpsCoordinates.lng.toFixed(6)}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <Badge className={getSeverityColor(data.severityLevel)}>
                              Severidad {data.severityLevel}
                            </Badge>
                            {data.photos.length > 0 && (
                              <div className="mt-2">
                                <Camera className="h-4 w-4 text-gray-500" />
                                <span className="text-xs text-gray-500 ml-1">
                                  {data.photos.length} fotos
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="symptoms" className="space-y-4">
              <h4 className="font-medium">Síntomas Característicos</h4>
              <div className="grid gap-3">
                {pestInfo?.symptoms.map((symptom, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>{symptom}</span>
                  </div>
                ))}
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> La identificación temprana de estos síntomas es crucial para un control efectivo. 
                  Realice inspecciones regulares y documente con fotografías para un mejor seguimiento.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="prevention" className="space-y-4">
              <h4 className="font-medium">Medidas Preventivas</h4>
              <div className="grid gap-3">
                {pestInfo?.prevention.map((measure, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span>{measure}</span>
                  </div>
                ))}
              </div>
              
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Manejo Integrado:</strong> Combine estas medidas preventivas con monitoreo regular 
                  y control biológico para un manejo sostenible y efectivo de plagas.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoffeeSpecificPests;