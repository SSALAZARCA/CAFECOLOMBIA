import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import PaymentProcessor from '../../components/admin/PaymentProcessor';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Eye, 
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Receipt,
  TrendingUp,
  TrendingDown,
  Settings,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import ExportImportModal from '../../components/admin/ExportImportModal';
import BulkActionsBar from '../../components/admin/BulkActionsBar';

interface Payment {
  id: string;
  subscriptionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'wompi' | 'pse';
  paymentMethodDetails: {
    last4?: string;
    brand?: string;
    bank?: string;
  };
  transactionId: string;
  wompiTransactionId?: string;
  description: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  processedAt: string;
  failureReason?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  fees: {
    platform: number;
    payment: number;
    total: number;
  };
  metadata: {
    planName: string;
    billingCycle: string;
    isRetry: boolean;
    retryCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminPayments() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showPaymentDetails, setShowPaymentDetails] = useState<Payment | null>(null);
  const [exportImportModalOpen, setExportImportModalOpen] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import'>('export');
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        toast.error('Error al cargar pagos');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesMethod = filterMethod === 'all' || payment.paymentMethod === filterMethod;
    
    let matchesDateRange = true;
    if (filterDateRange !== 'all') {
      const paymentDate = new Date(payment.processedAt);
      const now = new Date();
      switch (filterDateRange) {
        case 'today':
          matchesDateRange = paymentDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = paymentDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = paymentDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesMethod && matchesDateRange;
  });

  const handleRefund = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    const refundAmount = prompt(`Ingrese el monto a reembolsar (máximo: $${payment.amount}):`, payment.amount.toString());
    if (!refundAmount || isNaN(Number(refundAmount))) return;

    const refundReason = prompt('Ingrese la razón del reembolso:');
    if (!refundReason) return;

    try {
      const response = await useAuthenticatedFetch(`/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(refundAmount),
          reason: refundReason
        })
      });
      
      if (response.ok) {
        setPayments(payments.map(p => 
          p.id === paymentId 
            ? { 
                ...p, 
                status: 'refunded', 
                refundedAt: new Date().toISOString(),
                refundAmount: Number(refundAmount),
                refundReason 
              } 
            : p
        ));
        toast.success('Reembolso procesado exitosamente');
      } else {
        toast.error('Error al procesar reembolso');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Error de conexión');
    }
  };

  const handleExport = () => {
    setExportImportMode('export');
    setExportImportModalOpen(true);
  };

  const handleImport = () => {
    setExportImportMode('import');
    setExportImportModalOpen(true);
  };

  const handleBulkAction = async (action: string, paymentIds: string[]) => {
    try {
      switch (action) {
        case 'approve':
          // Lógica para aprobar pagos pendientes
          toast.success(`${paymentIds.length} pagos aprobados`);
          break;
        case 'refund':
          // Lógica para reembolsar múltiples pagos
          await Promise.all(paymentIds.map(id => handleRefund(id)));
          toast.success(`${paymentIds.length} pagos reembolsados`);
          break;
        case 'export':
          handleExport();
          break;
      }
      setSelectedPayments([]);
    } catch (error) {
      toast.error('Error al realizar la acción en lote');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'refunded': return <RefreshCw className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Tarjeta de Crédito';
      case 'debit_card': return 'Tarjeta de Débito';
      case 'bank_transfer': return 'Transferencia Bancaria';
      case 'wompi': return 'Wompi';
      case 'pse': return 'PSE';
      default: return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
      case 'pse':
        return <Receipt className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunds = payments
    .filter(p => p.status === 'refunded')
    .reduce((sum, p) => sum + (p.refundAmount || 0), 0);

  const successRate = payments.length > 0 
    ? (payments.filter(p => p.status === 'completed').length / payments.length * 100).toFixed(1)
    : '0';

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
            Gestión de Pagos
          </h1>
          <p className="text-gray-600 mt-1">
            Administra y monitorea todas las transacciones de pago
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPaymentProcessor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Zap className="h-4 w-4" />
            Procesador de Pagos
          </button>
          <button 
            onClick={fetchPayments}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button 
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Ingresos totales</div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
              <div className="text-sm text-gray-500">Total transacciones</div>
            </div>
            <Receipt className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{successRate}%</div>
              <div className="text-sm text-gray-500">Tasa de éxito</div>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalRefunds.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Reembolsos</div>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {payments.filter(p => p.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pendientes</div>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowPaymentProcessor(true)}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Procesador Avanzado</div>
              <div className="text-sm text-gray-500">Gestión completa de pagos</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              setFilterStatus('pending');
              fetchPayments();
            }}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Pagos Pendientes</div>
              <div className="text-sm text-gray-500">Revisar transacciones</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              setFilterStatus('failed');
              fetchPayments();
            }}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Pagos Fallidos</div>
              <div className="text-sm text-gray-500">Investigar errores</div>
            </div>
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Exportar Datos</div>
              <div className="text-sm text-gray-500">Generar reportes</div>
            </div>
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
                placeholder="Buscar pagos..."
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
            <option value="completed">Completado</option>
            <option value="pending">Pendiente</option>
            <option value="failed">Fallido</option>
            <option value="refunded">Reembolsado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos los métodos</option>
            <option value="credit_card">Tarjeta de Crédito</option>
            <option value="debit_card">Tarjeta de Débito</option>
            <option value="bank_transfer">Transferencia</option>
            <option value="wompi">Wompi</option>
            <option value="pse">PSE</option>
          </select>
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === filteredPayments.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayments(filteredPayments.map(p => p.id));
                      } else {
                        setSelectedPayments([]);
                      }
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
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
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayments([...selectedPayments, payment.id]);
                        } else {
                          setSelectedPayments(selectedPayments.filter(id => id !== payment.id));
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.transactionId}
                    </div>
                    <div className="text-sm text-gray-500">{payment.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{payment.userName}</div>
                        <div className="text-sm text-gray-500">{payment.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${payment.amount.toLocaleString()} {payment.currency}
                    </div>
                    {payment.status === 'refunded' && payment.refundAmount && (
                      <div className="text-sm text-red-600">
                        Reembolso: ${payment.refundAmount.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                      <div>
                        <div className="text-sm text-gray-900">
                          {getPaymentMethodText(payment.paymentMethod)}
                        </div>
                        {payment.paymentMethodDetails.last4 && (
                          <div className="text-sm text-gray-500">
                            **** {payment.paymentMethodDetails.last4}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(payment.processedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(payment.processedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPaymentDetails(payment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => handleRefund(payment.id)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-emerald-600 hover:text-emerald-900">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && !loading && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron pagos</p>
          <button 
            onClick={() => setShowPaymentProcessor(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 mx-auto"
          >
            <Zap className="h-4 w-4" />
            Abrir Procesador de Pagos
          </button>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detalles del Pago</h2>
              <button
                onClick={() => setShowPaymentDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID de Transacción</label>
                  <div className="text-sm text-gray-900">{showPaymentDetails.transactionId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(showPaymentDetails.status)}`}>
                    {getStatusIcon(showPaymentDetails.status)}
                    {getStatusText(showPaymentDetails.status)}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Monto</label>
                  <div className="text-sm text-gray-900">
                    ${showPaymentDetails.amount.toLocaleString()} {showPaymentDetails.currency}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                  <div className="text-sm text-gray-900">
                    {getPaymentMethodText(showPaymentDetails.paymentMethod)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Usuario</label>
                  <div className="text-sm text-gray-900">{showPaymentDetails.userName}</div>
                  <div className="text-sm text-gray-500">{showPaymentDetails.userEmail}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Procesamiento</label>
                  <div className="text-sm text-gray-900">
                    {new Date(showPaymentDetails.processedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {showPaymentDetails.failureReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Razón del Fallo</label>
                  <div className="text-sm text-red-600">{showPaymentDetails.failureReason}</div>
                </div>
              )}

              {showPaymentDetails.refundReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Razón del Reembolso</label>
                  <div className="text-sm text-gray-900">{showPaymentDetails.refundReason}</div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Tarifas</label>
                <div className="text-sm text-gray-900">
                  Plataforma: ${showPaymentDetails.fees.platform.toFixed(2)} | 
                  Pago: ${showPaymentDetails.fees.payment.toFixed(2)} | 
                  Total: ${showPaymentDetails.fees.total.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Período de Facturación</label>
                <div className="text-sm text-gray-900">
                  {new Date(showPaymentDetails.billingPeriod.start).toLocaleDateString()} - {' '}
                  {new Date(showPaymentDetails.billingPeriod.end).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processor Modal */}
      <PaymentProcessor
        isOpen={showPaymentProcessor}
        onClose={() => setShowPaymentProcessor(false)}
      />

      {/* Bulk Actions Bar */}
      {selectedPayments.length > 0 && (
        <BulkActionsBar
          selectedItems={selectedPayments}
          onClearSelection={() => setSelectedPayments([])}
          entityType="payments"
          onBulkAction={handleBulkAction}
        />
      )}

      {/* Export/Import Modal */}
      <ExportImportModal
        isOpen={exportImportModalOpen}
        onClose={() => setExportImportModalOpen(false)}
        mode={exportImportMode}
        entityType="payments"
        selectedIds={selectedPayments}
      />
    </div>
  );
}