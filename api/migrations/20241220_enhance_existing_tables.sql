-- Mejorar tabla de planes de suscripción
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS features JSON COMMENT 'Lista de características del plan',
ADD COLUMN IF NOT EXISTS limitations JSON COMMENT 'Limitaciones del plan',
ADD COLUMN IF NOT EXISTS trial_days INT DEFAULT 0 COMMENT 'Días de prueba gratuita',
ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Tarifa de configuración inicial',
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de descuento',
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT COMMENT 'Política de cancelación',
ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT TRUE COMMENT 'Renovación automática',
ADD COLUMN IF NOT EXISTS grace_period_days INT DEFAULT 3 COMMENT 'Días de gracia para pago',
ADD COLUMN IF NOT EXISTS metadata JSON COMMENT 'Metadatos adicionales del plan',
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0 COMMENT 'Orden de visualización',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE COMMENT 'Plan destacado';

-- Mejorar tabla de pagos
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method_details JSON COMMENT 'Detalles del método de pago',
ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(255) COMMENT 'ID de transacción del gateway',
ADD COLUMN IF NOT EXISTS gateway_response JSON COMMENT 'Respuesta completa del gateway',
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto reembolsado',
ADD COLUMN IF NOT EXISTS refund_reason TEXT COMMENT 'Razón del reembolso',
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL COMMENT 'Fecha de reembolso',
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0 COMMENT 'Número de reintentos',
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP NULL COMMENT 'Última fecha de reintento',
ADD COLUMN IF NOT EXISTS failure_reason TEXT COMMENT 'Razón del fallo',
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP NULL COMMENT 'Fecha de recepción del webhook';

-- Mejorar tabla de suscripciones
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL COMMENT 'Fecha de fin del período de prueba',
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP NULL COMMENT 'Fecha de fin del período de gracia',
ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT TRUE COMMENT 'Renovación automática habilitada',
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT COMMENT 'Razón de cancelación',
ADD COLUMN IF NOT EXISTS cancelled_by_user_id INT COMMENT 'Usuario que canceló la suscripción',
ADD COLUMN IF NOT EXISTS metadata JSON COMMENT 'Metadatos adicionales de la suscripción';

-- Crear tabla para sesiones de usuario (para analíticas)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
    browser VARCHAR(50),
    os VARCHAR(50),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    UNIQUE KEY unique_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla para webhooks de Wompi
CREATE TABLE IF NOT EXISTS wompi_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL COMMENT 'Tipo de evento del webhook',
    transaction_id VARCHAR(255) COMMENT 'ID de transacción de Wompi',
    payment_id INT COMMENT 'ID del pago en nuestra base de datos',
    payload JSON NOT NULL COMMENT 'Payload completo del webhook',
    signature VARCHAR(255) COMMENT 'Firma del webhook para verificación',
    processed BOOLEAN DEFAULT FALSE COMMENT 'Indica si el webhook fue procesado',
    processed_at TIMESTAMP NULL COMMENT 'Fecha de procesamiento',
    error_message TEXT COMMENT 'Mensaje de error si el procesamiento falló',
    retry_count INT DEFAULT 0 COMMENT 'Número de reintentos de procesamiento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_event_type (event_type),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla para notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('email', 'sms', 'push', 'in_app') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON COMMENT 'Datos adicionales de la notificación',
    status ENUM('pending', 'sent', 'delivered', 'failed', 'read') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla para logs del sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level ENUM('debug', 'info', 'warn', 'error', 'critical') NOT NULL,
    message TEXT NOT NULL,
    context JSON COMMENT 'Contexto adicional del log',
    user_id INT NULL COMMENT 'Usuario relacionado (si aplica)',
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(255) COMMENT 'ID de la petición para tracking',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level (level),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_request_id (request_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar campos faltantes a la tabla users para analíticas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country VARCHAR(2) COMMENT 'Código de país ISO',
ADD COLUMN IF NOT EXISTS city VARCHAR(100) COMMENT 'Ciudad del usuario',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL COMMENT 'Último login del usuario',
ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0 COMMENT 'Número total de logins',
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL COMMENT 'Fecha de verificación del email',
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP NULL COMMENT 'Fecha de verificación del teléfono';

-- Crear índices adicionales para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_method_created ON payments(payment_method_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_created ON subscriptions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active_featured ON subscription_plans(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_users_created_country ON users(created_at, country);