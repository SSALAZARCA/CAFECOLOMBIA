import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, MapPin, Mountain, Coffee } from 'lucide-react';
import { z } from 'zod';
import { useAdminStore } from '../../stores/adminStore';

// Validation schema
const farmSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  ownerId: z.string().min(1, 'Debe seleccionar un propietario'),
  ownerName: z.string().min(2, 'El nombre del propietario es requerido'),
  area: z.number().min(0.1, 'El área debe ser mayor a 0'),
  altitude: z.number().min(0, 'La altitud debe ser mayor a 0'),
  latitude: z.number().min(-90).max(90, 'Latitud inválida'),
  longitude: z.number().min(-180).max(180, 'Longitud inválida'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  department: z.string().min(2, 'El departamento es requerido'),
  country: z.string().default('Colombia'),
  coffeeVarieties: z.array(z.string()).min(1, 'Debe seleccionar al menos una variedad'),
  productionCapacity: z.number().min(0, 'La capacidad de producción debe ser mayor a 0'),
  lastProduction: z.number().min(0, 'La producción debe ser mayor o igual a 0'),
  certifications: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'maintenance']),
  notes: z.string().optional()
});

const editFarmSchema = farmSchema.partial();

interface Farm {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  area: number;
  altitude: number;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  department: string;
  country: string;
  coffeeVarieties: string[];
  productionCapacity: number;
  lastProduction: number;
  certifications: string[];
  status: 'active' | 'inactive' | 'maintenance';
  notes?: string;
}

interface FarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  farm?: Farm | null;
  onSave: (farm: Partial<Farm>) => void;
}

const coffeeVarieties = [
  'Caturra', 'Colombia', 'Castillo', 'Típica', 'Borbón', 'Geisha',
  'Pacamara', 'Maragogipe', 'Tabi', 'Cenicafé 1'
];

const certificationOptions = [
  'Orgánico', 'Fair Trade', 'Rainforest Alliance', 'UTZ',
  'Bird Friendly', 'C.A.F.E. Practices', '4C'
];

const departments = [
  'Antioquia', 'Caldas', 'Quindío', 'Risaralda', 'Huila',
  'Nariño', 'Tolima', 'Cauca', 'Valle del Cauca', 'Cundinamarca'
];

