import axios from 'axios';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

interface WompiConfig {
  public_key: string;
  private_key: string;
  environment: 'sandbox' | 'production';
  webhook_url?: string;
}

interface PaymentRequest {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  reference: string;
  redirect_url?: string;
  payment_method?: {
    type: string;
    installments?: number;
  };
}

interface PaymentResponse {
  id: string;
  status: string;
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  reference: string;
  payment_method?: any;
  created_at: string;
  finalized_at?: string;
  status_message?: string;
}

class WompiService {
  private config: WompiConfig | null = null;
  private baseUrl: string = '';

  async initialize(): Promise<void> {
    try {
      const [settings] = await pool.execute<RowDataPacket[]>(
        'SELECT key, value FROM system_settings WHERE category = "payment" AND key LIKE "wompi_%"'
      );

      const configData: Record<string, string> = {};
      settings.forEach((setting: any) => {
        configData[setting.key] = setting.value;
      });

      this.config = {
        public_key: configData.wompi_public_key || '',
        private_key: configData.wompi_private_key || '',
        environment: (configData.wompi_environment as 'sandbox' | 'production') || 'sandbox',
        webhook_url: configData.wompi_webhook_url
      };

      this.baseUrl = this.config.environment === 'production' 
        ? 'https://production.wompi.co/v1'
        : 'https://sandbox.wompi.co/v1';

    } catch (error) {
      console.error('Error initializing Wompi service:', error);
      throw new Error('Failed to initialize Wompi configuration');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.config) {
      await this.initialize();
    }
  }

  async testConnection(): Promise<{ status: 'success' | 'error'; message: string; details?: any }> {
    try {
      await this.ensureInitialized();

      if (!this.config?.public_key || !this.config?.private_key) {
        return {
          status: 'error',
          message: 'Configuración de Wompi incompleta. Faltan claves API.'
        };
      }

      // Test con endpoint de merchants
      const response = await axios.get(`${this.baseUrl}/merchants/${this.config.public_key}`, {
        headers: {
          'Authorization': `Bearer ${this.config.private_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Conexión con Wompi exitosa',
          details: {
            environment: this.config.environment,
            merchant_id: response.data.data?.id,
            merchant_name: response.data.data?.name
          }
        };
      } else {
        return {
          status: 'error',
          message: 'Error en la respuesta de Wompi',
          details: response.data
        };
      }
    } catch (error: any) {
      console.error('Error testing Wompi connection:', error);
      return {
        status: 'error',
        message: 'Error conectando con Wompi: ' + (error.response?.data?.error?.reason || error.message),
        details: error.response?.data
      };
    }
  }

  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();

      if (!this.config?.private_key) {
        throw new Error('Wompi private key not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/transactions`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.private_key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      throw new Error(error.response?.data?.error?.reason || 'Error creating payment');
    }
  }

  async getPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();

      if (!this.config?.private_key) {
        throw new Error('Wompi private key not configured');
      }

      const response = await axios.get(
        `${this.baseUrl}/transactions/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.private_key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error getting payment:', error);
      throw new Error(error.response?.data?.error?.reason || 'Error getting payment');
    }
  }

  async getPaymentMethods(): Promise<any[]> {
    try {
      await this.ensureInitialized();

      const response = await axios.get(`${this.baseUrl}/payment_methods`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.data || [];
    } catch (error: any) {
      console.error('Error getting payment methods:', error);
      throw new Error(error.response?.data?.error?.reason || 'Error getting payment methods');
    }
  }

  async processWebhook(webhookData: any): Promise<{ success: boolean; message: string }> {
    try {
      // Registrar el webhook en la base de datos
      await pool.execute(
        `INSERT INTO wompi_webhooks (
          event_type, transaction_id, status, amount_in_cents, 
          currency, customer_email, reference, raw_data, 
          processed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          webhookData.event || 'unknown',
          webhookData.data?.id || null,
          webhookData.data?.status || null,
          webhookData.data?.amount_in_cents || null,
          webhookData.data?.currency || null,
          webhookData.data?.customer_email || null,
          webhookData.data?.reference || null,
          JSON.stringify(webhookData),
          false
        ]
      );

      // Procesar según el tipo de evento
      if (webhookData.event === 'transaction.updated' && webhookData.data) {
        await this.updatePaymentStatus(webhookData.data);
      }

      return {
        success: true,
        message: 'Webhook processed successfully'
      };
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      return {
        success: false,
        message: 'Error processing webhook: ' + error.message
      };
    }
  }

  private async updatePaymentStatus(transactionData: any): Promise<void> {
    try {
      // Buscar el pago por external_id (que debería ser el ID de Wompi)
      const [payments] = await pool.execute<RowDataPacket[]>(
        'SELECT id, status FROM payments WHERE external_id = ?',
        [transactionData.id]
      );

      if (payments.length > 0) {
        const payment = payments[0];
        
        // Mapear estados de Wompi a nuestros estados
        let newStatus = 'pending';
        switch (transactionData.status) {
          case 'APPROVED':
            newStatus = 'completed';
            break;
          case 'DECLINED':
          case 'ERROR':
            newStatus = 'failed';
            break;
          case 'VOIDED':
            newStatus = 'cancelled';
            break;
          default:
            newStatus = 'pending';
        }

        // Actualizar el estado del pago
        await pool.execute(
          `UPDATE payments SET 
            status = ?, 
            processed_at = NOW(), 
            metadata = JSON_SET(COALESCE(metadata, '{}'), '$.wompi_status', ?, '$.wompi_updated_at', NOW()),
            updated_at = NOW()
          WHERE id = ?`,
          [newStatus, transactionData.status, payment.id]
        );

        console.log(`Payment ${payment.id} status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  getPublicKey(): string | null {
    return this.config?.public_key || null;
  }

  getEnvironment(): string | null {
    return this.config?.environment || null;
  }
}

export const wompiService = new WompiService();
export default wompiService;