-- Crear tabla para configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL COMMENT 'Categoría de la configuración (email, payment, security, etc.)',
    `key` VARCHAR(100) NOT NULL COMMENT 'Clave de la configuración',
    value TEXT COMMENT 'Valor de la configuración',
    description TEXT COMMENT 'Descripción de la configuración',
    is_encrypted BOOLEAN DEFAULT FALSE COMMENT 'Indica si el valor está encriptado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_category_key (category, `key`),
    INDEX idx_category (category),
    INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones por defecto para Wompi
INSERT INTO system_settings (category, `key`, value, description, is_encrypted) VALUES
('payment', 'wompi_public_key', '', 'Clave pública de Wompi', FALSE),
('payment', 'wompi_private_key', '', 'Clave privada de Wompi', TRUE),
('payment', 'wompi_environment', 'test', 'Entorno de Wompi (test/production)', FALSE),
('payment', 'wompi_webhook_secret', '', 'Secreto del webhook de Wompi', TRUE),
('payment', 'wompi_currency', 'COP', 'Moneda por defecto', FALSE),
('payment', 'wompi_tax_rate', '19', 'Tasa de impuesto (%)', FALSE),
('payment', 'wompi_accepted_methods', 'CARD,PSE,NEQUI,DAVIPLATA', 'Métodos de pago aceptados', FALSE),
('payment', 'wompi_retry_attempts', '3', 'Intentos de reintento para pagos fallidos', FALSE),
('payment', 'wompi_retry_delay', '300', 'Delay entre reintentos (segundos)', FALSE);

-- Insertar configuraciones por defecto para email
INSERT INTO system_settings (category, `key`, value, description, is_encrypted) VALUES
('email', 'smtp_host', '', 'Servidor SMTP', FALSE),
('email', 'smtp_port', '587', 'Puerto SMTP', FALSE),
('email', 'smtp_secure', 'true', 'Usar conexión segura (TLS)', FALSE),
('email', 'smtp_user', '', 'Usuario SMTP', FALSE),
('email', 'smtp_password', '', 'Contraseña SMTP', TRUE),
('email', 'from_email', '', 'Email remitente por defecto', FALSE),
('email', 'from_name', 'Café Colombia', 'Nombre remitente por defecto', FALSE);

-- Insertar configuraciones por defecto para notificaciones
INSERT INTO system_settings (category, `key`, value, description, is_encrypted) VALUES
('notifications', 'email_enabled', 'true', 'Habilitar notificaciones por email', FALSE),
('notifications', 'sms_enabled', 'false', 'Habilitar notificaciones por SMS', FALSE),
('notifications', 'push_enabled', 'true', 'Habilitar notificaciones push', FALSE),
('notifications', 'payment_success_email', 'true', 'Enviar email en pago exitoso', FALSE),
('notifications', 'payment_failed_email', 'true', 'Enviar email en pago fallido', FALSE),
('notifications', 'subscription_renewal_email', 'true', 'Enviar email en renovación de suscripción', FALSE),
('notifications', 'subscription_expiry_email', 'true', 'Enviar email antes de expiración', FALSE);

-- Insertar configuraciones por defecto para seguridad
INSERT INTO system_settings (category, `key`, value, description, is_encrypted) VALUES
('security', 'session_timeout', '3600', 'Tiempo de expiración de sesión (segundos)', FALSE),
('security', 'max_login_attempts', '5', 'Máximo intentos de login', FALSE),
('security', 'lockout_duration', '900', 'Duración de bloqueo (segundos)', FALSE),
('security', 'password_min_length', '8', 'Longitud mínima de contraseña', FALSE),
('security', 'password_require_uppercase', 'true', 'Requerir mayúsculas en contraseña', FALSE),
('security', 'password_require_lowercase', 'true', 'Requerir minúsculas en contraseña', FALSE),
('security', 'password_require_numbers', 'true', 'Requerir números en contraseña', FALSE),
('security', 'password_require_symbols', 'false', 'Requerir símbolos en contraseña', FALSE);

-- Insertar configuraciones por defecto para sistema
INSERT INTO system_settings (category, `key`, value, description, is_encrypted) VALUES
('system', 'site_name', 'Café Colombia', 'Nombre del sitio', FALSE),
('system', 'site_description', 'Plataforma de suscripción para café colombiano', 'Descripción del sitio', FALSE),
('system', 'maintenance_mode', 'false', 'Modo de mantenimiento', FALSE),
('system', 'backup_enabled', 'true', 'Habilitar backups automáticos', FALSE),
('system', 'backup_frequency', 'daily', 'Frecuencia de backup (daily/weekly/monthly)', FALSE),
('system', 'log_level', 'info', 'Nivel de logging (debug/info/warn/error)', FALSE),
('system', 'timezone', 'America/Bogota', 'Zona horaria del sistema', FALSE);