export default function FarmModal({ isOpen, onClose, farm, onSave }: FarmModalProps) {
  const { authenticatedFetch } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coffeeGrowers, setCoffeeGrowers] = useState<Array<{ id: string; name: string }>>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    ownerId: '',
    ownerName: '',
    area: 0,
    altitude: 0,
    latitude: 0,
    longitude: 0,
    address: '',
    city: '',
    department: '',
    country: 'Colombia',
    coffeeVarieties: [] as string[],
    productionCapacity: 0,
    lastProduction: 0,
    certifications: [] as string[],
    status: 'active' as const,
    notes: ''
  });

  // Load coffee growers for owner selection
  useEffect(() => {
    if (isOpen) {
      loadCoffeeGrowers();
    }
  }, [isOpen]);

  // Initialize form data when farm changes
  useEffect(() => {
    if (farm) {
      setFormData({
        name: farm.name || '',
        ownerId: farm.ownerId || '',
        ownerName: farm.ownerName || '',
        area: farm.area || 0,
        altitude: farm.altitude || 0,
        latitude: farm.latitude || 0,
        longitude: farm.longitude || 0,
        address: farm.address || '',
        city: farm.city || '',
        department: farm.department || '',
        country: farm.country || 'Colombia',
        coffeeVarieties: farm.coffeeVarieties || [],
        productionCapacity: farm.productionCapacity || 0,
        lastProduction: farm.lastProduction || 0,
        certifications: farm.certifications || [],
        status: farm.status || 'active',
        notes: farm.notes || ''
      });
    } else {
      setFormData({
        name: '',
        ownerId: '',
        ownerName: '',
        area: 0,
        altitude: 0,
        latitude: 0,
        longitude: 0,
        address: '',
        city: '',
        department: '',
        country: 'Colombia',
        coffeeVarieties: [],
        productionCapacity: 0,
        lastProduction: 0,
        certifications: [],
        status: 'active',
        notes: ''
      });
    }
    setErrors({});
  }, [farm]);

  const loadCoffeeGrowers = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/coffee-growers');
      if (response.ok) {
        const data = await response.json();
        setCoffeeGrowers(data.growers || []);
      }
    } catch (error) {
      console.error('Error loading coffee growers:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOwnerChange = (ownerId: string) => {
    const selectedGrower = coffeeGrowers.find(g => g.id === ownerId);
    setFormData(prev => ({
      ...prev,
      ownerId,
      ownerName: selectedGrower?.name || ''
    }));
  };

  const addCoffeeVariety = (variety: string) => {
    if (!formData.coffeeVarieties.includes(variety)) {
      handleInputChange('coffeeVarieties', [...formData.coffeeVarieties, variety]);
    }
  };

  const removeCoffeeVariety = (variety: string) => {
    handleInputChange('coffeeVarieties', formData.coffeeVarieties.filter(v => v !== variety));
  };

  const addCertification = (certification: string) => {
    if (!formData.certifications.includes(certification)) {
      handleInputChange('certifications', [...formData.certifications, certification]);
    }
  };

  const removeCertification = (certification: string) => {
    handleInputChange('certifications', formData.certifications.filter(c => c !== certification));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const schema = farm ? editFarmSchema : farmSchema;
      const validatedData = schema.parse(formData);
      
      await onSave(validatedData);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {farm ? 'Editar Finca' : 'Nueva Finca'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Finca *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Finca El Paraíso"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Propietario *
              </label>
              <select
                value={formData.ownerId}
                onChange={(e) => handleOwnerChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.ownerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar propietario</option>
                {coffeeGrowers.map((grower) => (
                  <option key={grower.id} value={grower.id}>
                    {grower.name}
                  </option>
                ))}
              </select>
              {errors.ownerId && <p className="text-red-500 text-sm mt-1">{errors.ownerId}</p>}
            </div>
          </div>

          {/* Area and Altitude */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área (hectáreas) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.area}
                onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.area ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Altitud (msnm) *
              </label>
              <input
                type="number"
                value={formData.altitude}
                onChange={(e) => handleInputChange('altitude', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.altitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1500"
              />
              {errors.altitude && <p className="text-red-500 text-sm mt-1">{errors.altitude}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitud *
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.latitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="4.570868"
              />
              {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitud *
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.longitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="-74.297333"
              />
              {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Vereda El Paraíso"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Manizales"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento *
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.department ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar departamento</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
            </div>
          </div>

          {/* Coffee Varieties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variedades de Café *
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.coffeeVarieties.map((variety) => (
                <span
                  key={variety}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800"
                >
                  {variety}
                  <button
                    type="button"
                    onClick={() => removeCoffeeVariety(variety)}
                    className="ml-2 text-amber-600 hover:text-amber-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addCoffeeVariety(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Agregar variedad</option>
              {coffeeVarieties
                .filter(variety => !formData.coffeeVarieties.includes(variety))
                .map((variety) => (
                  <option key={variety} value={variety}>
                    {variety}
                  </option>
                ))}
            </select>
            {errors.coffeeVarieties && <p className="text-red-500 text-sm mt-1">{errors.coffeeVarieties}</p>}
          </div>

          {/* Production */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad de Producción (kg/año) *
              </label>
              <input
                type="number"
                value={formData.productionCapacity}
                onChange={(e) => handleInputChange('productionCapacity', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.productionCapacity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5000"
              />
              {errors.productionCapacity && <p className="text-red-500 text-sm mt-1">{errors.productionCapacity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Última Producción (kg) *
              </label>
              <input
                type="number"
                value={formData.lastProduction}
                onChange={(e) => handleInputChange('lastProduction', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.lastProduction ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="4500"
              />
              {errors.lastProduction && <p className="text-red-500 text-sm mt-1">{errors.lastProduction}</p>}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificaciones
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.certifications.map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(cert)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addCertification(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Agregar certificación</option>
              {certificationOptions
                .filter(cert => !formData.certifications.includes(cert))
                .map((cert) => (
                  <option key={cert} value={cert}>
                    {cert}
                  </option>
                ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Información adicional sobre la finca..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {farm ? 'Actualizar' : 'Crear'} Finca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}