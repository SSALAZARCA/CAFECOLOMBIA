import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Download,
  Upload,
  MoreVertical,
  Crown,
  Gift,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface UserSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'suspended';
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  autoRenew: boolean;
  trialEndsAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  paymentMethod: string;
  lastPaymentDate?: string;
  failedPayments: number;
  metadata: {
    source: string;
    couponCode?: string;
    discountAmount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  isActive: boolean;
}

interface UserSubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSubscriptionManager: React.FC<UserSubscriptionManagerProps> = ({ isOpen, onClose }) => {
  const { useAuthenticatedFetch } = useAdminStore();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    userEmail: '',
    planId: '',
    billingCycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    autoRenew: true,
    trialDays: 0
  });
  const [cancelForm, setCancelForm] = useState({
    reason: '',
    immediate: false,
    refund: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptions();
      fetchPlans();
    }
  }, [isOpen]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await useAuthenticatedFetch('/admin/subscriptions', {
        method: 'GET',
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          plan: planFilter !== 'all' ? planFilter : undefined,
          search: searchTerm || undefined
        }
      });

      if (response.success) {
        setSubscriptions(response.data);
      } else {
        toast.error('Error al cargar las suscripciones');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error al cargar las suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await useAuthenticatedFetch('/admin/subscription-plans', {
        method: 'GET'
      });

      if (response.success) {
        setPlans(response.data.filter((plan: SubscriptionPlan) => plan.isActive));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleAssignSubscription = async () => {
    try {
      const response = await useAuthenticatedFetch('/admin/subscriptions', {
        method: 'POST',
        body: JSON.stringify(assignForm)
      });

      if (response.success) {
        toast.success('Suscripción asignada exitosamente');
        setShowAssignModal(false);
        setAssignForm({
          userEmail: '',
          planId: '',
          billingCycle: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          autoRenew: true,
          trialDays: 0
        });
        fetchSubscriptions();
      } else {
        toast.error('Error al asignar la suscripción');
      }
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Error al asignar la suscripción');
    }
  };

  const handleUpgradeSubscription = async (subscriptionId: string, newPlanId: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/subscriptions/${subscriptionId}/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ planId: newPlanId })
      });

      if (response.success) {
        toast.success('Suscripción actualizada exitosamente');
        setShowUpgradeModal(false);
        fetchSubscriptions();
      } else {
        toast.error('Error al actualizar la suscripción');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Error al actualizar la suscripción');
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      const response = await useAuthenticatedFetch(`/admin/subscriptions/${selectedSubscription.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(cancelForm)
      });

      if (response.success) {
        toast.success('Suscripción cancelada exitosamente');
        setShowCancelModal(false);
        setCancelForm({ reason: '', immediate: false, refund: false });
        setSelectedSubscription(null);
        fetchSubscriptions();
      } else {
        toast.error('Error al cancelar la suscripción');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Error al cancelar la suscripción');
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/subscriptions/${subscriptionId}/reactivate`, {
        method: 'POST'
      });

      if (response.success) {
        toast.success('Suscripción reactivada exitosamente');
        fetchSubscriptions();
      } else {
        toast.error('Error al reactivar la suscripción');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Error al reactivar la suscripción');
    }
  };

  const getStatusColor = (status: UserSubscription['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: UserSubscription['status']) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'expired':
        return 'Expirada';
      case 'suspended':
        return 'Suspendida';
      default:
        return status;
    }
  };

  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case 'monthly':
        return 'Mensual';
      case 'quarterly':
        return 'Trimestral';
      case 'yearly':
        return 'Anual';
      default:
        return cycle;
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.planName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Suscripciones de Usuarios
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Administra las suscripciones de los usuarios del sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Asignar Suscripción
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por usuario, email o plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Canceladas</option>
                <option value="expired">Expiradas</option>
                <option value="suspended">Suspendidas</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos los planes</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <button
                onClick={fetchSubscriptions}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facturación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.userName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.userEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.planName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getBillingCycleText(subscription.billingCycle)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      {getStatusText(subscription.status)}
                    </span>
                    {subscription.autoRenew && subscription.status === 'active' && (
                      <div className="text-xs text-green-600 mt-1">
                        Auto-renovación activa
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>Inicio: {new Date(subscription.startDate).toLocaleDateString('es-CO')}</div>
                      <div>Fin: {new Date(subscription.endDate).toLocaleDateString('es-CO')}</div>
                      {subscription.nextBillingDate && (
                        <div className="text-emerald-600">
                          Próximo: {new Date(subscription.nextBillingDate).toLocaleDateString('es-CO')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        ${subscription.amount.toLocaleString()} {subscription.currency}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.paymentMethod}
                      </div>
                      {subscription.failedPayments > 0 && (
                        <div className="text-xs text-red-600">
                          {subscription.failedPayments} pagos fallidos
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSubscription(subscription)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {subscription.status === 'active' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowUpgradeModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Actualizar plan"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowCancelModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Cancelar suscripción"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {(subscription.status === 'cancelled' || subscription.status === 'expired') && (
                        <button
                          onClick={() => handleReactivateSubscription(subscription.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Reactivar suscripción"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSubscriptions.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron suscripciones</p>
            </div>
          )}
        </div>

        {/* Assign Subscription Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Asignar Nueva Suscripción
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email del usuario
                  </label>
                  <input
                    type="email"
                    value={assignForm.userEmail}
                    onChange={(e) => setAssignForm({...assignForm, userEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan de suscripción
                  </label>
                  <select
                    value={assignForm.planId}
                    onChange={(e) => setAssignForm({...assignForm, planId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Seleccionar plan</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price.toLocaleString()} {plan.currency}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciclo de facturación
                  </label>
                  <select
                    value={assignForm.billingCycle}
                    onChange={(e) => setAssignForm({...assignForm, billingCycle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={assignForm.startDate}
                    onChange={(e) => setAssignForm({...assignForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Días de prueba gratuita
                  </label>
                  <input
                    type="number"
                    value={assignForm.trialDays}
                    onChange={(e) => setAssignForm({...assignForm, trialDays: parseInt(e.target.value) || 0})}
                    min="0"
                    max="90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={assignForm.autoRenew}
                    onChange={(e) => setAssignForm({...assignForm, autoRenew: e.target.checked})}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="autoRenew" className="ml-2 text-sm text-gray-700">
                    Activar auto-renovación
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignSubscription}
                  disabled={!assignForm.userEmail || !assignForm.planId}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  Asignar Suscripción
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Subscription Modal */}
        {showCancelModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancelar Suscripción
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    ¿Estás seguro de que deseas cancelar la suscripción de <strong>{selectedSubscription.userName}</strong>?
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón de la cancelación
                  </label>
                  <textarea
                    value={cancelForm.reason}
                    onChange={(e) => setCancelForm({...cancelForm, reason: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Describe la razón de la cancelación..."
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="immediate"
                      checked={cancelForm.immediate}
                      onChange={(e) => setCancelForm({...cancelForm, immediate: e.target.checked})}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="immediate" className="ml-2 text-sm text-gray-700">
                      Cancelar inmediatamente (sin esperar al final del período)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="refund"
                      checked={cancelForm.refund}
                      onChange={(e) => setCancelForm({...cancelForm, refund: e.target.checked})}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="refund" className="ml-2 text-sm text-gray-700">
                      Procesar reembolso proporcional
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={!cancelForm.reason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSubscriptionManager;