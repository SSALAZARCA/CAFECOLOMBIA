import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { offlineDB, ensureOfflineDBReady } from '@/utils/offlineDB';
import MicrolotDetailModal from '@/components/MicrolotDetailModal';
import CreateMicrolotModal from '@/components/CreateMicrolotModal';
import ProcessingFlowModal from '@/components/ProcessingFlowModal';
import {
  Search,
  Filter,
  Plus,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ArrowRight,
  QrCode,
  MapPin,
  Download,
  Loader2
} from 'lucide-react';

interface Microlot {
  id: string;
  code: string;
  quantityKg: number;
  qualityGrade?: string;
  status: 'HARVEST' | 'PROCESSING' | 'DRYING' | 'STORAGE' | 'EXPORT_READY' | 'EXPORTED';
  qrCode: string;
  createdAt: string;
  lot: {
    id: string;
    name: string;
    variety: string;
    farm: {
      id: string;
      name: string;
      location: string;
    };
  };
  harvest?: {
    id: string;
    harvestDate: string;
    qualityGrade: string;
  };
  qualityControls: Array<{
    id: string;
    testType: string;
    scaScore?: number;
    passed: boolean;
    testDate: string;
  }>;
  traceabilityEvents: Array<{
    id: string;
    eventType: string;
    eventDate: string;
    description: string;
  }>;
  certificationRecords: Array<{
    id: string;
    certificationType: string;
    status: string;
  }>;
}

