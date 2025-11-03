import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  Users,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import SubscriptionModal from '../../components/admin/SubscriptionModal';
import UserSubscriptionManager from '../../components/admin/UserSubscriptionManager';

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'suspended';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'quarterly';
  paymentMethod: string;
  autoRenew: boolean;
  trialEndsAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSubscriptions() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterBillingCycle, setFilterBillingCycle] = useState<string>('all');
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [showUserSubscriptionManager, setShowUserSubscriptionManager] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } else {
        toast.error('Error al cargar suscripciones');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.planName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || subscription.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || subscription.planName === filterPlan;
    const matchesBillingCycle = filterBillingCycle === 'all' || subscription.billingCycle === filterBillingCycle;
    
    return matchesSearch && matchesStatus && matchesPlan && matchesBillingCycle;
  });

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta suscripción?')) return;
    
    try {
      const response = await useAuthenticatedFetch(`/admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by admin' })
      });
      
      if (response.ok) {
        setSubscriptions(subscriptions.map(sub => 
          sub.id === subscriptionId ? { ...sub, status: 'cancelled', cancelledAt: new Date().toISOString() } : sub
        ));
        toast.success('Suscripción cancelada exitosamente');
      } else {
        toast.error('Error al cancelar suscripción');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Error de conexión');
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/subscriptions/${subscriptionId}/reactivate`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setSubscriptions(subscriptions.map(sub => 
          sub.id === subscriptionId ? { ...sub, status: 'active', cancelledAt: undefined } : sub
        ));
        toast.success('Suscripción reactivada exitosamente');
      } else {
        toast.error('Error al reactivar suscripción');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Error de conexión');
    }
  };

  const handleSubscriptionSave = async (subscriptionData: Partial<Subscription>) => {
    try {
      const url = editingSubscription 
        ? `/api/admin/subscriptions/${editingSubscription.id}`
        : '/api/admin/subscriptions';
      
      const method = editingSubscription ? 'PUT' : 'POST';
      
      const response = await useAuthenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      if (response.ok) {
        const savedSubscription = await response.json();
        
        if (editingSubscription) {
          setSubscriptions(subscriptions.map(s => s.id === editingSubscription.id ? savedSubscription : s));
          toast.success('Suscripción actualizada exitosamente');
        } else {
          setSubscriptions([...subscriptions, savedSubscription]);
          toast.success('Suscripción creada exitosamente');
        }
        
        setShowSubscriptionModal(false);
        setEditingSubscription(null);
      } else {
        toast.error('Error al guardar la suscripción');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast.error('Error al guardar la suscripción');
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowSubscriptionModal(true);
  };

  const handleNewSubscription = () => {
    setEditingSubscription(null);
    setShowSubscriptionModal(true);
  };

  const handleCloseModal = () => {
    setShowSubscriptionModal(false);
    setEditingSubscription(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'cancelled': return 'Cancelada';
      case 'expired': return 'Expirada';
      case 'pending': return 'Pendiente';
      case 'suspended': return 'Suspendida';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'suspended': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
            <Package className="h-6 w-6" />
            Gestión de Suscripciones
          </h1>
          <p className="text-gray-600 mt-1">
            Administra las suscripciones activas de los usuarios
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchSubscriptions}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button 
            onClick={() => setShowUserSubscriptionManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Users className="h-4 w-4" />
            Gestión Avanzada
          </button>
          <button 
            onClick={handleNewSubscription}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nueva Suscripción
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar suscripciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="cancelled">Cancelada</option>
            <option value="expired">Expirada</option>
            <option value="pending">Pendiente</option>
            <option value="suspended">Suspendida</option>
          </select>
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
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedSubscriptions.length === filteredSubscriptions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubscriptions(filteredSubscriptions.map(s => s.id));
                      } else {
                        setSelectedSubscriptions([]);
                      }
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
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
                  Facturación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próximo pago
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
                    <input
                      type="checkbox"
                      checked={selectedSubscriptions.includes(subscription.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubscriptions([...selectedSubscriptions, subscription.id]);
                        } else {
                          setSelectedSubscriptions(selectedSubscriptions.filter(id => id !== subscription.id));
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{subscription.userName}</div>
                        <div className="text-sm text-gray-500">{subscription.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{subscription.planName}</div>
                    <div className="text-sm text-gray-500">{getBillingCycleText(subscription.billingCycle)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                      {getStatusIcon(subscription.status)}
                      {getStatusText(subscription.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${subscription.amount.toLocaleString()} {subscription.currency}
                    </div>
                    <div className="text-sm text-gray-500">{subscription.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {subscription.status === 'active' ? (
                        new Date(subscription.nextBillingDate).toLocaleDateString()
                      ) : (
                        '-'
                      )}
                    </div>
                    {subscription.autoRenew && subscription.status === 'active' && (
                      <div className="text-xs text-green-600">Auto-renovación</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSubscription(subscription)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      {subscription.status === 'active' ? (
                        <button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      ) : subscription.status === 'cancelled' ? (
                        <button
                          onClick={() => handleReactivateSubscription(subscription.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{subscriptions.length}</div>
          <div className="text-sm text-gray-500">Total suscripciones</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {subscriptions.filter(s => s.status === 'active').length}
          </div>
          <div className="text-sm text-gray-500">Suscripciones activas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            ${subscriptions
              .filter(s => s.status === 'active')
              .reduce((sum, s) => sum + s.amount, 0)
              .toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Ingresos mensuales</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {subscriptions.filter(s => s.status === 'cancelled').length}
          </div>
          <div className="text-sm text-gray-500">Suscripciones canceladas</div>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={handleCloseModal}
        subscription={editingSubscription}
        onSave={handleSubscriptionSave}
      />

      {/* User Subscription Manager */}
      <UserSubscriptionManager
        isOpen={showUserSubscriptionManager}
        onClose={() => setShowUserSubscriptionManager(false)}
      />
    </div>
  );
}