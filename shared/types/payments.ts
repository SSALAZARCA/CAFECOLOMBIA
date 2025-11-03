// Tipos para el sistema de pagos con Wompi

export interface Payment {
  id: number;
  subscription_id: number;
  wompi_transaction_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_date?: Date;
  failure_reason?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  subscription?: {
    id: number;
    user_id: number;
    plan_name: string;
  };
}

export type PaymentStatus = 
  | 'pending' 
  | 'approved' 
  | 'declined' 
  | 'voided' 
  | 'error';

export type PaymentMethod = 
  | 'CARD' 
  | 'PSE' 
  | 'BANCOLOMBIA_TRANSFER' 
  | 'BANCOLOMBIA_COLLECT' 
  | 'NEQUI' 
  | 'DAVIPLATA';

export interface PaymentWebhook {
  id: number;
  wompi_event_id: string;
  event_type: WompiEventType;
  payment_id?: number;
  raw_data: Record<string, any>;
  processed: boolean;
  processed_at?: Date;
  error_message?: string;
  created_at: Date;
}

export type WompiEventType = 
  | 'transaction.updated' 
  | 'payment_link.paid' 
  | 'payment_source.created';

// Tipos para Wompi API
export interface WompiPaymentRequest {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method: {
    type: PaymentMethod;
    installments?: number;
    token?: string;
  };
  reference: string;
  customer_data?: {
    phone_number?: string;
    full_name?: string;
  };
  shipping_address?: {
    address_line_1: string;
    country: string;
    region: string;
    city: string;
    name: string;
    phone_number: string;
  };
  redirect_url?: string;
  payment_source_id?: number;
}

export interface WompiPaymentResponse {
  data: {
    id: string;
    amount_in_cents: number;
    reference: string;
    customer_email: string;
    currency: string;
    payment_method_type: PaymentMethod;
    payment_method: any;
    status: PaymentStatus;
    status_message: string;
    created_at: string;
    finalized_at?: string;
    shipping_address?: any;
    payment_source_id?: number;
    payment_link_id?: string;
    customer_data?: any;
    billing_data?: any;
  };
}

export interface WompiTokenRequest {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

export interface WompiTokenResponse {
  data: {
    id: string;
    brand: string;
    name: string;
    last_four: string;
    bin: string;
    exp_year: string;
    exp_month: string;
    card_holder: string;
    created_with_cvc: boolean;
    created_at: string;
  };
}

// Tipos para procesamiento de pagos
export interface PaymentCreateRequest {
  subscription_id: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  customer_email: string;
  customer_data?: {
    phone_number?: string;
    full_name?: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentUpdateRequest {
  status?: PaymentStatus;
  wompi_transaction_id?: string;
  payment_date?: Date;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

// Tipos para filtros y paginación de pagos
export interface PaymentListFilters {
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
  subscription_id?: number;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'payment_date' | 'amount' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Tipos para estadísticas de pagos
export interface PaymentStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_revenue: number;
  revenue_current_month: number;
  revenue_previous_month: number;
  average_payment_amount: number;
  payment_methods_distribution: {
    method: PaymentMethod;
    count: number;
    percentage: number;
    total_amount: number;
  }[];
  success_rate: number;
}

// Tipos para métricas de pagos
export interface PaymentMetrics {
  period: string;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  total_amount: number;
  average_amount: number;
}

export interface PaymentRevenueMetrics {
  daily: PaymentMetrics[];
  monthly: PaymentMetrics[];
  yearly: PaymentMetrics[];
}

// Tipos para webhooks
export interface WebhookProcessResult {
  success: boolean;
  payment_id?: number;
  message: string;
  error?: string;
}