import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Package, Loader2 } from 'lucide-react';
import { offlineDB } from '@/utils/offlineDB';

interface Lot {
  id: string;
  name: string;
  variety: string;
  area: number;
  farm: {
    id: string;
    name: string;
    location: string;
  };
}

interface Harvest {
  id: string;
  harvestDate: string;
  quantityKg: number;
  qualityGrade: string;
  lot: {
    id: string;
    name: string;
    farm: {
      name: string;
    };
  };
}

interface CreateMicrolotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateMicrolotModal({ isOpen, onClose, onSuccess }: CreateMicrolotModalProps) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    lotId: '',
    harvestId: '',
    quantityKg: '',
    qualityGrade: '',
    certifications: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de la base de datos offline
      const [lotsFromDB, harvestsFromDB] = await Promise.all([
        offlineDB.lots.toArray(),
        offlineDB.harvests.toArray()
      ]);

      // Formatear lotes
      const formattedLots: Lot[] = lotsFromDB.map(lot => ({
        id: lot.id!.toString(),
        name: lot.name,
        variety: lot.variety,
        area: lot.area,
        farm: {
          id: '1',
          name: 'Finca El Paraíso',
          location: 'Huila, Colombia'
        }
      }));

      // Formatear cosechas
      const formattedHarvests: Harvest[] = harvestsFromDB.map(harvest => {
        const lot = lotsFromDB.find(l => l.id === harvest.lotId);
        return {
          id: harvest.id!.toString(),
          harvestDate: harvest.harvestDate,
          quantityKg: harvest.quantity,
          qualityGrade: harvest.qualityGrade || 'A',
          lot: {
            id: harvest.lotId.toString(),
            name: lot?.name || 'Lote Principal',
            farm: {
              name: 'Finca El Paraíso'
            }
          }
        };
      });
      
      setLots(formattedLots);
      setHarvests(formattedHarvests);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.lotId) {
      newErrors.lotId = 'Selecciona un lote';
    }

    if (!formData.harvestId) {
      newErrors.harvestId = 'Selecciona una cosecha';
    }

    if (!formData.quantityKg) {
      newErrors.quantityKg = 'Ingresa la cantidad';
    } else if (parseFloat(formData.quantityKg) <= 0) {
      newErrors.quantityKg = 'La cantidad debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Crear microlote en la base de datos offline
      const selectedHarvest = harvests.find(h => h.id === formData.harvestId);
      const selectedLot = lots.find(l => l.id === formData.lotId);

      if (!selectedHarvest || !selectedLot) {
        toast.error('Error: Datos de cosecha o lote no encontrados');
        return;
      }

      // Generar código único para el microlote
      const microlotCode = `ML-${Date.now()}-${selectedLot.name.substring(0, 3).toUpperCase()}`;

      // Crear registro de microlote (simulado - en una implementación real se guardaría en una tabla específica)
      const microlotData = {
        code: microlotCode,
        lotId: parseInt(formData.lotId),
        harvestId: parseInt(formData.harvestId),
        quantityKg: parseFloat(formData.quantityKg),
        qualityGrade: formData.qualityGrade || 'A',
        certifications: formData.certifications,
        status: 'HARVEST',
        createdAt: new Date().toISOString()
      };

      // Simular guardado exitoso
      console.log('Microlote creado:', microlotData);
      
      toast.success(`Microlote ${microlotCode} creado exitosamente`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear microlote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      lotId: '',
      harvestId: '',
      quantityKg: '',
      qualityGrade: '',
      certifications: ''
    });
    setErrors({});
    onClose();
  };

  const selectedLot = lots.find(lot => lot.id === formData.lotId);
  const filteredHarvests = harvests.filter(harvest => harvest.lot.id === formData.lotId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Crear Nuevo Microlote
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de Lote */}
            <div className="space-y-2">
              <Label htmlFor="lotId">Lote *</Label>
              <Select
                value={formData.lotId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, lotId: value, harvestId: '' }));
                  if (errors.lotId) setErrors(prev => ({ ...prev, lotId: '' }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un lote" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.name} - {lot.variety} ({lot.area} ha)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lotId && <p className="text-sm text-red-500">{errors.lotId}</p>}
            </div>

            {/* Información del Lote Seleccionado */}
            {selectedLot && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Información del Lote</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Finca:</span>
                    <p className="font-medium">{selectedLot.farm.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Variedad:</span>
                    <p className="font-medium">{selectedLot.variety}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Área:</span>
                    <p className="font-medium">{selectedLot.area} ha</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ubicación:</span>
                    <p className="font-medium">{selectedLot.farm.location}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selección de Cosecha */}
            <div className="space-y-2">
              <Label htmlFor="harvestId">Cosecha *</Label>
              <Select
                value={formData.harvestId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, harvestId: value }));
                  if (errors.harvestId) setErrors(prev => ({ ...prev, harvestId: '' }));
                }}
                disabled={!formData.lotId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.lotId ? "Selecciona una cosecha" : "Primero selecciona un lote"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredHarvests.map((harvest) => (
                    <SelectItem key={harvest.id} value={harvest.id}>
                      {new Date(harvest.harvestDate).toLocaleDateString()} - {harvest.quantityKg} kg - {harvest.qualityGrade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.harvestId && <p className="text-sm text-red-500">{errors.harvestId}</p>}
            </div>

            {/* Cantidad del Microlote */}
            <div className="space-y-2">
              <Label htmlFor="quantityKg">Cantidad (kg) *</Label>
              <Input
                id="quantityKg"
                type="number"
                step="0.1"
                min="0"
                placeholder="Ej: 500"
                value={formData.quantityKg}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, quantityKg: e.target.value }));
                  if (errors.quantityKg) setErrors(prev => ({ ...prev, quantityKg: '' }));
                }}
              />
              {errors.quantityKg && <p className="text-sm text-red-500">{errors.quantityKg}</p>}
            </div>

            {/* Grado de Calidad */}
            <div className="space-y-2">
              <Label htmlFor="qualityGrade">Grado de Calidad</Label>
              <Select
                value={formData.qualityGrade}
                onValueChange={(value) => setFormData(prev => ({ ...prev, qualityGrade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el grado de calidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPREMO">Supremo</SelectItem>
                  <SelectItem value="EXCELSO">Excelso</SelectItem>
                  <SelectItem value="UGQ">UGQ (Usual Good Quality)</SelectItem>
                  <SelectItem value="SPECIALTY">Specialty</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Certificaciones */}
            <div className="space-y-2">
              <Label htmlFor="certifications">Certificaciones Previstas</Label>
              <Textarea
                id="certifications"
                placeholder="Ej: Orgánico, Fair Trade, Rainforest Alliance..."
                value={formData.certifications}
                onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                rows={3}
              />
              <p className="text-sm text-gray-500">
                Describe las certificaciones que planeas obtener para este microlote
              </p>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Microlote'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}