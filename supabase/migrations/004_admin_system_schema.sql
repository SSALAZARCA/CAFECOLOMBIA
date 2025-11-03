-- =====================================================
-- MIGRACIÓN 004: SISTEMA DE ADMINISTRACIÓN COMPLETO
-- Panel de Superadministrador - Café Colombia
-- =====================================================

-- Tabla de usuarios administradores
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_super_admin BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(32),
    two_factor_enabled BOOLEAN DEFAULT false,
    backup_codes JSONB DEFAULT '[]',
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización de admin_users
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_super_admin ON admin_users(is_super_admin);
CREATE INDEX idx_admin_users_locked_until ON admin_users(locked_until);

-- Tabla de sesiones de administradores
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para admin_sessions
CREATE INDEX idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Tabla de planes de suscripción
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    max_farms INTEGER NOT NULL DEFAULT 1,
    max_users INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para subscription_plans
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_sort_order ON subscription_plans(sort_order);

-- Tabla de suscripciones de usuarios
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'suspended')),
    billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_ends_at ON subscriptions(ends_at);
CREATE INDEX idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);

-- Tabla de pagos y transacciones
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_method VARCHAR(50),
    wompi_transaction_id VARCHAR(100),
    wompi_reference VARCHAR(100),
    wompi_payment_link_id VARCHAR(100),
    payment_data JSONB,
    failure_reason TEXT,
    refund_amount DECIMAL(10,2),
    refunded_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_wompi_transaction_id ON payments(wompi_transaction_id);
CREATE INDEX idx_payments_wompi_reference ON payments(wompi_reference);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Tabla de webhooks de pagos
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id),
    event_type VARCHAR(100) NOT NULL,
    webhook_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_error TEXT,
    signature_valid BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payment_webhooks
CREATE INDEX idx_payment_webhooks_payment_id ON payment_webhooks(payment_id);
CREATE INDEX idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);

-- Tabla de logs de auditoría
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_admin_user_id ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Tabla de configuración del sistema
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para system_config
CREATE INDEX idx_system_config_key ON system_config(key);
CREATE INDEX idx_system_config_is_public ON system_config(is_public);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales de planes de suscripción
INSERT INTO subscription_plans (name, description, monthly_price, annual_price, features, max_farms, max_users, sort_order) VALUES
('Básico', 'Plan gratuito con funcionalidades limitadas', 0, 0, '["basic_analytics", "1_farm_max", "basic_support"]', 1, 1, 1),
('Premium', 'Plan completo para caficultores individuales', 29900, 299000, '["advanced_analytics", "unlimited_farms", "ai_recommendations", "priority_support", "export_reports", "mobile_app"]', 999, 1, 2),
('Empresarial', 'Plan para empresas con múltiples usuarios', 59900, 599000, '["all_premium_features", "multi_user", "custom_reports", "api_access", "dedicated_support", "custom_integrations"]', 9999, 10, 3);

-- Configuración inicial del sistema
INSERT INTO system_config (key, value, description, is_public) VALUES
('app_name', '"Café Colombia"', 'Nombre de la aplicación', true),
('app_version', '"1.0.0"', 'Versión de la aplicación', true),
('maintenance_mode', 'false', 'Modo de mantenimiento', false),
('max_login_attempts', '5', 'Máximo número de intentos de login', false),
('session_timeout', '900', 'Tiempo de expiración de sesión en segundos (15 min)', false),
('password_min_length', '8', 'Longitud mínima de contraseña', false),
('enable_2fa', 'true', 'Habilitar autenticación de dos factores', false),
('wompi_environment', '"sandbox"', 'Entorno de Wompi (sandbox/production)', false);

-- Crear usuario superadministrador inicial (contraseña: Admin123!)
-- NOTA: En producción, cambiar esta contraseña inmediatamente
INSERT INTO admin_users (email, password_hash, name, is_super_admin, two_factor_enabled) VALUES
('admin@cafecolombiaapp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/8VfuFvO', 'Superadministrador', true, false);

-- Comentarios para documentación
COMMENT ON TABLE admin_users IS 'Usuarios administradores del sistema con capacidades de gestión';
COMMENT ON TABLE subscription_plans IS 'Planes de suscripción disponibles para los usuarios';
COMMENT ON TABLE subscriptions IS 'Suscripciones activas de los usuarios';
COMMENT ON TABLE payments IS 'Historial de pagos y transacciones';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de todas las acciones administrativas';
COMMENT ON TABLE system_config IS 'Configuración global del sistema';