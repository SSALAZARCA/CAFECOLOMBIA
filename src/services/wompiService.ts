// Servicio para integración con Wompi (Pasarela de pagos colombiana)
export interface WompiConfig {
  publicKey: string;
  privateKey: string;
  environment: 'sandbox' | 'production';
  currency: string;
}

export interface PaymentMethod {
  id: string;
  type: 'CARD' | 'NEQUI' | 'PSE' | 'BANCOLOMBIA_TRANSFER';
  name: string;
  logo: string;
  enabled: boolean;
}

export interface PaymentData {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerDocument?: string;
  customerDocumentType?: 'CC' | 'CE' | 'NIT' | 'PP';
  redirectUrl: string;
  paymentMethod?: string;
}

export interface PaymentResponse {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  authorizationCode?: string;
  errorMessage?: string;
  checkoutUrl?: string;
  createdAt: string;
}

export interface TransactionStatus {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  authorizationCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

class WompiService {
  private config: WompiConfig;
  private baseUrl: string;

  constructor(config: WompiConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production' 
      ? 'https://production.wompi.co/v1' 
      : 'https://sandbox.wompi.co/v1';
  }

  // Obtener métodos de pago disponibles
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_methods`, {
        headers: {
          'Authorization': `Bearer ${this.config.publicKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener métodos de pago: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error al obtener métodos de pago:', error);
      throw error;
    }
  }

  // Crear token de tarjeta de crédito
  async createCardToken(cardData: {
    number: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.publicKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: cardData.number,
          cvc: cardData.cvc,
          exp_month: cardData.expMonth,
          exp_year: cardData.expYear,
          card_holder: cardData.cardHolder,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al crear token de tarjeta: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.id;
    } catch (error) {
      console.error('Error al crear token de tarjeta:', error);
      throw error;
    }
  }

  // Crear transacción de pago
  async createPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.privateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_in_cents: Math.round(paymentData.amount * 100),
          currency: paymentData.currency,
          reference: paymentData.reference,
          customer_email: paymentData.customerEmail,
          customer_data: {
            full_name: paymentData.customerName,
            phone_number: paymentData.customerPhone,
            legal_id: paymentData.customerDocument,
            legal_id_type: paymentData.customerDocumentType,
          },
          redirect_url: paymentData.redirectUrl,
          payment_method: paymentData.paymentMethod ? {
            type: paymentData.paymentMethod,
          } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al crear pago: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.data.id,
        status: data.data.status,
        reference: data.data.reference,
        amount: data.data.amount_in_cents / 100,
        currency: data.data.currency,
        paymentMethod: data.data.payment_method?.type || 'UNKNOWN',
        transactionId: data.data.id,
        checkoutUrl: data.data.payment_link_url,
        createdAt: data.data.created_at,
      };
    } catch (error) {
      console.error('Error al crear pago:', error);
      throw error;
    }
  }

  // Consultar estado de transacción
  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.privateKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al consultar transacción: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.data.id,
        status: data.data.status,
        reference: data.data.reference,
        amount: data.data.amount_in_cents / 100,
        currency: data.data.currency,
        paymentMethod: data.data.payment_method?.type || 'UNKNOWN',
        transactionId: data.data.id,
        authorizationCode: data.data.payment_method?.extra?.authorization_code,
        errorMessage: data.data.status_message,
        createdAt: data.data.created_at,
        updatedAt: data.data.finalized_at || data.data.created_at,
      };
    } catch (error) {
      console.error('Error al consultar transacción:', error);
      throw error;
    }
  }

  // Procesar reembolso
  async processRefund(transactionId: string, amount?: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/void`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.privateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_in_cents: amount ? Math.round(amount * 100) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al procesar reembolso: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al procesar reembolso:', error);
      throw error;
    }
  }

  // Validar webhook signature
  validateWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.config.privateKey)
        .update(timestamp + '.' + payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error al validar webhook:', error);
      return false;
    }
  }

  // Generar enlace de pago
  generatePaymentLink(paymentData: PaymentData): string {
    const params = new URLSearchParams({
      'public-key': this.config.publicKey,
      'currency': paymentData.currency,
      'amount-in-cents': Math.round(paymentData.amount * 100).toString(),
      'reference': paymentData.reference,
      'redirect-url': paymentData.redirectUrl,
      'customer-email': paymentData.customerEmail,
    });

    return `${this.baseUrl.replace('/v1', '')}/checkout?${params.toString()}`;
  }
}

// Configuración por defecto para Colombia
export const defaultWompiConfig: WompiConfig = {
  publicKey: process.env.REACT_APP_WOMPI_PUBLIC_KEY || '',
  privateKey: process.env.REACT_APP_WOMPI_PRIVATE_KEY || '',
  environment: (process.env.REACT_APP_WOMPI_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  currency: 'COP',
};

// Instancia singleton del servicio
export const wompiService = new WompiService(defaultWompiConfig);

export default WompiService;