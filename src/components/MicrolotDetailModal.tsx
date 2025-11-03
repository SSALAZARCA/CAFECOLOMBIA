import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  X, 
  MapPin, 
  Calendar, 
  Package, 
  Award, 
  CheckCircle, 
  AlertTriangle,
  Download,
  QrCode,
  Clock,
  User
} from 'lucide-react';

interface Microlot {
  id: string;
  code: string;
  quantityKg: number;
  qualityGrade?: string;
  status: 'COSECHADO' | 'EN_BENEFICIO' | 'SECANDO' | 'ALMACENADO' | 'LISTO_EXPORTACION' | 'EXPORTADO';
  processDate: string;
  lot: {
    name: string;
    variety: string;
    area: number;
    farm: {
      name: string;
      location: string;
      altitude?: number;
      owner: {
        firstName: string;
        lastName: string;
      };
    };
  };
  harvest: {
    harvestDate: string;
    qualityGrade: string;
    harvestedByUser: {
      firstName: string;
      lastName: string;
    };
  };
  processing: Array<{
    id: string;
    processType: string;
    startDate: string;
    endDate?: string;
    qualityScore?: number;
    processedByUser: {
      firstName: string;
      lastName: string;
    };
  }>;
  qualityControls: Array<{
    id: string;
    testType: string;
    testDate: string;
    moisture?: number;
    density?: number;
    defects?: number;
    screenSize?: string;
    aroma?: number;
    acidity?: number;
    body?: number;
    flavor?: number;
    scaScore?: number;
    passed: boolean;
    notes?: string;
    tester: {
      firstName: string;
      lastName: string;
    };
  }>;
  traceabilityEvents: Array<{
    id: string;
    eventType: string;
    eventDate: string;
    description: string;
    location?: string;
    responsible: {
      firstName: string;
      lastName: string;
    };
  }>;
  certificationRecords: Array<{
    id: string;
    certificationType: string;
    certificationBody: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
    status: string;
  }>;
}

