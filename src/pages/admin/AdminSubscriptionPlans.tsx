import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import SubscriptionPlanCreator from '@/components/admin/SubscriptionPlanCreator';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Check,
  X,
  Star,
  Users,
  DollarSign,
  Calendar,
  Download,
  Upload,
  ToggleLeft,
  ToggleRight,
  Copy,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
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
  };
  isPopular: boolean;
  isActive: boolean;
  trialDays: number;
  discountPercentage: number;
  subscriberCount: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSubscriptionPlans() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBillingCycle, setFilterBillingCycle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Mapear datos del backend al formato del frontend
          const mappedPlans = data.data.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: plan.currency_code || 'COP',
            billingCycle: plan.billing_cycle,
            features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]'),
            limitations: {
              maxFarms: plan.max_users || 1,
              maxUsers: plan.max_users || 1,
              storageGB: plan.max_storage_gb || 1,
              supportLevel: 'basic'
            },
            isPopular: plan.is_featured || false,
            isActive: plan.is_active || false,
            trialDays: plan.trial_days || 0,
            discountPercentage: 0,
            subscriberCount: plan.active_subscriptions || 0,
            revenue: 0,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at
          }));
          setPlans(mappedPlans);
        } else {
          setPlans([]);
        }
      } else {
        toast.error('Error al cargar planes de suscripción');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBillingCycle = filterBillingCycle === 'all' || plan.billingCycle === filterBillingCycle;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && plan.isActive) ||
      (filterStatus === 'inactive' && !plan.isActive);
    
    return matchesSearch && matchesBillingCycle && matchesStatus;
  });

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plan?')) return;
    
    try {
      const response = await useAuthenticatedFetch(`/admin/subscription-plans/${planId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPlans(plans.filter(plan => plan.id !== planId));
        toast.success('Plan eliminado exitosamente');
      } else {
        toast.error('Error al eliminar plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Error de conexión');
    }
  };

  const handleToggleStatus = async (planId: string) => {
    try {
      const plan = plans.find(p => p.id === planId);
      const response = await useAuthenticatedFetch(`/admin/subscription-plans/${planId}/toggle-status`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlans(plans.map(p => 
            p.id === planId ? { ...p, isActive: data.data.is_active } : p
          ));
          toast.success(data.message);
        } else {
          toast.error(data.message || 'Error al cambiar estado del plan');
        }
      } else {
        toast.error('Error al cambiar estado del plan');
      }
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast.error('Error de conexión');
    }
  };

  const handleTogglePopular = async (planId: string) => {
    try {
      const plan = plans.find(p => p.id === planId);
      const response = await useAuthenticatedFetch(`/admin/subscription-plans/${planId}/popular`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setPlans(plans.map(p => 
          p.id === planId ? { ...p, isPopular: !p.isPopular } : p
        ));
        toast.success(`Plan ${plan?.isPopular ? 'removido de' : 'marcado como'} popular`);
      } else {
        toast.error('Error al cambiar popularidad del plan');
      }
    } catch (error) {
      console.error('Error toggling plan popularity:', error);
      toast.error('Error de conexión');
    }
  };

  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'Mensual';
      case 'yearly': return 'Anual';
      case 'quarterly': return 'Trimestral';
      default: return cycle;
    }
  };

  const getSupportLevelText = (level: string) => {
    switch (level) {
      case 'basic': return 'Básico';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Empresarial';
      default: return level;
    }
  };

  const getSupportLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Planes de Suscripción
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona los planes de suscripción disponibles para los usuarios
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Crear Plan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar planes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterBillingCycle}
              onChange={(e) => setFilterBillingCycle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Todos los ciclos</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-lg border-2 p-6 relative ${
            plan.isPopular ? 'border-emerald-500' : 'border-gray-200'
          }`}>
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Popular
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(plan.id)}
                  className={`p-1 rounded ${plan.isActive ? 'text-emerald-600' : 'text-gray-400'}`}
                >
                  {plan.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

            <div className="mb-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.currency === 'COP' ? '$' : '$'}{plan.price.toLocaleString()}
                </span>
                <span className="text-gray-500 ml-1">
                  /{getBillingCycleText(plan.billingCycle).toLowerCase()}
                </span>
              </div>
              {plan.trialDays > 0 && (
                <p className="text-sm text-emerald-600 mt-1">
                  {plan.trialDays} días de prueba gratuita
                </p>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Fincas:</span>
                <span className="font-medium">{plan.limitations.maxFarms}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Usuarios:</span>
                <span className="font-medium">{plan.limitations.maxUsers}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Almacenamiento:</span>
                <span className="font-medium">{plan.limitations.storageGB} GB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Soporte:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getSupportLevelColor(plan.limitations.supportLevel)}`}>
                  {getSupportLevelText(plan.limitations.supportLevel)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Suscriptores:</span>
                <span className="font-medium">{plan.subscriberCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ingresos:</span>
                <span className="font-medium text-emerald-600">
                  ${plan.revenue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingPlan(plan);
                  setShowPlanModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => handleTogglePopular(plan.id)}
                className={`px-3 py-2 rounded-lg ${
                  plan.isPopular 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeletePlan(plan.id)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron planes de suscripción</p>
          <button 
            onClick={() => setShowPlanModal(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Crear primer plan
          </button>
        </div>
      )}

      {/* Plan Creator Modal */}
      <SubscriptionPlanCreator
        plan={editingPlan}
        isOpen={showPlanModal}
        onSave={(savedPlan) => {
          if (editingPlan) {
            setPlans(plans.map(p => p.id === savedPlan.id ? savedPlan : p));
          } else {
            setPlans([...plans, savedPlan]);
          }
          setShowPlanModal(false);
          setEditingPlan(null);
        }}
        onCancel={() => {
          setShowPlanModal(false);
          setEditingPlan(null);
        }}
      />
    </div>
  );
}