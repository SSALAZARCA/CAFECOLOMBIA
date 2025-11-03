import { useState, useCallback } from 'react';
import { wompiService, PaymentData, TransactionStatus } from '@/services/wompiService';
import { toast } from 'sonner';

export interface PaymentHookResult {
  processPayment: (paymentData: PaymentData) => Promise<string>;
  checkPaymentStatus: (transactionId: string) => Promise<TransactionStatus>;
  processRefund: (transactionId: string, amount?: number) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export const usePayments = (): PaymentHookResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (paymentData: PaymentData): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const result = await wompiService.createPayment(paymentData);
      
      if (result.status === 'APPROVED') {
        toast.success('Pago procesado exitosamente');
        return result.id;
      } else if (result.status === 'PENDING') {
        toast.info('Pago pendiente de confirmación');
        return result.id;
      } else {
        throw new Error(result.errorMessage || 'Error en el procesamiento del pago');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido en el pago';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async (transactionId: string): Promise<TransactionStatus> => {
    try {
      setLoading(true);
      setError(null);

      const status = await wompiService.getTransactionStatus(transactionId);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al consultar el estado del pago';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processRefund = useCallback(async (transactionId: string, amount?: number): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      const result = await wompiService.processRefund(transactionId, amount);
      toast.success('Reembolso procesado exitosamente');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar el reembolso';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    processPayment,
    checkPaymentStatus,
    processRefund,
    loading,
    error,
  };
};

// Hook para generar datos de pago para suscripciones
export const useSubscriptionPayment = () => {
  const { processPayment, loading, error } = usePayments();

  const createSubscriptionPayment = useCallback(async (
    subscriptionData: {
      planId: string;
      planName: string;
      amount: number;
      userId: string;
      userEmail: string;
      userName: string;
      userPhone?: string;
      userDocument?: string;
      userDocumentType?: 'CC' | 'CE' | 'NIT' | 'PP';
    }
  ): Promise<string> => {
    const paymentData: PaymentData = {
      amount: subscriptionData.amount,
      currency: 'COP',
      reference: `SUB_${subscriptionData.planId}_${subscriptionData.userId}_${Date.now()}`,
      description: `Suscripción a ${subscriptionData.planName}`,
      customerEmail: subscriptionData.userEmail,
      customerName: subscriptionData.userName,
      customerPhone: subscriptionData.userPhone,
      customerDocument: subscriptionData.userDocument,
      customerDocumentType: subscriptionData.userDocumentType,
      redirectUrl: `${window.location.origin}/subscription/success`,
    };

    return await processPayment(paymentData);
  }, [processPayment]);

  return {
    createSubscriptionPayment,
    loading,
    error,
  };
};

// Hook para pagos de productos/servicios
export const useProductPayment = () => {
  const { processPayment, loading, error } = usePayments();

  const createProductPayment = useCallback(async (
    productData: {
      productId: string;
      productName: string;
      amount: number;
      quantity: number;
      userId: string;
      userEmail: string;
      userName: string;
      userPhone?: string;
      userDocument?: string;
      userDocumentType?: 'CC' | 'CE' | 'NIT' | 'PP';
    }
  ): Promise<string> => {
    const paymentData: PaymentData = {
      amount: productData.amount * productData.quantity,
      currency: 'COP',
      reference: `PROD_${productData.productId}_${productData.userId}_${Date.now()}`,
      description: `${productData.productName} (x${productData.quantity})`,
      customerEmail: productData.userEmail,
      customerName: productData.userName,
      customerPhone: productData.userPhone,
      customerDocument: productData.userDocument,
      customerDocumentType: productData.userDocumentType,
      redirectUrl: `${window.location.origin}/payment/success`,
    };

    return await processPayment(paymentData);
  }, [processPayment]);

  return {
    createProductPayment,
    loading,
    error,
  };
};