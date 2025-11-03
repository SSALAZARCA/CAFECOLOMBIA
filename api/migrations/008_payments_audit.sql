-- Migración 008: Pagos y Auditoría
-- Fecha: 2024-01-18
-- Descripción: Creación de tablas para gestión de pagos y auditoría del sistema

-- =============================================
-- TABLA: payment_methods (Métodos de Pago)
-- =============================================
CREATE TABLE payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    method_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Tipo y categoría
    method_type ENUM('tarjeta_credito', 'tarjeta_debito', 'transferencia_bancaria', 'pse', 'efectivo', 'billetera_digital', 'criptomoneda', 'otro') NOT NULL,
    category ENUM('online', 'offline', 'hibrido') NOT NULL DEFAULT 'online',
    
    -- Configuración del método
    requires_verification BOOLEAN DEFAULT FALSE,
    supports_recurring BOOLEAN DEFAULT FALSE,
    supports_refunds BOOLEAN DEFAULT FALSE,
    min_amount DECIMAL(12,2) NULL COMMENT 'Monto mínimo',
    max_amount DECIMAL(12,2) NULL COMMENT 'Monto máximo',
    
    -- Comisiones y costos
    fixed_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Tarifa fija',
    percentage_fee DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'Porcentaje de comisión',
    currency_code VARCHAR(3) DEFAULT 'COP',
    
    -- Configuración de la pasarela
    gateway_name VARCHAR(100) NULL COMMENT 'Nombre de la pasarela de pago',
    gateway_config JSON NULL COMMENT 'Configuración específica de la pasarela',
    
    -- Países y regiones soportadas
    supported_countries JSON NULL COMMENT 'Array de códigos de países soportados',
    supported_currencies JSON NULL COMMENT 'Array de monedas soportadas',
    
    -- Estado y metadatos
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_method_code (method_code),
    INDEX idx_method_type (method_type),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_default (is_default),
    INDEX idx_display_order (display_order),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: payments (Pagos)
-- =============================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación del pago
    payment_code VARCHAR(100) NOT NULL UNIQUE,
    external_id VARCHAR(255) NULL COMMENT 'ID en la pasarela de pago',
    
    -- Relaciones
    user_id VARCHAR(36) NOT NULL,
    subscription_id INT NULL,
    payment_method_id INT NOT NULL,
    
    -- Información del pago
    payment_type ENUM('suscripcion', 'upgrade', 'addon', 'multa', 'reembolso', 'otro') NOT NULL,
    status ENUM('pendiente', 'procesando', 'completado', 'fallido', 'cancelado', 'reembolsado', 'parcialmente_reembolsado') NOT NULL DEFAULT 'pendiente',
    
    -- Montos
    amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'COP',
    exchange_rate DECIMAL(12,6) NULL COMMENT 'Tasa de cambio si aplica',
    amount_usd DECIMAL(12,2) NULL COMMENT 'Monto en USD para referencia',
    
    -- Comisiones y descuentos
    base_amount DECIMAL(12,2) NOT NULL COMMENT 'Monto base antes de descuentos',
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    fee_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Comisión de la pasarela',
    net_amount DECIMAL(12,2) NOT NULL COMMENT 'Monto neto recibido',
    
    -- Fechas importantes
    payment_date DATETIME NULL,
    due_date DATE NULL,
    processed_at DATETIME NULL,
    failed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    refunded_at DATETIME NULL,
    
    -- Información de la transacción
    gateway_transaction_id VARCHAR(255) NULL,
    gateway_response JSON NULL COMMENT 'Respuesta completa de la pasarela',
    authorization_code VARCHAR(100) NULL,
    reference_number VARCHAR(100) NULL,
    
    -- Información del pagador
    payer_name VARCHAR(255) NULL,
    payer_email VARCHAR(255) NULL,
    payer_phone VARCHAR(50) NULL,
    payer_document_type VARCHAR(20) NULL,
    payer_document_number VARCHAR(50) NULL,
    
    -- Información de facturación
    billing_address JSON NULL COMMENT 'Dirección de facturación',
    invoice_number VARCHAR(100) NULL,
    invoice_url VARCHAR(500) NULL,
    
    -- Intentos y reintentos
    attempt_count INT DEFAULT 1,
    max_attempts INT DEFAULT 3,
    next_retry_at DATETIME NULL,
    
    -- Información adicional
    description TEXT NULL,
    metadata JSON NULL COMMENT 'Metadatos adicionales',
    failure_reason TEXT NULL,
    cancellation_reason TEXT NULL,
    
    -- Notificaciones
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at DATETIME NULL,
    receipt_sent BOOLEAN DEFAULT FALSE,
    receipt_sent_at DATETIME NULL,
    
    -- Metadatos del sistema
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_payment_code (payment_code),
    INDEX idx_external_id (external_id),
    INDEX idx_user (user_id),
    INDEX idx_subscription (subscription_id),
    INDEX idx_payment_method (payment_method_id),
    INDEX idx_payment_type (payment_type),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date),
    INDEX idx_due_date (due_date),
    INDEX idx_amount (amount),
    INDEX idx_gateway_transaction (gateway_transaction_id),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: payment_webhooks (Webhooks de Pagos)
-- =============================================
CREATE TABLE payment_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del webhook
    webhook_id VARCHAR(255) NOT NULL COMMENT 'ID del webhook en la pasarela',
    event_type VARCHAR(100) NOT NULL,
    event_data JSON NOT NULL COMMENT 'Datos completos del evento',
    
    -- Relación con pago
    payment_id INT NULL,
    external_payment_id VARCHAR(255) NULL,
    
    -- Información de la pasarela
    gateway_name VARCHAR(100) NOT NULL,
    signature VARCHAR(500) NULL COMMENT 'Firma del webhook para verificación',
    
    -- Estado del procesamiento
    status ENUM('pendiente', 'procesado', 'fallido', 'ignorado') NOT NULL DEFAULT 'pendiente',
    processed_at DATETIME NULL,
    processing_attempts INT DEFAULT 0,
    max_processing_attempts INT DEFAULT 3,
    
    -- Información de la solicitud
    http_method VARCHAR(10) NOT NULL DEFAULT 'POST',
    headers JSON NULL COMMENT 'Headers HTTP de la solicitud',
    raw_body TEXT NOT NULL COMMENT 'Cuerpo crudo de la solicitud',
    ip_address VARCHAR(45) NULL,
    
    -- Respuesta y errores
    response_status_code INT NULL,
    response_body TEXT NULL,
    error_message TEXT NULL,
    
    -- Metadatos
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_retry_at DATETIME NULL,
    
    -- Índices
    INDEX idx_webhook_id (webhook_id),
    INDEX idx_event_type (event_type),
    INDEX idx_payment (payment_id),
    INDEX idx_external_payment (external_payment_id),
    INDEX idx_gateway (gateway_name),
    INDEX idx_status (status),
    INDEX idx_received_at (received_at),
    
    -- Claves foráneas
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: audit_logs (Logs de Auditoría)
-- =============================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del evento
    event_type ENUM('create', 'update', 'delete', 'login', 'logout', 'access', 'export', 'import', 'payment', 'error', 'security', 'system') NOT NULL,
    table_name VARCHAR(100) NULL COMMENT 'Tabla afectada',
    record_id VARCHAR(100) NULL COMMENT 'ID del registro afectado',
    
    -- Información del usuario
    user_id INT NULL,
    user_type ENUM('admin', 'user', 'system', 'guest') NOT NULL,
    user_email VARCHAR(255) NULL,
    
    -- Detalles del evento
    action VARCHAR(255) NOT NULL COMMENT 'Acción específica realizada',
    description TEXT NULL,
    old_values JSON NULL COMMENT 'Valores anteriores (para updates)',
    new_values JSON NULL COMMENT 'Valores nuevos (para creates/updates)',
    
    -- Información de la sesión
    session_id VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- Información de la solicitud
    request_method VARCHAR(10) NULL,
    request_url VARCHAR(500) NULL,
    request_headers JSON NULL,
    request_body JSON NULL,
    
    -- Respuesta
    response_status_code INT NULL,
    response_time_ms INT NULL,
    
    -- Clasificación de seguridad
    security_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low',
    risk_score INT NULL COMMENT 'Puntuación de riesgo 0-100',
    
    -- Información adicional
    module VARCHAR(100) NULL COMMENT 'Módulo del sistema',
    feature VARCHAR(100) NULL COMMENT 'Funcionalidad específica',
    metadata JSON NULL COMMENT 'Metadatos adicionales',
    
    -- Geolocalización
    country VARCHAR(100) NULL,
    region VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    
    -- Metadatos del sistema
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_event_type (event_type),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user (user_id),
    INDEX idx_user_type (user_type),
    INDEX idx_action (action),
    INDEX idx_security_level (security_level),
    INDEX idx_ip_address (ip_address),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at),
    INDEX idx_module_feature (module, feature),
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: audit_log_details (Detalles de Logs de Auditoría)
-- =============================================
CREATE TABLE audit_log_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_log_id INT NOT NULL,
    
    -- Información del campo
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    data_type VARCHAR(50) NULL COMMENT 'Tipo de dato del campo',
    
    -- Clasificación del cambio
    change_type ENUM('added', 'modified', 'removed', 'unchanged') NOT NULL,
    is_sensitive BOOLEAN DEFAULT FALSE COMMENT 'Si el campo contiene información sensible',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_audit_log (audit_log_id),
    INDEX idx_field_name (field_name),
    INDEX idx_change_type (change_type),
    INDEX idx_sensitive (is_sensitive),
    
    -- Claves foráneas
    FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON DELETE CASCADE
);