interface TraceabilityStats {
  totalMicrolots: number;
  statusDistribution: Array<{
    status: string;
    _count: { status: number };
  }>;
  qualityMetrics: Array<{
    passed: boolean;
    _count: { passed: number };
    _avg: { scaScore: number };
  }>;
  certificationDistribution: Array<{
    certificationType: string;
    _count: { certificationType: number };
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    eventDate: string;
    description: string;
    microlot: {
      code: string;
      lot: {
        name: string;
        farm: {
          name: string;
        };
      };
    };
    responsible: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const statusColors = {
  HARVEST: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  DRYING: 'bg-yellow-100 text-yellow-800',
  STORAGE: 'bg-purple-100 text-purple-800',
  EXPORT_READY: 'bg-orange-100 text-orange-800',
  EXPORTED: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  HARVEST: 'Cosecha',
  PROCESSING: 'Beneficio',
  DRYING: 'Secado',
  STORAGE: 'Almacenamiento',
  EXPORT_READY: 'Listo Exportación',
  EXPORTED: 'Exportado'
};



export default function Traceability() {
  const [microlots, setMicrolots] = useState<Microlot[]>([]);
  const [stats, setStats] = useState<TraceabilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMicrolot, setSelectedMicrolot] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedMicrolotForProcessing, setSelectedMicrolotForProcessing] = useState<Microlot | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await ensureOfflineDBReady();
      } catch (err) {
        console.warn('[Traceability] DB no disponible, usando fallback:', err);
      } finally {
        try {
          await fetchMicrolots();
          await fetchStats();
        } catch (innerErr) {
          console.error('Error cargando microlotes o stats:', innerErr);
          toast.error('Error al cargar datos de trazabilidad');
        } finally {
          setLoading(false);
        }
      }
    })();
  }, []);

  const fetchMicrolots = async () => {
    try {
      // Obtener datos de la base de datos offline
      const [harvestsFromDB, lotsFromDB] = await Promise.all([
        offlineDB.harvests.toArray(),
        offlineDB.lots.toArray()
      ]);

      // Generar microlotes basados en las cosechas
      const microlotesGenerados: Microlot[] = harvestsFromDB.map((harvest, index) => {
        const lot = lotsFromDB.find(l => l.id?.toString() === harvest.lotId);
        const hDateStr = harvest.harvestDate || harvest.date;
        const harvestDate = hDateStr ? new Date(hDateStr) : new Date();
        const daysSinceHarvest = Math.floor((Date.now() - harvestDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: 'HARVEST' | 'PROCESSING' | 'DRYING' | 'STORAGE' | 'EXPORT_READY' | 'EXPORTED' = 'HARVEST';
        if (daysSinceHarvest > 30) status = 'EXPORTED';
        else if (daysSinceHarvest > 20) status = 'EXPORT_READY';
        else if (daysSinceHarvest > 15) status = 'STORAGE';
        else if (daysSinceHarvest > 7) status = 'DRYING';
        else if (daysSinceHarvest > 2) status = 'PROCESSING';

        return {
          id: harvest.id!.toString(),
          code: `ML-${harvest.id}-${(hDateStr || new Date().toISOString()).slice(0, 4)}`,
          quantityKg: harvest.quantity,
          qualityGrade: (harvest as any).qualityGrade || (harvest as any).quality || 'A',
          status,
          qrCode: `QR-${harvest.id}`,
          createdAt: hDateStr || new Date().toISOString(),
          lot: {
            id: lot?.id?.toString() || '1',
            name: lot?.name || 'Lote Principal',
            variety: lot?.variety || 'Caturra',
            farm: {
              id: '1',
              name: 'Finca El Paraíso',
              location: 'Huila, Colombia'
            }
          },
          harvest: {
            id: harvest.id!.toString(),
            harvestDate: hDateStr || new Date().toISOString(),
            qualityGrade: (harvest as any).qualityGrade || (harvest as any).quality || 'A'
          },
          qualityControls: [
            {
              id: `qc-${harvest.id}`,
              testType: 'SENSORIAL',
              scaScore: 85 + Math.random() * 10,
              passed: true,
              testDate: hDateStr || new Date().toISOString()
            }
          ],
          traceabilityEvents: [
            {
              id: `event-${harvest.id}`,
              eventType: 'COSECHA',
              eventDate: hDateStr || new Date().toISOString(),
              description: `Cosecha realizada - ${harvest.quantity}kg`
            }
          ],
          certificationRecords: [
            {
              id: `cert-${harvest.id}`,
              certificationType: 'ORGANICO',
              status: 'ACTIVA'
            }
          ]
        };
      });

      setMicrolots(microlotesGenerados);
    } catch (error) {
      console.error('Error:', error);
      if (import.meta.env.DEV) {
        // Fallback de desarrollo para visualizar UI
        const fallbackMicrolots: Microlot[] = [
          {
            id: '1',
            code: 'ML-001-2024',
            quantityKg: 500,
            qualityGrade: 'A',
            status: 'PROCESSING',
            qrCode: 'QR-001',
            createdAt: new Date().toISOString(),
            lot: { id: '1', name: 'Lote Principal', variety: 'Caturra', farm: { id: '1', name: 'Finca El Paraíso', location: 'Huila, Colombia' } },
            harvest: { id: '1', harvestDate: new Date().toISOString(), qualityGrade: 'A' },
            qualityControls: [],
            traceabilityEvents: [],
            certificationRecords: []
          }
        ];
        setMicrolots(fallbackMicrolots);
        toast.info('Modo offline: mostrando microlotes de ejemplo');
      } else {
        toast.error('Error al cargar microlotes');
      }
    }
  };

  const fetchStats = async () => {
    try {
      const harvestsFromDB = await offlineDB.harvests.toArray();
      
      // Calcular estadísticas basadas en las cosechas
      const totalMicrolots = harvestsFromDB.length;
      
      // Distribución por estado (simulada)
      const statusDistribution = [
        { status: 'HARVEST', _count: { status: Math.floor(totalMicrolots * 0.2) } },
        { status: 'PROCESSING', _count: { status: Math.floor(totalMicrolots * 0.15) } },
        { status: 'DRYING', _count: { status: Math.floor(totalMicrolots * 0.15) } },
        { status: 'STORAGE', _count: { status: Math.floor(totalMicrolots * 0.2) } },
        { status: 'EXPORT_READY', _count: { status: Math.floor(totalMicrolots * 0.15) } },
        { status: 'EXPORTED', _count: { status: Math.floor(totalMicrolots * 0.15) } }
      ];

      const stats: TraceabilityStats = {
        totalMicrolots,
        statusDistribution,
        qualityMetrics: [
          { passed: true, _count: { passed: Math.floor(totalMicrolots * 0.9) }, _avg: { scaScore: 87.5 } },
          { passed: false, _count: { passed: Math.floor(totalMicrolots * 0.1) }, _avg: { scaScore: 75.2 } }
        ],
        certificationDistribution: [
          { certificationType: 'ORGANICO', _count: { certificationType: Math.floor(totalMicrolots * 0.6) } },
          { certificationType: 'RAINFOREST', _count: { certificationType: Math.floor(totalMicrolots * 0.4) } }
        ],
        recentEvents: harvestsFromDB.slice(0, 5).map(harvest => {
          const hDateStr = (harvest as any).harvestDate || (harvest as any).date || new Date().toISOString();
          return ({
            id: harvest.id!.toString(),
            eventType: 'COSECHA',
            eventDate: hDateStr,
            description: `Cosecha realizada - ${harvest.quantity}kg`,
            microlot: {
              code: `ML-${harvest.id}`,
              lot: {
                name: 'Lote Principal',
                farm: {
                  name: 'Finca El Paraíso'
                }
              }
            },
            responsible: {
              firstName: 'Juan',
              lastName: 'Pérez'
            }
          });
        })
      };

      setStats(stats);
    } catch (error) {
      console.error('Error:', error);
      if (import.meta.env.DEV) {
        const fallbackStats: TraceabilityStats = {
          totalMicrolots: 1,
          statusDistribution: [
            { status: 'PROCESSING', _count: { status: 1 } }
          ],
          qualityMetrics: [
            { passed: true, _count: { passed: 1 }, _avg: { scaScore: 86.5 } }
          ],
          certificationDistribution: [
            { certificationType: 'ORGANICO', _count: { certificationType: 1 } }
          ],
          recentEvents: []
        };
        setStats(fallbackStats);
      }
    }
  };

  const handleProcessingFlow = (microlot: Microlot) => {
    setSelectedMicrolotForProcessing(microlot);
    setShowProcessingModal(true);
  };

  const handleCreateSuccess = async () => {
    await fetchMicrolots();
    await fetchStats();
    toast.success('Microlote creado exitosamente');
  };

  const handleProcessingSuccess = async () => {
    await fetchMicrolots();
    await fetchStats();
    toast.success('Procesamiento actualizado exitosamente');
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'HARVEST': return 'default';
      case 'PROCESSING': return 'secondary';
      case 'DRYING': return 'outline';
      case 'STORAGE': return 'secondary';
      case 'EXPORT_READY': return 'default';
      case 'EXPORTED': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const filteredMicrolots = microlots.filter(microlot => {
    const matchesSearch = microlot.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         microlot.lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         microlot.lot.farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         microlot.lot.variety.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || microlot.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HARVEST':
        return <Package className="h-4 w-4" />;
      case 'PROCESSING':
        return <Clock className="h-4 w-4" />;
      case 'DRYING':
        return <Clock className="h-4 w-4" />;
      case 'STORAGE':
        return <Package className="h-4 w-4" />;
      case 'EXPORT_READY':
        return <CheckCircle className="h-4 w-4" />;
      case 'EXPORTED':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };



  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Trazabilidad</h1>
            <p className="text-gray-600">Seguimiento completo del café desde el cultivo hasta la exportación</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Crear Microlote
          </Button>
        </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Microlotes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMicrolots}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Calidad Aprobada</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.qualityMetrics.find(q => q.passed)?._count.passed || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Puntaje SCA Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.qualityMetrics.find(q => q.passed)?._avg.scaScore?.toFixed(1) || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Certificaciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.certificationDistribution.reduce((acc, cert) => acc + cert._count.certificationType, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por código, finca o variedad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="HARVEST">Cosecha</SelectItem>
                  <SelectItem value="PROCESSING">Beneficio</SelectItem>
                  <SelectItem value="DRYING">Secado</SelectItem>
                  <SelectItem value="STORAGE">Almacenamiento</SelectItem>
                  <SelectItem value="EXPORT_READY">Listo para Exportación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Microlots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMicrolots.map((microlot) => (
            <Card key={microlot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{microlot.code}</CardTitle>
                    <p className="text-sm text-gray-600">{microlot.lot.farm.name}</p>
                  </div>
                  <Badge variant={getStatusVariant(microlot.status)}>
                    {getStatusLabel(microlot.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Lote:</span>
                    <p className="font-medium">{microlot.lot.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Variedad:</span>
                    <p className="font-medium">{microlot.lot.variety}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cantidad:</span>
                    <p className="font-medium">{microlot.quantityKg} kg</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Calidad:</span>
                    <p className="font-medium">{microlot.qualityGrade || 'N/A'}</p>
                  </div>
                </div>

                {microlot.harvest && (
                  <div className="text-sm">
                    <span className="text-gray-600">Cosecha:</span>
                    <p className="font-medium">
                      {new Date(microlot.harvest.harvestDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMicrolot(buildDetailedMicrolot(microlot));
                      setShowDetailModal(true);
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProcessingFlow(microlot)}
                    className="flex-1"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Flujo de Proceso
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modales */}
        {showDetailModal && selectedMicrolot && (
          <MicrolotDetailModal
            microlot={selectedMicrolot}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
          />
        )}

        {showCreateModal && (
          <CreateMicrolotModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {showProcessingModal && selectedMicrolotForProcessing && (
          <ProcessingFlowModal
            microlot={selectedMicrolotForProcessing}
            isOpen={showProcessingModal}
            onClose={() => setShowProcessingModal(false)}
            onSuccess={handleProcessingSuccess}
          />
        )}
      </div>
    </Layout>
  );
}

const buildDetailedMicrolot = (m: Microlot) => {
  return {
    id: m.id,
    code: m.code,
    quantityKg: m.quantityKg,
    qualityGrade: m.qualityGrade || 'A',
    status: m.status === 'HARVEST' ? 'COSECHADO'
      : m.status === 'PROCESSING' ? 'EN_BENEFICIO'
      : m.status === 'DRYING' ? 'SECANDO'
      : m.status === 'STORAGE' ? 'ALMACENADO'
      : m.status === 'EXPORT_READY' ? 'LISTO_EXPORTACION'
      : 'EXPORTADO',
    processDate: m.createdAt,
    lot: {
      name: m.lot.name,
      variety: m.lot.variety,
      area: 1,
      farm: {
        name: m.lot.farm.name,
        location: m.lot.farm.location,
        altitude: 1650,
        owner: {
          firstName: 'Juan',
          lastName: 'Pérez'
        }
      }
    },
    harvest: {
      harvestDate: m.harvest?.harvestDate || m.createdAt,
      qualityGrade: m.harvest?.qualityGrade || m.qualityGrade || 'A',
      harvestedByUser: { firstName: 'Juan', lastName: 'Pérez' }
    },
    processing: [
      {
        id: `proc-${m.id}`,
        processType: 'WASHED',
        startDate: m.createdAt,
        endDate: m.createdAt,
        qualityScore: 86,
        processedByUser: { firstName: 'Ana', lastName: 'García' }
      }
    ],
    qualityControls: m.qualityControls.map(qc => ({
      ...qc,
      tester: { firstName: 'Catador', lastName: 'Principal' }
    })),
    traceabilityEvents: m.traceabilityEvents.map(ev => ({
      ...ev,
      location: m.lot.farm.location,
      responsible: { firstName: 'Juan', lastName: 'Pérez' }
    })),
    certificationRecords: m.certificationRecords.map(cert => ({
      ...cert,
      certificationBody: 'ICONTEC',
      certificateNumber: `CERT-${m.id}`,
      issueDate: m.createdAt,
      expiryDate: m.createdAt
    }))
  };
};