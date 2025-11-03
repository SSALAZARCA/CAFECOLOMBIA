-- Migración 007: Análisis de Mercado y Suscripciones
-- Fecha: 2024-01-15
-- Descripción: Creación de tablas para análisis de mercado y gestión de suscripciones

-- =============================================
-- TABLA: coffee_prices (Precios del Café)
-- =============================================
CREATE TABLE coffee_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del precio
    price_date DATE NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    
    -- Clasificación del café
    coffee_quality ENUM('specialty', 'premium', 'commercial', 'standard') NOT NULL,
    coffee_variety VARCHAR(100) NULL,
    processing_method ENUM('washed', 'natural', 'honey', 'semi_washed') NULL,
    
    -- Ubicación del mercado
    market_location VARCHAR(255) NOT NULL,
    region VARCHAR(100) NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Colombia',
    
    -- Información del mercado
    market_type ENUM('local', 'national', 'international', 'export') NOT NULL,
    exchange_name VARCHAR(255) NULL,
    
    -- Volumen y tendencias
    volume_traded DECIMAL(12,3) NULL COMMENT 'Volumen comercializado en kg',
    price_change_percentage DECIMAL(5,2) NULL COMMENT 'Cambio porcentual respecto al día anterior',
    
    -- Metadatos
    source VARCHAR(255) NOT NULL COMMENT 'Fuente de la información',
    reliability_score INT DEFAULT 5 COMMENT 'Puntuación de confiabilidad 1-10',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_price_date (price_date),
    INDEX idx_quality (coffee_quality),
    INDEX idx_market_type (market_type),
    INDEX idx_location (market_location),
    INDEX idx_variety (coffee_variety),
    INDEX idx_processing (processing_method),
    INDEX idx_created_at (created_at),
    
    -- Constraint único para evitar duplicados
    UNIQUE KEY unique_price_entry (price_date, coffee_quality, market_location, market_type),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: market_trends (Tendencias del Mercado)
-- =============================================
CREATE TABLE market_trends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Período de análisis
    analysis_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Tipo de tendencia
    trend_type ENUM('price', 'demand', 'supply', 'quality', 'export', 'consumption') NOT NULL,
    trend_direction ENUM('upward', 'downward', 'stable', 'volatile') NOT NULL,
    
    -- Métricas de la tendencia
    trend_strength DECIMAL(5,2) NOT NULL COMMENT 'Fuerza de la tendencia 0-100',
    confidence_level DECIMAL(5,2) NOT NULL COMMENT 'Nivel de confianza 0-100',
    
    -- Descripción y análisis
    description TEXT NOT NULL,
    key_factors JSON NULL COMMENT 'Factores clave que influyen en la tendencia',
    
    -- Predicciones
    predicted_duration_days INT NULL,
    impact_assessment ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    
    -- Recomendaciones
    recommendations TEXT NULL,
    action_items JSON NULL COMMENT 'Acciones recomendadas',
    
    -- Metadatos
    analyst_notes TEXT NULL,
    data_sources JSON NULL COMMENT 'Fuentes de datos utilizadas',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_analysis_date (analysis_date),
    INDEX idx_period (period_start, period_end),
    INDEX idx_trend_type (trend_type),
    INDEX idx_direction (trend_direction),
    INDEX idx_impact (impact_assessment),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: market_opportunities (Oportunidades de Mercado)
