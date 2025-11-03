import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Package } from 'lucide-react';
import { z } from 'zod';
import { useAdminStore } from '../../stores/adminStore';

// Validation schema
const subscriptionSchema = z.object({
  userId: z.string().min(1, 'Debe seleccionar un usuario'),
  planId: z.string().min(1, 'Debe seleccionar un plan'),
  billingCycle: z.enum(['monthly', 'yearly', 'quarterly']),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  amount: z.number().min(0, 'El monto debe ser mayor a 0'),
  currency: z.string().default('COP'),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  autoRenew: z.boolean().default(true),
  status: z.enum(['active', 'cancelled', 'expired', 'pending', 'suspended']),
  notes: z.string().optional()
});

const editSubscriptionSchema = subscriptionSchema.partial();

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
  notes?: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
  onSave: (subscription: Partial<Subscription>) => void;
}

export default function SubscriptionModal({ isOpen, onClose, subscription, onSave }: SubscriptionModalProps) {
  const { authenticatedFetch } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number; billingCycle: string }>>([]);

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    planId: '',
    billingCycle: 'monthly' as const,
    startDate: '',
    endDate: '',
    amount: 0,
    currency: 'COP',
    paymentMethod: '',
    autoRenew: true,
    status: 'active' as const,
    notes: ''
  });

  // Load users and plans for selection
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadPlans();
    }
  }, [isOpen]);

  // Initialize form data when subscription changes
  useEffect(() => {
    if (subscription) {
      setFormData({
        userId: subscription.userId || '',
        planId: subscription.planId || '',
        billingCycle: subscription.billingCycle || 'monthly',
        startDate: subscription.startDate ? subscription.startDate.split('T')[0] : '',
        endDate: subscription.endDate ? subscription.endDate.split('T')[0] : '',
        amount: subscription.amount || 0,
        currency: subscription.currency || 'COP',
        paymentMethod: subscription.paymentMethod || '',
        autoRenew: subscription.autoRenew ?? true,
        status: subscription.status || 'active',
        notes: subscription.notes || ''
      });
    } else {
      setFormData({
        userId: '',
        planId: '',
        billingCycle: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        amount: 0,
        currency: 'COP',
        paymentMethod: '',
        autoRenew: true,
        status: 'active',
        notes: ''
      });
    }
    setErrors({});
  }, [subscription]);

  const loadUsers = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        planId,
        amount: selectedPlan.price,
        billingCycle: selectedPlan.billingCycle as 'monthly' | 'yearly' | 'quarterly'
      }));
      
      // Calculate end date based on billing cycle
      if (formData.startDate) {
        const startDate = new Date(formData.startDate);
        let endDate = new Date(startDate);
        
        switch (selectedPlan.billingCycle) {
          case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case 'quarterly':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
          case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        }
        
        setFormData(prev => ({
          ...prev,
          endDate: endDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  const handleStartDateChange = (startDate: string) => {
    setFormData(prev => ({ ...prev, startDate }));
    
    // Recalculate end date if plan is selected
    if (formData.planId && startDate) {
      const selectedPlan = plans.find(p => p.id === formData.planId);
      if (selectedPlan) {
        const start = new Date(startDate);
        let endDate = new Date(start);
        
        switch (selectedPlan.billingCycle) {
          case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case 'quarterly':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
          case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        }
        
        setFormData(prev => ({
          ...prev,
          endDate: endDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const schema = subscription ? editSubscriptionSchema : subscriptionSchema;
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

  const selectedUser = users.find(u => u.id === formData.userId);
  const selectedPlan = plans.find(p => p.id === formData.planId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {subscription ? 'Editar Suscripción' : 'Nueva Suscripción'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User and Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario *
              </label>
              <select
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.userId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!!subscription}
              >
                <option value="">Seleccionar usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.userId && <p className="text-red-500 text-sm mt-1">{errors.userId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan de Suscripción *
              </label>
              <select
                value={formData.planId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.planId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price.toLocaleString()} ({plan.billingCycle})
                  </option>
                ))}
              </select>
              {errors.planId && <p className="text-red-500 text-sm mt-1">{errors.planId}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciclo de Facturación
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => handleInputChange('billingCycle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          {/* Payment and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar método</option>
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="debit_card">Tarjeta de Débito</option>
                <option value="bank_transfer">Transferencia Bancaria</option>
                <option value="pse">PSE</option>
                <option value="nequi">Nequi</option>
                <option value="daviplata">Daviplata</option>
              </select>
              {errors.paymentMethod && <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="active">Activa</option>
                <option value="pending">Pendiente</option>
                <option value="suspended">Suspendida</option>
                <option value="cancelled">Cancelada</option>
                <option value="expired">Expirada</option>
              </select>
            </div>
          </div>

          {/* Auto Renew */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRenew"
              checked={formData.autoRenew}
              onChange={(e) => handleInputChange('autoRenew', e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="autoRenew" className="ml-2 text-sm text-gray-700">
              Renovación automática
            </label>
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
              placeholder="Información adicional sobre la suscripción..."
            />
          </div>

          {/* Summary */}
          {selectedUser && selectedPlan && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Resumen de la Suscripción</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Usuario: {selectedUser.name} ({selectedUser.email})</div>
                <div>Plan: {selectedPlan.name}</div>
                <div>Monto: ${formData.amount.toLocaleString()} {formData.currency}</div>
                <div>Ciclo: {formData.billingCycle === 'monthly' ? 'Mensual' : formData.billingCycle === 'quarterly' ? 'Trimestral' : 'Anual'}</div>
                <div>Período: {formData.startDate} - {formData.endDate}</div>
              </div>
            </div>
          )}

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
              {subscription ? 'Actualizar' : 'Crear'} Suscripción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}