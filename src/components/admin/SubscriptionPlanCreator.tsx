import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  Plus, 
  Save, 
  X,
  Star,
  Users,
  DollarSign,
  Calendar,
  Settings,
  Check,
  Trash2,
  Copy,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'quarterly';
  features: string[];
  limitations: {
    maxFarms: number;
    maxUsers: number;
    storageGB: number;
    supportLevel: 'basic' | 'premium' | 'enterprise';
    apiCalls: number;
    exportLimit: number;
    customReports: boolean;
    prioritySupport: boolean;
  };
  isPopular: boolean;
  isActive: boolean;
  trialDays: number;
  discountPercentage: number;
  setupFee: number;
  cancellationPolicy: 'immediate' | 'end_of_period' | 'no_cancellation';
  autoRenewal: boolean;
  gracePeriodDays: number;
  metadata: Record<string, any>;
}

interface PlanCreatorProps {
  plan?: SubscriptionPlan;
  onSave: (plan: SubscriptionPlan) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const defaultPlan: SubscriptionPlan = {
  name: '',
  description: '',
  price: 0,
  currency: 'COP',
  billingCycle: 'monthly',
  features: [],
  limitations: {
    maxFarms: 1,
    maxUsers: 1,
    storageGB: 1,
    supportLevel: 'basic',
    apiCalls: 1000,
    exportLimit: 10,
    customReports: false,
    prioritySupport: false
  },
  isPopular: false,
  isActive: true,
  trialDays: 0,
  discountPercentage: 0,
  setupFee: 0,
  cancellationPolicy: 'end_of_period',
  autoRenewal: true,
  gracePeriodDays: 3,
  metadata: {}
};

export default function SubscriptionPlanCreator({ plan, onSave, onCancel, isOpen }: PlanCreatorProps) {
  const { useAuthenticatedFetch } = useAdminStore();
  const [formData, setFormData] = useState<SubscriptionPlan>(plan || defaultPlan);
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'features' | 'limitations' | 'advanced'>('basic');

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData(defaultPlan);
    }
  }, [plan]);

  const handleSave = async () => {
    if (!formData.name || !formData.description || formData.price < 0) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      const url = formData.id 
        ? `/admin/subscription-plans/${formData.id}`
        : '/admin/subscription-plans';
      
      const method = formData.id ? 'PUT' : 'POST';
      
      // Preparar datos para el backend
      const planData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        billing_cycle: formData.billingCycle,
        features: JSON.stringify(formData.features),
        limitations: JSON.stringify(formData.limitations),
        is_popular: formData.isPopular,
        is_active: formData.isActive,
        trial_days: formData.trialDays,
        discount_percentage: formData.discountPercentage,
        setup_fee: formData.setupFee,
        cancellation_policy: formData.cancellationPolicy,
        auto_renewal: formData.autoRenewal,
        grace_period_days: formData.gracePeriodDays,
        metadata: JSON.stringify(formData.metadata)
      };
      
      const response = await useAuthenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onSave(result.data);
          toast.success(result.message || `Plan ${formData.id ? 'actualizado' : 'creado'} exitosamente`);
        } else {
          toast.error(result.message || 'Error al guardar el plan');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al guardar el plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const duplicatePlan = () => {
    const duplicated = {
      ...formData,
      id: undefined,
      name: `${formData.name} (Copia)`,
      isActive: false
    };
    setFormData(duplicated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {formData.id ? 'Editar Plan' : 'Crear Nuevo Plan'}
            </h2>
            <p className="text-gray-600 mt-1">
              {formData.id ? 'Modifica los detalles del plan' : 'Configura un nuevo plan de suscripción'}
            </p>
          </div>
          <div className="flex gap-2">
            {formData.id && (
              <button
                onClick={duplicatePlan}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Copy className="h-4 w-4" />
                Duplicar
              </button>
            )}
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'basic', label: 'Información Básica', icon: Settings },
              { key: 'features', label: 'Características', icon: Check },
              { key: 'limitations', label: 'Limitaciones', icon: Users },
              { key: 'advanced', label: 'Configuración Avanzada', icon: Star }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === key
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 inline mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Plan *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Plan Básico"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                  </label>
                  <div className="flex">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="COP">COP</option>
                      <option value="USD">USD</option>
                    </select>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="flex-1 px-3 py-2 border-t border-r border-b border-gray-300 rounded-r-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciclo de Facturación
                  </label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Días de Prueba Gratuita
                  </label>
                  <input
                    type="number"
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe las características principales del plan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Plan activo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Plan popular</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoRenewal}
                    onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Renovación automática</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Características del Plan
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Agregar nueva característica..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <button
                    onClick={addFeature}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="flex-1">{feature}</span>
                      <button
                        onClick={() => removeFeature(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {formData.features.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No hay características agregadas
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'limitations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Fincas
                  </label>
                  <input
                    type="number"
                    value={formData.limitations.maxFarms}
                    onChange={(e) => setFormData({
                      ...formData,
                      limitations: { ...formData.limitations, maxFarms: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Usuarios
                  </label>
                  <input
                    type="number"
                    value={formData.limitations.maxUsers}
                    onChange={(e) => setFormData({
                      ...formData,
                      limitations: { ...formData.limitations, maxUsers: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Almacenamiento (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.limitations.storageGB}
                    onChange={(e) => setFormData({
                      ...formData,
                      limitations: { ...formData.limitations, storageGB: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Llamadas API por mes
                  </label>
                  <input
                    type="number"
                    value={formData.limitations.apiCalls}
                    onChange={(e) => setFormData({
                      ...formData,
                      limitations: { ...formData.limitations, apiCalls: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Límite de Exportaciones
                  </label>
                  <input
                    type="number"
                    value={formData.limitations.exportLimit}
                    onChange={(e) => setFormData({
                      ...formData,
                      limitations: { ...formData.limitations, exportLimit: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel de Soporte
                  </label>
                  <select
                    value={formData.limitations.supportLevel}
                    onChange={(e) => setFormData({
                      ...formData,
                      limitations: { ...formData.limitations, supportLevel: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Empresarial</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.limitations.customReports}
                    onChange={(e) => setFormData({
                      ...formData,
                      limitations: { ...formData.limitations, customReports: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Reportes personalizados</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.limitations.prioritySupport}
                    onChange={(e) => setFormData({
                      ...formData,
                      limitations: { ...formData.limitations, prioritySupport: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Soporte prioritario</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarifa de Configuración
                  </label>
                  <input
                    type="number"
                    value={formData.setupFee}
                    onChange={(e) => setFormData({ ...formData, setupFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Política de Cancelación
                  </label>
                  <select
                    value={formData.cancellationPolicy}
                    onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="immediate">Inmediata</option>
                    <option value="end_of_period">Al final del período</option>
                    <option value="no_cancellation">Sin cancelación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período de Gracia (días)
                  </label>
                  <input
                    type="number"
                    value={formData.gracePeriodDays}
                    onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}