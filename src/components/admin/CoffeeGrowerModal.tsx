import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { X, Coffee, MapPin, Phone, Mail, FileText, Star } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const coffeeGrowerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  documentType: z.enum(['cedula', 'passport', 'nit']),
  documentNumber: z.string().min(6, 'El número de documento debe tener al menos 6 caracteres'),
  address: z.string().min(10, 'La dirección debe tener al menos 10 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  department: z.string().min(2, 'El departamento es requerido'),
  country: z.string().default('Colombia'),
  certifications: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'pending_verification']).default('pending_verification')
});

const editGrowerSchema = coffeeGrowerSchema.partial();

interface CoffeeGrower {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: 'cedula' | 'passport' | 'nit';
  documentNumber: string;
  address: string;
  city: string;
  department: string;
  country: string;
  farmCount: number;
  totalHectares: number;
  certifications: string[];
  registrationDate: string;
  status: 'active' | 'inactive' | 'pending_verification';
  rating: number;
  totalProduction: number;
  lastActivity: string;
}

interface CoffeeGrowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  grower?: CoffeeGrower | null;
  onSave: (grower: CoffeeGrower) => void;
}

export default function CoffeeGrowerModal({ isOpen, onClose, grower, onSave }: CoffeeGrowerModalProps) {
  const { useAuthenticatedFetch } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: 'cedula' as const,
    documentNumber: '',
    address: '',
    city: '',
    department: '',
    country: 'Colombia',
    certifications: [] as string[],
    status: 'pending_verification' as const
  });

  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    if (grower) {
      setFormData({
        firstName: grower.firstName,
        lastName: grower.lastName,
        email: grower.email,
        phone: grower.phone,
        documentType: grower.documentType,
        documentNumber: grower.documentNumber,
        address: grower.address,
        city: grower.city,
        department: grower.department,
        country: grower.country,
        certifications: grower.certifications,
        status: grower.status
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        documentType: 'cedula',
        documentNumber: '',
        address: '',
        city: '',
        department: '',
        country: 'Colombia',
        certifications: [],
        status: 'pending_verification'
      });
    }
    setErrors({});
  }, [grower, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const schema = grower ? editGrowerSchema : coffeeGrowerSchema;
      const validatedData = schema.parse(formData);

      const url = grower 
        ? `/admin/coffee-growers/${grower.id}`
        : '/admin/coffee-growers';
      
      const method = grower ? 'PUT' : 'POST';

      const response = await useAuthenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      });

      if (response.ok) {
        const savedGrower = await response.json();
        onSave(savedGrower.grower || savedGrower);
        toast.success(grower ? 'Cafetalero actualizado exitosamente' : 'Cafetalero creado exitosamente');
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al guardar cafetalero');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Error saving grower:', error);
        toast.error('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            {grower ? 'Editar Cafetalero' : 'Nuevo Cafetalero'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nombre del cafetalero"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Apellido del cafetalero"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Document Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documentación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => handleInputChange('documentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="cedula">Cédula de Ciudadanía</option>
                  <option value="passport">Pasaporte</option>
                  <option value="nit">NIT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.documentNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123456789"
                  />
                </div>
                {errors.documentNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.documentNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ubicación</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Dirección completa"
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ciudad"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.department ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar departamento</option>
                    <option value="Antioquia">Antioquia</option>
                    <option value="Caldas">Caldas</option>
                    <option value="Quindío">Quindío</option>
                    <option value="Risaralda">Risaralda</option>
                    <option value="Huila">Huila</option>
                    <option value="Nariño">Nariño</option>
                    <option value="Tolima">Tolima</option>
                    <option value="Cauca">Cauca</option>
                    <option value="Valle del Cauca">Valle del Cauca</option>
                    <option value="Cundinamarca">Cundinamarca</option>
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="País"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Certificaciones</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Agregar certificación (ej: Orgánico, Fair Trade, etc.)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <button
                  type="button"
                  onClick={addCertification}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Agregar
                </button>
              </div>
              
              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                    >
                      <Star className="h-3 w-3" />
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(cert)}
                        className="ml-1 text-emerald-600 hover:text-emerald-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="pending_verification">Pendiente verificación</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {grower ? 'Actualizar' : 'Crear'} Cafetalero
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}