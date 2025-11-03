import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Thermometer,
  Droplets,
  Package,
  Truck
} from 'lucide-react';

interface Microlot {
  id: string;
  code: string;
  status: string;
  quantityKg: number;
  lot: {
    name: string;
    variety: string;
    farm: {
      name: string;
    };
  };
}

interface ProcessingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  microlot: Microlot | null;
  onSuccess: () => void;
}

const PROCESSING_STAGES = [
  { key: 'HARVEST', label: 'Cosecha', icon: CheckCircle, color: 'bg-green-500' },
  { key: 'PROCESSING', label: 'Beneficio', icon: Droplets, color: 'bg-blue-500' },
  { key: 'DRYING', label: 'Secado', icon: Thermometer, color: 'bg-orange-500' },
  { key: 'STORAGE', label: 'Almacenamiento', icon: Package, color: 'bg-purple-500' },
  { key: 'EXPORT_READY', label: 'Listo para Exportación', icon: Truck, color: 'bg-gray-500' }
];

const PROCESSING_TYPES = [
  { value: 'WASHED', label: 'Lavado' },
  { value: 'HONEY', label: 'Honey' },
  { value: 'NATURAL', label: 'Natural' },
  { value: 'SEMI_WASHED', label: 'Semi-lavado' }
];

const DRYING_METHODS = [
  { value: 'SUN_DRIED', label: 'Secado al Sol' },
  { value: 'MECHANICAL', label: 'Secado Mecánico' },
  { value: 'MIXED', label: 'Mixto' }
];

