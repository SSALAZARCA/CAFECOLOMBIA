import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { wompiService, PaymentData, PaymentMethod } from '@/services/wompiService';
import { toast } from 'sonner';

interface PaymentProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  paymentData: PaymentData;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  paymentData
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'methods' | 'card' | 'processing' | 'success' | 'error'>('methods');
  const [cardData, setCardData] = useState({
    number: '',
    cvc: '',
    expMonth: '',
    expYear: '',
    cardHolder: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await wompiService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error);
      toast.error('Error al cargar métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'CARD':
        return <CreditCard className="h-6 w-6" />;
      case 'NEQUI':
        return <Smartphone className="h-6 w-6" />;
      case 'PSE':
      case 'BANCOLOMBIA_TRANSFER':
        return <Building2 className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const validateCardData = () => {
    const newErrors: Record<string, string> = {};

    if (!cardData.number || cardData.number.length < 13) {
      newErrors.number = 'Número de tarjeta inválido';
    }
    if (!cardData.cvc || cardData.cvc.length < 3) {
      newErrors.cvc = 'CVC inválido';
    }
    if (!cardData.expMonth || !cardData.expYear) {
      newErrors.exp = 'Fecha de vencimiento inválida';
    }
    if (!cardData.cardHolder.trim()) {
      newErrors.cardHolder = 'Nombre del titular requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      setStep('processing');

      let finalPaymentData = { ...paymentData };

      // Si es tarjeta de crédito, crear token primero
      if (selectedMethod === 'CARD') {
        if (!validateCardData()) {
          setStep('card');
          return;
        }

        const cardToken = await wompiService.createCardToken(cardData);
        finalPaymentData.paymentMethod = cardToken;
      } else {
        finalPaymentData.paymentMethod = selectedMethod;
      }

      const result = await wompiService.createPayment(finalPaymentData);

      if (result.status === 'APPROVED') {
        setStep('success');
        onSuccess(result.id);
        toast.success('Pago procesado exitosamente');
      } else if (result.checkoutUrl) {
        // Redirigir a la URL de checkout de Wompi
        window.open(result.checkoutUrl, '_blank');
        onClose();
      } else {
        throw new Error(result.errorMessage || 'Error en el procesamiento del pago');
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      setStep('error');
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData(prev => ({ ...prev, number: formatted.replace(/\s/g, '') }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Procesar Pago
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resumen del pago */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Resumen del Pago</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Descripción:</span>
                <span className="text-gray-900">{paymentData.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto:</span>
                <span className="text-gray-900 font-medium">
                  ${paymentData.amount.toLocaleString()} {paymentData.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Referencia:</span>
                <span className="text-gray-900">{paymentData.reference}</span>
              </div>
            </div>
          </div>

          {/* Métodos de pago */}
          {step === 'methods' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Selecciona un método de pago</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.filter(method => method.enabled).map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedMethod(method.type);
                        if (method.type === 'CARD') {
                          setStep('card');
                        } else {
                          processPayment();
                        }
                      }}
                      className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
                    >
                      <div className="text-amber-600 mr-3">
                        {getMethodIcon(method.type)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">{method.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formulario de tarjeta */}
          {step === 'card' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Datos de la Tarjeta</h3>
                <button
                  onClick={() => setStep('methods')}
                  className="text-amber-600 hover:text-amber-700 text-sm"
                >
                  Cambiar método
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de tarjeta
                  </label>
                  <input
                    type="text"
                    value={formatCardNumber(cardData.number)}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.number ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.number && (
                    <p className="text-red-600 text-xs mt-1">{errors.number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del titular
                  </label>
                  <input
                    type="text"
                    value={cardData.cardHolder}
                    onChange={(e) => setCardData(prev => ({ ...prev, cardHolder: e.target.value.toUpperCase() }))}
                    placeholder="NOMBRE APELLIDO"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.cardHolder ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.cardHolder && (
                    <p className="text-red-600 text-xs mt-1">{errors.cardHolder}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mes
                    </label>
                    <select
                      value={cardData.expMonth}
                      onChange={(e) => setCardData(prev => ({ ...prev, expMonth: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        errors.exp ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año
                    </label>
                    <select
                      value={cardData.expYear}
                      onChange={(e) => setCardData(prev => ({ ...prev, expYear: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        errors.exp ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">AAAA</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardData.cvc}
                      onChange={(e) => setCardData(prev => ({ ...prev, cvc: e.target.value.replace(/\D/g, '') }))}
                      placeholder="123"
                      maxLength={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        errors.cvc ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                {errors.exp && (
                  <p className="text-red-600 text-xs">{errors.exp}</p>
                )}
                {errors.cvc && (
                  <p className="text-red-600 text-xs">{errors.cvc}</p>
                )}
              </div>

              <button
                onClick={processPayment}
                disabled={loading}
                className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Procesar Pago
              </button>
            </div>
          )}

          {/* Procesando */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Procesando Pago
              </h3>
              <p className="text-gray-600">
                Por favor espera mientras procesamos tu pago...
              </p>
            </div>
          )}

          {/* Éxito */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Pago Exitoso!
              </h3>
              <p className="text-gray-600 mb-4">
                Tu pago ha sido procesado correctamente.
              </p>
              <button
                onClick={onClose}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error en el Pago
              </h3>
              <p className="text-gray-600 mb-4">
                Hubo un problema al procesar tu pago. Por favor intenta nuevamente.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setStep('methods')}
                  className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Intentar Nuevamente
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessor;