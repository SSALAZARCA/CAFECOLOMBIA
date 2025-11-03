// Tipos para el sistema de suscripciones

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  features: string[];
  max_farms?: number;
  max_users?: number;
  max_storage_gb?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  trial_start?: Date;
  trial_end?: Date;
  canceled_at?: Date;
  cancellation_reason?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  plan?: SubscriptionPlan;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'canceled' 
  | 'unpaid' 
  | 'incomplete' 
  | 'incomplete_expired';

export interface SubscriptionCreateRequest {
  user_id: number;
  plan_id: number;
  trial_days?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionUpdateRequest {
  plan_id?: number;
  status?: SubscriptionStatus;
  cancellation_reason?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionCancelRequest {
  reason: string;
  immediate?: boolean;
}

// Tipos para filtros y paginación de suscripciones
export interface SubscriptionListFilters {
  status?: SubscriptionStatus;
  plan_id?: number;
  user_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'current_period_end' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Tipos para estadísticas de suscripciones
export interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  canceled_subscriptions: number;
  revenue_current_month: number;
  revenue_previous_month: number;
  churn_rate: number;
  growth_rate: number;
  average_revenue_per_user: number;
  plans_distribution: {
    plan_id: number;
    plan_name: string;
    count: number;
    percentage: number;
  }[];
}

// Tipos para métricas de suscripciones
export interface SubscriptionMetrics {
  period: string;
  new_subscriptions: number;
  canceled_subscriptions: number;
  revenue: number;
  active_subscriptions: number;
}

export interface SubscriptionRevenueMetrics {
  daily: SubscriptionMetrics[];
  monthly: SubscriptionMetrics[];
  yearly: SubscriptionMetrics[];
}

// Tipos para planes de suscripción
export interface PlanCreateRequest {
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  features: string[];
  max_farms?: number;
  max_users?: number;
  max_storage_gb?: number;
}

export interface PlanUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  billing_cycle?: BillingCycle;
  features?: string[];
  max_farms?: number;
  max_users?: number;
  max_storage_gb?: number;
  is_active?: boolean;
}