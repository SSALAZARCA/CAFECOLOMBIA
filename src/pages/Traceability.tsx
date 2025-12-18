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
  status: 'HARVEST' | 'PROCESSING' | 'DRYING' | 'STORAGE' | 'MILLING' | 'EXPORT_READY' | 'EXPORTED';
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
    data?: any;
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
  MILLING: 'bg-indigo-100 text-indigo-800',
  EXPORT_READY: 'bg-orange-100 text-orange-800',
  EXPORTED: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  HARVEST: 'Cosecha',
  PROCESSING: 'Beneficio',
  DRYING: 'Secado',
  STORAGE: 'Almacenamiento',
  MILLING: 'Trilla',
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
      const [realMicrolots, harvestsFromDB, lotsFromDB, farmsFromDB, eventsFromDB] = await Promise.all([
        offlineDB.microlots.toArray(),
        offlineDB.harvests.toArray(),
        offlineDB.lots.toArray(),
        offlineDB.farms.toArray(),
        offlineDB.traceabilityEvents.toArray()
      ]);

      // Mapear microlotes reales
      const mappedMicrolots: Microlot[] = realMicrolots.map(m => {
        const lot = lotsFromDB.find(l => l.id === m.lotId);
        const farm = farmsFromDB.find(f => f.id?.toString() === lot?.farmId);
        const harvest = harvestsFromDB.find(h => h.id === m.harvestId);

        // Find events for this SPECIFIC microlot (by ID or Code if we start saving ID)
        // In CreateModal we didn't capture ID yet because we add it. 
        // But we can filter by microloteCode if we saved that in event, 
        // OR filtering by harvestId logic was previous.
        // Let's assume we match by ID if we have it, or we need to fix the event linking.
        // In CreateModal I just added: microlotId: microlotCode.
        // So we match event.microlotId === m.code

        const micEvents = eventsFromDB.filter(e => e.microlotId === m.code || e.microlotId === m.id?.toString())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Determine status: REAL from DB record, updated by latest event if exists
        let status = m.status;
        if (micEvents.length > 0 && micEvents[0].stage) {
          // Map event stage to status if needed, or assume 1:1
          // Event stages: 'COSECHA', 'BENEFICIO' (PROCESSING), etc.
          // Status types: 'HARVEST', 'PROCESSING', 'DRYING'...
          // We need a mapper if strings differ.
          // PROCESSING_STAGES in Modal uses: HARVEST, PROCESSING, DRYING...
          // So they should match.
          status = micEvents[0].stage as any;
        }

        return {
          id: m.id?.toString() || m.code, // Use DB ID or Code
          code: m.code,
          quantityKg: m.quantityKg,
          qualityGrade: m.qualityGrade,
          status: status,
          qrCode: `QR-${m.code}`,
          createdAt: m.createdAt,
          lot: {
            id: lot?.id?.toString() || 'unknown',
            name: lot?.name || 'Lote Desconocido',
            variety: lot?.variety || 'Desconocida',
            farm: {
              id: farm?.id?.toString() || 'unknown',
              name: farm?.name || 'Finca No Asignada',
              location: farm?.location || 'Ubicación Desconocida'
            }
          },
          harvest: harvest ? {
            id: harvest.id!.toString(),
            harvestDate: harvest.harvestDate || harvest.date,
            qualityGrade: harvest.qualityGrade || 'A'
          } : undefined,
          qualityControls: [], // TODO: Link real QCs
          traceabilityEvents: micEvents.map(e => ({
            id: e.id?.toString() || '',
            eventType: e.stage,
            eventDate: e.timestamp,
            description: e.description,
            data: e.data
          })),
          certificationRecords: [] // TODO: Link real certs
        };
      });

      setMicrolots(mappedMicrolots);
      return mappedMicrolots;

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos de trazabilidad');
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      // Re-fetch everything to ensure sync (or we could pass the data)
      const realMicrolots = await offlineDB.microlots.toArray();
      const totalMicrolots = realMicrolots.length;

      // Status Distribution
      const statusCounts: Record<string, number> = {};
      realMicrolots.forEach(m => {
        statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
      });

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        _count: { status: count }
      }));

      // Stats Object
      const stats: TraceabilityStats = {
        totalMicrolots,
        statusDistribution,
        qualityMetrics: [
          { passed: true, _count: { passed: totalMicrolots }, _avg: { scaScore: 0 } }
        ],
        certificationDistribution: [],
        recentEvents: [] // Can populate if needed
      };

      setStats(stats);
    } catch (error) {
      console.error('Error:', error);
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
      case 'MILLING': return 'default';
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
      case 'MILLING':
        return <Loader2 className="h-4 w-4" />;
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
                  <SelectItem value="MILLING">Trilla</SelectItem>
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
      responsible: { firstName: 'Juan', lastName: 'Pérez' },
      data: ev.data
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