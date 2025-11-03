import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  CreditCard, 
  DollarSign, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  User,
  Calendar,
  Receipt,
  Download,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Banknote,
  Smartphone,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  transactionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'card' | 'pse' | 'nequi' | 'bancolombia' | 'daviplata';
  subscriptionPlanId?: string;
  subscriptionPlanName?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  wompiTransactionId?: string;
  wompiReference?: string;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Record<string, any>;
}

interface PaymentProcessorProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({ isOpen, onClose }) => {
  const { useAuthenticatedFetch } = useAdminStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen, statusFilter, methodFilter, dateRange]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await useAuthenticatedFetch('/admin/payments', {
        method: 'GET',
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          method: methodFilter !== 'all' ? methodFilter : undefined,
          dateRange,
          search: searchTerm || undefined
        }
      });

      if (response.success) {
        setPayments(response.data);
      } else {
        toast.error('Error al cargar los pagos');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPayment = async (paymentId: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/payments/${paymentId}/refresh`, {
        method: 'POST'
      });

      if (response.success) {
        toast.success('Estado del pago actualizado');
        fetchPayments();
      } else {
        toast.error('Error al actualizar el estado del pago');
      }
    } catch (error) {
      console.error('Error refreshing payment:', error);
      toast.error('Error al actualizar el estado del pago');
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedPayment) return;

    setProcessingRefund(true);
    try {
      const response = await useAuthenticatedFetch(`/admin/payments/${selectedPayment.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason: refundReason
        })
      });

      if (response.success) {
        toast.success('Reembolso procesado exitosamente');
        setShowRefundModal(false);
        setRefundAmount('');
        setRefundReason('');
        setSelectedPayment(null);
        fetchPayments();
      } else {
        toast.error('Error al procesar el reembolso');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Error al procesar el reembolso');
    } finally {
      setProcessingRefund(false);
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      case 'refunded':
        return 'Reembolsado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method: Payment['paymentMethod']) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'pse':
        return <Building className="h-4 w-4" />;
      case 'nequi':
      case 'bancolombia':
      case 'daviplata':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (method: Payment['paymentMethod']) => {
    switch (method) {
      case 'card':
        return 'Tarjeta';
      case 'pse':
        return 'PSE';
      case 'nequi':
        return 'Nequi';
      case 'bancolombia':
        return 'Bancolombia';
      case 'daviplata':
        return 'Daviplata';
      default:
        return method;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
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
              <DollarSign className="h-5 w-5" />
              Procesador de Pagos
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona pagos, reembolsos y transacciones de Wompi
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por email, nombre o ID de transacción..."
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
                <option value="pending">Pendientes</option>
                <option value="completed">Completados</option>
                <option value="failed">Fallidos</option>
                <option value="refunded">Reembolsados</option>
                <option value="cancelled">Cancelados</option>
              </select>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos los métodos</option>
                <option value="card">Tarjeta</option>
                <option value="pse">PSE</option>
                <option value="nequi">Nequi</option>
                <option value="bancolombia">Bancolombia</option>
                <option value="daviplata">Daviplata</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="1d">Último día</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="all">Todos</option>
              </select>
              <button
                onClick={fetchPayments}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transacción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.transactionId}
                      </div>
                      {payment.wompiTransactionId && (
                        <div className="text-xs text-gray-500">
                          Wompi: {payment.wompiTransactionId}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.userName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.userEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${payment.amount.toLocaleString()} {payment.currency}
                    </div>
                    {payment.subscriptionPlanName && (
                      <div className="text-xs text-gray-500">
                        {payment.subscriptionPlanName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                      <span className="text-sm text-gray-900">
                        {getPaymentMethodText(payment.paymentMethod)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                    {payment.failureReason && (
                      <div className="text-xs text-red-500 mt-1">
                        {payment.failureReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRefreshPayment(payment.id)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Actualizar estado"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setRefundAmount(payment.amount.toString());
                            setShowRefundModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Procesar reembolso"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && !loading && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron pagos</p>
            </div>
          )}
        </div>

        {/* Refund Modal */}
        {showRefundModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Procesar Reembolso
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto a reembolsar
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={selectedPayment.amount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: ${selectedPayment.amount.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón del reembolso
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Describe la razón del reembolso..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessRefund}
                  disabled={processingRefund || !refundAmount || !refundReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processingRefund ? 'Procesando...' : 'Procesar Reembolso'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessor;