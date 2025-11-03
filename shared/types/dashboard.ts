// Dashboard Types
export interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    growth_rate: number;
  };
  coffee_growers: {
    total: number;
    active: number;
    new_this_month: number;
  };
  farms: {
    total: number;
    active: number;
    total_coffee_area: number;
  };
  subscriptions: {
    total: number;
    active: number;
    monthly_revenue: number;
  };
  payments: {
    total: number;
    successful: number;
    total_revenue: number;
    revenue_this_month: number;
    revenue_growth: number;
  };
  system: {
    audit_logs_today: number;
  };
}

export interface DashboardChartData {
  user_registrations: Array<{
    month: string;
    count: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
  subscriptions_by_plan: Array<{
    plan_name: string;
    count: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
  }>;
  daily_activity: Array<{
    date: string;
    count: number;
  }>;
  growers_by_department: Array<{
    department: string;
    count: number;
  }>;
}

export interface DashboardRecentActivity {
  id: number;
  action: string;
  resource_type: string;
  resource_id?: string;
  description?: string;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

export interface DashboardSystemHealth {
  recent_errors: number;
  failed_payments_24h: number;
  subscriptions_expiring_soon: number;
  inactive_users: number;
  database_size_mb: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface DashboardTopMetrics {
  top_growers_by_area: Array<{
    id: number;
    name: string;
    total_coffee_area: number;
  }>;
  top_plans_by_revenue: Array<{
    id: number;
    name: string;
    active_subscriptions: number;
    total_revenue: number;
  }>;
  top_departments: Array<{
    department: string;
    grower_count: number;
    active_count: number;
  }>;
  most_active_users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    activity_count: number;
  }>;
}

export interface DashboardOverview {
  metrics: DashboardMetrics;
  charts: DashboardChartData;
  recent_activity: DashboardRecentActivity[];
  system_health: DashboardSystemHealth;
  top_metrics: DashboardTopMetrics;
  last_updated: string;
}