-- =============================================
-- TABLA: system_events (Eventos del Sistema)
-- =============================================
CREATE TABLE system_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del evento
    event_category ENUM('application', 'database', 'security', 'performance', 'integration', 'backup', 'maintenance', 'error') NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_level ENUM('debug', 'info', 'warning', 'error', 'critical') NOT NULL DEFAULT 'info',
    
    -- Detalles del evento
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    details JSON NULL COMMENT 'Detalles adicionales del evento',
    
    -- Información del sistema
    server_name VARCHAR(100) NULL,
    application_version VARCHAR(50) NULL,
    environment ENUM('development', 'staging', 'production') NOT NULL DEFAULT 'production',
    
    -- Información de rendimiento
    memory_usage_mb DECIMAL(10,2) NULL,
    cpu_usage_percentage DECIMAL(5,2) NULL,
    disk_usage_percentage DECIMAL(5,2) NULL,
    response_time_ms INT NULL,
    
    -- Información de errores
    error_code VARCHAR(50) NULL,
    error_stack TEXT NULL,
    error_context JSON NULL,
    
    -- Información de la solicitud (si aplica)
    request_id VARCHAR(255) NULL,
    user_id VARCHAR(36) NULL,
    ip_address VARCHAR(45) NULL,
    
    -- Estado y resolución
    status ENUM('open', 'investigating', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    resolved_at DATETIME NULL,
    resolution_notes TEXT NULL,
    
    -- Notificaciones
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels JSON NULL COMMENT 'Canales donde se envió notificación',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_event_category (event_category),
    INDEX idx_event_type (event_type),
    INDEX idx_event_level (event_level),
    INDEX idx_environment (environment),
    INDEX idx_status (status),
    INDEX idx_user (user_id),
    INDEX idx_request (request_id),
    INDEX idx_created_at (created_at),
    INDEX idx_notification (notification_sent),
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar métodos de pago
INSERT INTO payment_methods (
    name, description, method_code, method_type, category,
    requires_verification, supports_recurring, supports_refunds,
    min_amount, max_amount, fixed_fee, percentage_fee,
    gateway_name, is_active, display_order, created_by
) VALUES 
(
    'Tarjeta de Crédito', 'Pagos con tarjeta de crédito Visa/Mastercard', 'CREDIT_CARD', 'tarjeta_credito', 'online',
    TRUE, TRUE, TRUE, 10000.00, 50000000.00, 0.00, 0.0349,
    'Wompi', TRUE, 1, 'admin-001'
),
(
    'PSE', 'Pagos Seguros en Línea - Débito bancario', 'PSE', 'pse', 'online',
    TRUE, FALSE, FALSE, 10000.00, 10000000.00, 3500.00, 0.0000,
    'Wompi', TRUE, 2, 'admin-001'
),
(
    'Transferencia Bancaria', 'Transferencia bancaria directa', 'BANK_TRANSFER', 'transferencia_bancaria', 'offline',
    TRUE, TRUE, TRUE, 50000.00, NULL, 0.00, 0.0000,
    'Manual', TRUE, 3, 'admin-001'
),
(
    'Efectivo', 'Pago en efectivo en puntos autorizados', 'CASH', 'efectivo', 'offline',
    FALSE, FALSE, FALSE, 10000.00, 2000000.00, 2000.00, 0.0000,
    'Manual', TRUE, 4, 'admin-001'
);

-- Insertar pago de ejemplo
INSERT INTO payments (
    payment_code, user_id, subscription_id, payment_method_id,
    payment_type, status, amount, base_amount, net_amount,
    payment_date, description, created_by
) VALUES (
    'PAY-2024-001', 'admin-001', 1, 1,
    'suscripcion', 'completado', 999000.00, 999000.00, 964151.00,
    '2024-01-15 10:30:00', 'Pago anual Plan Premium - Suscripción SUB-2024-001',
    'admin-001'
);

-- Insertar log de auditoría de ejemplo
INSERT INTO audit_logs (
    event_type, table_name, record_id, user_id, user_type, user_email,
    action, description, new_values, ip_address, request_method,
    request_url, security_level, module, feature
) VALUES (
    'create', 'payments', '1', 'admin-001', 'user', 'admin@cafecolombiaapp.com',
    'payment_created', 'Pago creado exitosamente para suscripción premium',
    '{"payment_code": "PAY-2024-001", "amount": 999000.00, "status": "completado"}',
    '192.168.1.100', 'POST', '/api/payments',
    'medium', 'payments', 'create_payment'
);

-- Insertar evento del sistema de ejemplo
INSERT INTO system_events (
    event_category, event_type, event_level, title, message,
    server_name, application_version, environment,
    memory_usage_mb, cpu_usage_percentage, status
) VALUES (
    'application', 'migration_completed', 'info',
    'Migración de Base de Datos Completada',
    'Se completó exitosamente la migración 008 - Pagos y Auditoría',
    'cafe-colombia-api-01', '1.0.0', 'development',
    256.50, 15.75, 'resolved'
);