-- =============================================
CREATE TABLE market_opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información básica
    opportunity_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    opportunity_type ENUM('price_premium', 'new_market', 'quality_improvement', 'certification', 'direct_trade', 'value_added') NOT NULL,
    
    -- Evaluación de la oportunidad
    potential_value DECIMAL(12,2) NULL COMMENT 'Valor potencial en COP',
    probability_success DECIMAL(5,2) NOT NULL COMMENT 'Probabilidad de éxito 0-100',
    risk_level ENUM('low', 'medium', 'high') NOT NULL,
    
    -- Temporalidad
    opportunity_window_start DATE NULL,
    opportunity_window_end DATE NULL,
    estimated_implementation_time INT NULL COMMENT 'Tiempo estimado de implementación en días',
    
    -- Requisitos
    requirements JSON NULL COMMENT 'Requisitos para aprovechar la oportunidad',
    investment_needed DECIMAL(12,2) NULL COMMENT 'Inversión necesaria en COP',
    
    -- Seguimiento
    status ENUM('identified', 'under_evaluation', 'approved', 'in_progress', 'completed', 'rejected') NOT NULL DEFAULT 'identified',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Resultados
    actual_value_achieved DECIMAL(12,2) NULL,
    lessons_learned TEXT NULL,
    
    -- Metadatos
    identified_by VARCHAR(36) NOT NULL,
    assigned_to VARCHAR(36) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_type (opportunity_type),
    INDEX idx_status (status),
    INDEX idx_risk_level (risk_level),
    INDEX idx_window (opportunity_window_start, opportunity_window_end),
    INDEX idx_identified_by (identified_by),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (identified_by) REFERENCES admin_users(id),
    FOREIGN KEY (assigned_to) REFERENCES admin_users(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: subscription_plans (Planes de Suscripción)
-- =============================================
CREATE TABLE subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información básica del plan
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Tipo y categoría
    plan_type ENUM('basico', 'premium', 'profesional', 'empresarial', 'personalizado') NOT NULL,
    category ENUM('individual', 'cooperativa', 'exportador', 'tostador', 'distribuidor') NOT NULL,
    
    -- Precios
    price_monthly DECIMAL(10,2) NOT NULL,
    price_quarterly DECIMAL(10,2) NULL,
    price_yearly DECIMAL(10,2) NULL,
    setup_fee DECIMAL(10,2) DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'COP',
    
    -- Características del plan
    max_farms INT NULL COMMENT 'Máximo número de fincas',
    max_lots INT NULL COMMENT 'Máximo número de lotes',
    max_users INT NULL COMMENT 'Máximo número de usuarios',
    max_storage_gb DECIMAL(8,2) NULL COMMENT 'Almacenamiento máximo en GB',
    max_api_calls_monthly INT NULL COMMENT 'Llamadas API mensuales',
    
    -- Funcionalidades incluidas
    features JSON NOT NULL COMMENT 'Array de características incluidas',
    modules JSON NOT NULL COMMENT 'Array de módulos disponibles',
    integrations JSON NULL COMMENT 'Array de integraciones disponibles',
    
    -- Soporte y servicios
    support_level ENUM('basico', 'estandar', 'premium', 'dedicado') NOT NULL DEFAULT 'basico',
    support_channels JSON NULL COMMENT 'Canales de soporte disponibles',
    training_included BOOLEAN DEFAULT FALSE,
    onboarding_included BOOLEAN DEFAULT FALSE,
    
    -- Configuración de facturación
    billing_cycle ENUM('mensual', 'trimestral', 'semestral', 'anual') NOT NULL DEFAULT 'mensual',
    trial_period_days INT DEFAULT 0,
    grace_period_days INT DEFAULT 7,
    
    -- Descuentos y promociones
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_start_date DATE NULL,
    discount_end_date DATE NULL,
    promotional_price DECIMAL(10,2) NULL,
    
    -- Estado y metadatos
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_plan_code (plan_code),
    INDEX idx_plan_type (plan_type),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    INDEX idx_price_monthly (price_monthly),
    INDEX idx_display_order (display_order),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: subscriptions (Suscripciones)
-- =============================================
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_id INT NOT NULL,
    
    -- Información de la suscripción
    subscription_code VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('activa', 'pausada', 'cancelada', 'vencida', 'pendiente_pago', 'en_prueba') NOT NULL DEFAULT 'en_prueba',
    
    -- Fechas importantes
    start_date DATE NOT NULL,
    end_date DATE NULL,
    trial_end_date DATE NULL,
    next_billing_date DATE NULL,
    last_billing_date DATE NULL,
    cancelled_at TIMESTAMP NULL,
    paused_at TIMESTAMP NULL,
    resumed_at TIMESTAMP NULL,
    
    -- Información de facturación
    billing_cycle ENUM('mensual', 'trimestral', 'semestral', 'anual') NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    discount_applied DECIMAL(5,2) DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'COP',
    
    -- Uso y límites
    current_farms_count INT DEFAULT 0,
    current_lots_count INT DEFAULT 0,
    current_users_count INT DEFAULT 0,
    current_storage_used_gb DECIMAL(8,2) DEFAULT 0.00,
    current_api_calls_monthly INT DEFAULT 0,
    
    -- Configuración personalizada
    custom_features JSON NULL COMMENT 'Características personalizadas',
    custom_limits JSON NULL COMMENT 'Límites personalizados',
    
    -- Información de pago
    payment_method ENUM('tarjeta_credito', 'tarjeta_debito', 'transferencia', 'pse', 'efectivo', 'otro') NULL,
    payment_gateway VARCHAR(100) NULL,
    gateway_subscription_id VARCHAR(255) NULL COMMENT 'ID en la pasarela de pago',
    
    -- Renovación automática
    auto_renewal BOOLEAN DEFAULT TRUE,
    renewal_attempts INT DEFAULT 0,
    max_renewal_attempts INT DEFAULT 3,
    
    -- Motivos de cambios
    cancellation_reason TEXT NULL,
    pause_reason TEXT NULL,
    
    -- Metadatos
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_user (user_id),
    INDEX idx_plan (plan_id),
    INDEX idx_subscription_code (subscription_code),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_next_billing (next_billing_date),
    INDEX idx_auto_renewal (auto_renewal),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: subscription_usage_logs (Logs de Uso de Suscripciones)
-- =============================================
CREATE TABLE subscription_usage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    
    -- Información del uso
    usage_date DATE NOT NULL,
    usage_type ENUM('farms', 'lots', 'users', 'storage', 'api_calls', 'reports', 'exports') NOT NULL,
    usage_value DECIMAL(12,3) NOT NULL,
    usage_unit VARCHAR(20) NOT NULL COMMENT 'Unidad de medida (count, GB, calls, etc.)',
    
    -- Límites y estado
    limit_value DECIMAL(12,3) NULL,
    percentage_used DECIMAL(5,2) NULL,
    is_over_limit BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_subscription (subscription_id),
    INDEX idx_usage_date (usage_date),
    INDEX idx_usage_type (usage_type),
    INDEX idx_over_limit (is_over_limit),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- =============================================
-- TABLA: market_data_sources (Fuentes de Datos de Mercado)
-- =============================================
CREATE TABLE market_data_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    source_type ENUM('api', 'manual', 'scraping', 'feed') NOT NULL,
    
    -- Configuración de actualización
    update_frequency ENUM('tiempo_real', 'diario', 'semanal', 'mensual', 'manual') NOT NULL,
    last_update TIMESTAMP NULL,
    next_update TIMESTAMP NULL,
    
    -- Configuración de conexión
    api_endpoint VARCHAR(500) NULL,
    api_key_required BOOLEAN DEFAULT FALSE,
    authentication_type ENUM('none', 'api_key', 'oauth', 'basic_auth') DEFAULT 'none',
    
    -- Estado y configuración
    is_active BOOLEAN DEFAULT TRUE,
    reliability_score DECIMAL(3,2) DEFAULT 5.00 COMMENT 'Puntuación de confiabilidad 1-10',
    priority_level INT DEFAULT 5 COMMENT 'Prioridad 1-10',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_source_type (source_type),
    INDEX idx_active (is_active),
    INDEX idx_update_frequency (update_frequency),
    INDEX idx_last_update (last_update),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: market_analysis (Análisis de Mercado)
-- =============================================
CREATE TABLE market_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Referencia a fuente
    source_id INT NOT NULL,
    
    -- Información temporal
    analysis_date DATE NOT NULL,
    
    -- Información del producto
    product_type ENUM('cafe_verde', 'cafe_tostado', 'cafe_molido', 'cafe_soluble') NOT NULL,
    variety VARCHAR(100) NULL,
    quality_grade ENUM('specialty', 'premium', 'commercial', 'standard', 'supremo', 'extra') NOT NULL,
    
    -- Precios
    price_min DECIMAL(10,2) NULL,
    price_max DECIMAL(10,2) NULL,
    price_avg DECIMAL(10,2) NOT NULL,
    price_opening DECIMAL(10,2) NULL,
    price_closing DECIMAL(10,2) NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    
    -- Volumen y mercado
    volume_traded DECIMAL(12,3) NULL COMMENT 'Volumen en kg',
    market_name VARCHAR(255) NOT NULL,
    market_type ENUM('local', 'nacional', 'internacional', 'export') NOT NULL,
    
    -- Análisis
    trend ENUM('alcista', 'bajista', 'estable', 'volatil') NOT NULL,
    market_sentiment ENUM('muy_pesimista', 'pesimista', 'neutral', 'optimista', 'muy_optimista') NOT NULL,
    forecast_short_term ENUM('alza', 'baja', 'estable', 'incierto') NOT NULL,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_source_id (source_id),
    INDEX idx_analysis_date (analysis_date),
    INDEX idx_product_type (product_type),
    INDEX idx_quality_grade (quality_grade),
    INDEX idx_market_type (market_type),
    INDEX idx_trend (trend),
    
    -- Claves foráneas
    FOREIGN KEY (source_id) REFERENCES market_data_sources(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: subscription_usage (Uso de Suscripciones)
-- =============================================
CREATE TABLE subscription_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Referencia a suscripción
    subscription_id INT NOT NULL,
    
    -- Período de uso
    usage_date DATE NOT NULL,
    usage_month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
    
    -- Contadores de uso
    farms_used INT DEFAULT 0,
    lots_used INT DEFAULT 0,
    users_active INT DEFAULT 0,
    storage_used_gb DECIMAL(8,2) DEFAULT 0.00,
    api_calls_count INT DEFAULT 0,
    
    -- Actividad
    login_count INT DEFAULT 0,
    reports_generated INT DEFAULT 0,
    exports_count INT DEFAULT 0,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_usage_date (usage_date),
    INDEX idx_usage_month (usage_month),
    
    -- Constraint único
    UNIQUE KEY unique_subscription_usage (subscription_id, usage_date),
    
    -- Claves foráneas
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar fuentes de datos de mercado
INSERT INTO market_data_sources (name, description, source_type, update_frequency, is_active, created_by) VALUES
('Bolsa Nacional Agropecuaria', 'Precios oficiales de la BNA para café', 'api', 'diario', TRUE, 'admin-001'),
('Federación Nacional de Cafeteros', 'Datos de precios de la FNC', 'manual', 'diario', TRUE, 'admin-001'),
('Mercado Internacional ICE', 'Precios internacionales del café', 'api', 'tiempo_real', TRUE, 'admin-001'),
('Cooperativas Locales', 'Precios de cooperativas regionales', 'manual', 'semanal', TRUE, 'admin-001');

-- Insertar análisis de mercado de ejemplo
INSERT INTO market_analysis (
    source_id, analysis_date, product_type, variety, quality_grade,
    price_min, price_max, price_avg, price_opening, price_closing,
    volume_traded, market_name, market_type, trend,
    market_sentiment, forecast_short_term, created_by
) VALUES (
    1, '2024-01-15', 'cafe_verde', 'Caturra', 'supremo',
    4500.00, 5200.00, 4850.00, 4600.00, 4900.00,
    15000.000, 'Bolsa Nacional Agropecuaria', 'nacional', 'alcista',
    'optimista', 'alza', 'admin-001'
);

-- Insertar planes de suscripción
INSERT INTO subscription_plans (
    name, description, plan_code, plan_type, category,
    price_monthly, price_yearly, max_farms, max_lots, max_users,
    features, modules, support_level, trial_period_days, is_active, created_by
) VALUES 
(
    'Plan Básico', 'Plan ideal para pequeños productores', 'BASIC', 'basico', 'individual',
    49900.00, 499000.00, 1, 5, 2,
    '["gestion_basica", "reportes_simples", "soporte_email"]',
    '["fincas", "lotes", "cosechas"]',
    'basico', 15, TRUE, 'admin-001'
),
(
    'Plan Premium', 'Plan completo para productores medianos', 'PREMIUM', 'premium', 'individual',
    99900.00, 999000.00, 3, 15, 5,
    '["gestion_completa", "reportes_avanzados", "analisis_mercado", "trazabilidad", "soporte_telefono"]',
    '["fincas", "lotes", "cosechas", "inventario", "fitosanitario", "tareas", "mercado"]',
    'estandar', 30, TRUE, 'admin-001'
),
(
    'Plan Profesional', 'Plan para cooperativas y grandes productores', 'PRO', 'profesional', 'cooperativa',
    199900.00, 1999000.00, 10, 50, 15,
    '["gestion_completa", "reportes_avanzados", "analisis_mercado", "trazabilidad", "api_acceso", "integraciones", "soporte_dedicado"]',
    '["fincas", "lotes", "cosechas", "inventario", "fitosanitario", "tareas", "mercado", "pagos", "auditoria"]',
    'premium', 30, TRUE, 'admin-001'
);

-- Insertar suscripción de ejemplo
INSERT INTO subscriptions (
    user_id, plan_id, subscription_code, status, start_date, end_date,
    trial_end_date, billing_cycle, current_price, original_price,
    auto_renewal, created_by
) VALUES (
    'admin-001', 2, 'SUB-2024-001', 'en_prueba', '2024-01-01', '2024-12-31',
    '2024-01-31', 'anual', 999000.00, 999000.00,
    TRUE, 'admin-001'
);

-- Insertar uso de suscripción de ejemplo
INSERT INTO subscription_usage (
    subscription_id, usage_date, usage_month,
    farms_used, lots_used, users_active, storage_used_gb,
    login_count, reports_generated
) VALUES (
    1, '2024-01-15', '2024-01',
    1, 3, 2, 0.5,
    5, 2
);