export default function ProcessingFlowModal({ isOpen, onClose, microlot, onSuccess }: ProcessingFlowModalProps) {
  const [currentStage, setCurrentStage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    processingType: '',
    fermentationHours: '',
    dryingMethod: '',
    dryingDays: '',
    finalMoisture: '',
    storageLocation: '',
    storageConditions: '',
    notes: ''
  });

  useEffect(() => {
    if (microlot) {
      setCurrentStage(microlot.status);
      // Reset form when microlot changes
      setFormData({
        processingType: '',
        fermentationHours: '',
        dryingMethod: '',
        dryingDays: '',
        finalMoisture: '',
        storageLocation: '',
        storageConditions: '',
        notes: ''
      });
    }
  }, [microlot]);

  const getCurrentStageIndex = () => {
    return PROCESSING_STAGES.findIndex(stage => stage.key === currentStage);
  };

  const getNextStage = () => {
    const currentIndex = getCurrentStageIndex();
    if (currentIndex < PROCESSING_STAGES.length - 1) {
      return PROCESSING_STAGES[currentIndex + 1];
    }
    return null;
  };

  const handleAdvanceStage = async () => {
    if (!microlot) return;

    const nextStage = getNextStage();
    if (!nextStage) {
      toast.error('El microlote ya está en la etapa final');
      return;
    }

    // Validate required fields based on stage
    if (!validateStageData(nextStage.key)) {
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      // Create traceability event
      const eventResponse = await fetch('/api/traceability/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          microlotId: microlot.id,
          eventType: getEventTypeForStage(nextStage.key),
          description: getEventDescription(nextStage.key),
          metadata: getMetadataForStage(nextStage.key)
        })
      });

      if (!eventResponse.ok) {
        throw new Error('Error al crear evento de trazabilidad');
      }

      // Update microlot status
      const updateResponse = await fetch(`/api/traceability/microlots/${microlot.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: nextStage.key,
          notes: formData.notes
        })
      });

      if (updateResponse.ok) {
        toast.success(`Microlote avanzado a: ${nextStage.label}`);
        onSuccess();
        onClose();
      } else {
        throw new Error('Error al actualizar estado del microlote');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al avanzar etapa');
    } finally {
      setSubmitting(false);
    }
  };

  const validateStageData = (stage: string) => {
    switch (stage) {
      case 'PROCESSING':
        if (!formData.processingType) {
          toast.error('Selecciona el tipo de procesamiento');
          return false;
        }
        if (!formData.fermentationHours) {
          toast.error('Ingresa las horas de fermentación');
          return false;
        }
        break;
      case 'DRYING':
        if (!formData.dryingMethod) {
          toast.error('Selecciona el método de secado');
          return false;
        }
        if (!formData.dryingDays) {
          toast.error('Ingresa los días de secado');
          return false;
        }
        break;
      case 'STORAGE':
        if (!formData.finalMoisture) {
          toast.error('Ingresa la humedad final');
          return false;
        }
        if (!formData.storageLocation) {
          toast.error('Ingresa la ubicación de almacenamiento');
          return false;
        }
        break;
    }
    return true;
  };

  const getEventTypeForStage = (stage: string) => {
    switch (stage) {
      case 'PROCESSING': return 'PROCESSING_START';
      case 'DRYING': return 'DRYING_START';
      case 'STORAGE': return 'STORAGE_START';
      case 'EXPORT_READY': return 'EXPORT_PREPARATION';
      default: return 'STATUS_CHANGE';
    }
  };

  const getEventDescription = (stage: string) => {
    switch (stage) {
      case 'PROCESSING': return `Inicio de procesamiento ${formData.processingType}`;
      case 'DRYING': return `Inicio de secado ${formData.dryingMethod}`;
      case 'STORAGE': return `Almacenamiento en ${formData.storageLocation}`;
      case 'EXPORT_READY': return 'Preparación para exportación';
      default: return `Cambio de estado a ${stage}`;
    }
  };

  const getMetadataForStage = (stage: string) => {
    const metadata: any = {};
    
    switch (stage) {
      case 'PROCESSING':
        metadata.processingType = formData.processingType;
        metadata.fermentationHours = formData.fermentationHours;
        break;
      case 'DRYING':
        metadata.dryingMethod = formData.dryingMethod;
        metadata.dryingDays = formData.dryingDays;
        break;
      case 'STORAGE':
        metadata.finalMoisture = formData.finalMoisture;
        metadata.storageLocation = formData.storageLocation;
        metadata.storageConditions = formData.storageConditions;
        break;
    }

    if (formData.notes) {
      metadata.notes = formData.notes;
    }

    return metadata;
  };

  const renderStageForm = () => {
    const nextStage = getNextStage();
    if (!nextStage) return null;

    switch (nextStage.key) {
      case 'PROCESSING':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Procesamiento *</Label>
              <Select
                value={formData.processingType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, processingType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de procesamiento" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESSING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horas de Fermentación *</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 24"
                value={formData.fermentationHours}
                onChange={(e) => setFormData(prev => ({ ...prev, fermentationHours: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'DRYING':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Método de Secado *</Label>
              <Select
                value={formData.dryingMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dryingMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el método de secado" />
                </SelectTrigger>
                <SelectContent>
                  {DRYING_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Días de Secado *</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ej: 15"
                value={formData.dryingDays}
                onChange={(e) => setFormData(prev => ({ ...prev, dryingDays: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'STORAGE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Humedad Final (%) *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Ej: 12.5"
                value={formData.finalMoisture}
                onChange={(e) => setFormData(prev => ({ ...prev, finalMoisture: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ubicación de Almacenamiento *</Label>
              <Input
                placeholder="Ej: Bodega A, Estante 3"
                value={formData.storageLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, storageLocation: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Condiciones de Almacenamiento</Label>
              <Textarea
                placeholder="Ej: Temperatura controlada 18-22°C, humedad relativa 60-65%"
                value={formData.storageConditions}
                onChange={(e) => setFormData(prev => ({ ...prev, storageConditions: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );

      case 'EXPORT_READY':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800">
                El microlote está listo para ser preparado para exportación. 
                Se generarán automáticamente los documentos necesarios.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!microlot) return null;

  const nextStage = getNextStage();
  const currentStageIndex = getCurrentStageIndex();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ArrowRight className="h-5 w-5 mr-2" />
            Flujo de Procesamiento - {microlot.code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Microlote */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Información del Microlote</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Código: </span>
                <span className="font-medium">{microlot.code}</span>
              </div>
              <div>
                <span className="text-gray-600">Cantidad: </span>
                <span className="font-medium">{microlot.quantityKg} kg</span>
              </div>
              <div>
                <span className="text-gray-600">Finca: </span>
                <span className="font-medium">{microlot.lot.farm.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Variedad: </span>
                <span className="font-medium">{microlot.lot.variety}</span>
              </div>
            </div>
          </div>

          {/* Flujo de Etapas */}
          <div className="space-y-4">
            <h4 className="font-medium">Progreso del Procesamiento</h4>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {PROCESSING_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isNext = index === currentStageIndex + 1;
                const IconComponent = stage.icon;

                return (
                  <React.Fragment key={stage.key}>
                    <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-white
                        ${isCompleted ? 'bg-green-500' : 
                          isCurrent ? stage.color : 
                          isNext ? 'bg-blue-200' : 'bg-gray-300'}
                      `}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className={`
                        text-xs mt-2 text-center
                        ${isCurrent ? 'font-medium text-blue-600' : 
                          isCompleted ? 'text-green-600' : 'text-gray-500'}
                      `}>
                        {stage.label}
                      </span>
                      {isCurrent && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Actual
                        </Badge>
                      )}
                    </div>
                    {index < PROCESSING_STAGES.length - 1 && (
                      <ArrowRight className={`
                        h-4 w-4 flex-shrink-0
                        ${index < currentStageIndex ? 'text-green-500' : 'text-gray-300'}
                      `} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Formulario para Siguiente Etapa */}
          {nextStage && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">Avanzar a: {nextStage.label}</h4>
                <Badge variant="outline">{nextStage.label}</Badge>
              </div>

              {renderStageForm()}

              {/* Notas Generales */}
              <div className="space-y-2">
                <Label>Notas Adicionales</Label>
                <Textarea
                  placeholder="Observaciones, condiciones especiales, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cerrar
            </Button>
            {nextStage && (
              <Button
                onClick={handleAdvanceStage}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Avanzar a {nextStage.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}