interface MicrolotDetailModalProps {
  microlot: Microlot | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors = {
  COSECHADO: 'bg-green-100 text-green-800',
  EN_BENEFICIO: 'bg-blue-100 text-blue-800',
  SECANDO: 'bg-yellow-100 text-yellow-800',
  ALMACENADO: 'bg-purple-100 text-purple-800',
  LISTO_EXPORTACION: 'bg-orange-100 text-orange-800',
  EXPORTADO: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  COSECHADO: 'Cosechado',
  EN_BENEFICIO: 'En Beneficio',
  SECANDO: 'Secando',
  ALMACENADO: 'Almacenado',
  LISTO_EXPORTACION: 'Listo Exportación',
  EXPORTADO: 'Exportado'
};

const eventTypeLabels = {
  COSECHA: 'Cosecha',
  INICIO_BENEFICIO: 'Inicio Beneficio',
  FIN_BENEFICIO: 'Fin Beneficio',
  INICIO_SECADO: 'Inicio Secado',
  FIN_SECADO: 'Fin Secado',
  ALMACENAMIENTO: 'Almacenamiento',
  CONTROL_CALIDAD: 'Control Calidad',
  CERTIFICACION: 'Certificación',
  PREPARACION_EXPORTACION: 'Preparación Exportación',
  EXPORTACION: 'Exportación'
};

const certificationLabels = {
  ORGANICO: 'Orgánico',
  FAIR_TRADE: 'Comercio Justo',
  RAINFOREST_ALLIANCE: 'Rainforest Alliance',
  UTZ: 'UTZ',
  SPECIALTY: 'Specialty Coffee',
  BIRD_FRIENDLY: 'Bird Friendly',
  OTRO: 'Otro'
};

export default function MicrolotDetailModal({ microlot, isOpen, onClose }: MicrolotDetailModalProps) {
  if (!microlot) return null;

  const latestQualityControl = microlot.qualityControls[0];
  const activeCertifications = microlot.certificationRecords.filter(cert => cert.status === 'ACTIVA');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{microlot.code}</DialogTitle>
              <p className="text-gray-600">{microlot.lot.farm.name} - {microlot.lot.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[microlot.status]}>
                {statusLabels[microlot.status]}
              </Badge>
              <Button variant="outline" size="sm">
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información del Microlote</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="font-medium">{microlot.quantityKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Variedad:</span>
                  <span className="font-medium">{microlot.lot.variety}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grado de Calidad:</span>
                  <span className="font-medium">{microlot.qualityGrade || 'No definido'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de Proceso:</span>
                  <span className="font-medium">{new Date(microlot.processDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información de la Finca</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Propietario:</span>
                  <span className="font-medium">
                    {microlot.lot.farm.owner.firstName} {microlot.lot.farm.owner.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="font-medium flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {microlot.lot.farm.location}
                  </span>
                </div>
                {microlot.lot.farm.altitude && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Altitud:</span>
                    <span className="font-medium">{microlot.lot.farm.altitude} msnm</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Área del Lote:</span>
                  <span className="font-medium">{microlot.lot.area} ha</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Cosecha */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Información de Cosecha</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de Cosecha:</span>
                <span className="font-medium">{new Date(microlot.harvest.harvestDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Grado de Calidad:</span>
                <span className="font-medium">{microlot.harvest.qualityGrade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cosechado por:</span>
                <span className="font-medium">
                  {microlot.harvest.harvestedByUser.firstName} {microlot.harvest.harvestedByUser.lastName}
                </span>
              </div>
            </div>
          </div>

          {/* Procesamiento */}
          {microlot.processing.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Historial de Procesamiento</h3>
              <div className="space-y-3">
                {microlot.processing.map((process) => (
                  <div key={process.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{process.processType}</h4>
                        <p className="text-sm text-gray-600">
                          Procesado por: {process.processedByUser.firstName} {process.processedByUser.lastName}
                        </p>
                      </div>
                      {process.qualityScore && (
                        <Badge variant="outline">
                          Calidad: {process.qualityScore}/10
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Inicio: </span>
                        <span>{new Date(process.startDate).toLocaleDateString()}</span>
                      </div>
                      {process.endDate && (
                        <div>
                          <span className="text-gray-600">Fin: </span>
                          <span>{new Date(process.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Control de Calidad */}
          {latestQualityControl && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Último Control de Calidad</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{latestQualityControl.testType}</h4>
                    <p className="text-sm text-gray-600">
                      Evaluado por: {latestQualityControl.tester.firstName} {latestQualityControl.tester.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Fecha: {new Date(latestQualityControl.testDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={latestQualityControl.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {latestQualityControl.passed ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aprobado
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Rechazado
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {latestQualityControl.moisture && (
                    <div>
                      <span className="text-gray-600">Humedad: </span>
                      <span className="font-medium">{latestQualityControl.moisture}%</span>
                    </div>
                  )}
                  {latestQualityControl.defects && (
                    <div>
                      <span className="text-gray-600">Defectos: </span>
                      <span className="font-medium">{latestQualityControl.defects}%</span>
                    </div>
                  )}
                  {latestQualityControl.scaScore && (
                    <div>
                      <span className="text-gray-600">Puntaje SCA: </span>
                      <span className="font-medium">{latestQualityControl.scaScore}</span>
                    </div>
                  )}
                  {latestQualityControl.screenSize && (
                    <div>
                      <span className="text-gray-600">Tamaño: </span>
                      <span className="font-medium">{latestQualityControl.screenSize}</span>
                    </div>
                  )}
                </div>

                {(latestQualityControl.aroma || latestQualityControl.acidity || latestQualityControl.body || latestQualityControl.flavor) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h5 className="font-medium mb-2">Análisis Sensorial</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {latestQualityControl.aroma && (
                        <div>
                          <span className="text-gray-600">Aroma: </span>
                          <span className="font-medium">{latestQualityControl.aroma}/10</span>
                        </div>
                      )}
                      {latestQualityControl.acidity && (
                        <div>
                          <span className="text-gray-600">Acidez: </span>
                          <span className="font-medium">{latestQualityControl.acidity}/10</span>
                        </div>
                      )}
                      {latestQualityControl.body && (
                        <div>
                          <span className="text-gray-600">Cuerpo: </span>
                          <span className="font-medium">{latestQualityControl.body}/10</span>
                        </div>
                      )}
                      {latestQualityControl.flavor && (
                        <div>
                          <span className="text-gray-600">Sabor: </span>
                          <span className="font-medium">{latestQualityControl.flavor}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {latestQualityControl.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h5 className="font-medium mb-1">Notas</h5>
                    <p className="text-sm text-gray-600">{latestQualityControl.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certificaciones */}
          {activeCertifications.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Certificaciones Activas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCertifications.map((cert) => (
                  <div key={cert.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {certificationLabels[cert.certificationType as keyof typeof certificationLabels] || cert.certificationType}
                        </h4>
                        <p className="text-sm text-gray-600">{cert.certificationBody}</p>
                        <p className="text-sm text-gray-600">#{cert.certificateNumber}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <Award className="h-3 w-3 mr-1" />
                        Activa
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Emisión:</span>
                        <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vencimiento:</span>
                        <span>{new Date(cert.expiryDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline de Trazabilidad */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Timeline de Trazabilidad</h3>
            <div className="space-y-4">
              {microlot.traceabilityEvents.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {eventTypeLabels[event.eventType as keyof typeof eventTypeLabels] || event.eventType}
                        </h4>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        {event.location && (
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{new Date(event.eventDate).toLocaleDateString()}</p>
                        <p className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {event.responsible.firstName} {event.responsible.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="border-t pt-6 flex justify-end space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Generar Certificado
            </Button>
            <Button variant="outline">
              <QrCode className="h-4 w-4 mr-2" />
              Ver QR Público
            </Button>
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}