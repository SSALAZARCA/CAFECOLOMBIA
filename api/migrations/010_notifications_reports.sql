-- Migración 010: Sistema de Notificaciones y Reportes
-- Fecha: 2024-01-18
-- Descripción: Creación de tablas para notificaciones, reportes del sistema y configuraciones

-- =============================================
-- TABLA: notifications (Notificaciones)
-- =============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    notification_code VARCHAR(100) NOT NULL UNIQUE,
    
    -- Destinatario y remitente
    user_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NULL,
    
    -- Información de la notificación
    type ENUM('info', 'warning', 'error', 'success', 'alert', 'reminder', 'system', 'marketing') NOT NULL,
    category ENUM('system', 'farm', 'payment', 'harvest', 'pest_alert', 'weather', 'market', 'task', 'subscription') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    
    -- Contenido
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    short_message VARCHAR(500) NULL COMMENT 'Mensaje corto para notificaciones push',
    
    -- Datos adicionales
    data JSON NULL COMMENT 'Datos adicionales de la notificación',
    action_url VARCHAR(500) NULL COMMENT 'URL de acción para la notificación',
    action_text VARCHAR(100) NULL COMMENT 'Texto del botón de acción',
    
    -- Canales de entrega
    channels JSON NOT NULL COMMENT 'Canales de notificación: email, push, sms, in_app',
    
    -- Estado de entrega
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled') DEFAULT 'pending',
    sent_at DATETIME NULL,
    delivered_at DATETIME NULL,
    read_at DATETIME NULL,
    
    -- Programación
    scheduled_at DATETIME NULL COMMENT 'Fecha programada para envío',
    expires_at DATETIME NULL COMMENT 'Fecha de expiración',
    
    -- Configuración de reintento
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    last_retry_at DATETIME NULL,
    
    -- Agrupación y threading
    group_key VARCHAR(100) NULL COMMENT 'Clave para agrupar notificaciones relacionadas',
    thread_id VARCHAR(100) NULL COMMENT 'ID del hilo de conversación',
    
    -- Metadatos
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_notification_code (notification_code),
    INDEX idx_user (user_id),
    INDEX idx_sender (sender_id),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_group_key (group_key),
    INDEX idx_thread_id (thread_id),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: notification_preferences (Preferencias de Notificación)
-- =============================================
CREATE TABLE notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Usuario
    user_id VARCHAR(36) NOT NULL,
    
    -- Configuración por categoría
    category ENUM('system', 'farm', 'payment', 'harvest', 'pest_alert', 'weather', 'market', 'task', 'subscription') NOT NULL,
    
    -- Canales habilitados
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Configuración de frecuencia
    frequency ENUM('immediate', 'hourly', 'daily', 'weekly', 'disabled') DEFAULT 'immediate',
    quiet_hours_start TIME NULL COMMENT 'Hora de inicio del período silencioso',
    quiet_hours_end TIME NULL COMMENT 'Hora de fin del período silencioso',
    
    -- Configuración de prioridad mínima
    min_priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_user (user_id),
    INDEX idx_category (category),
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraint único
    UNIQUE KEY unique_user_category (user_id, category)
);

-- =============================================
-- TABLA: notification_templates (Plantillas de Notificación)
-- =============================================
CREATE TABLE notification_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    template_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Configuración
    type ENUM('info', 'warning', 'error', 'success', 'alert', 'reminder', 'system', 'marketing') NOT NULL,
    category ENUM('system', 'farm', 'payment', 'harvest', 'pest_alert', 'weather', 'market', 'task', 'subscription') NOT NULL,
    
    -- Contenido de la plantilla
    title_template VARCHAR(500) NOT NULL COMMENT 'Plantilla del título con variables {{variable}}',
    message_template TEXT NOT NULL COMMENT 'Plantilla del mensaje con variables {{variable}}',
    short_message_template VARCHAR(500) NULL COMMENT 'Plantilla del mensaje corto',
    
    -- Configuración de canales
    default_channels JSON NOT NULL COMMENT 'Canales por defecto para esta plantilla',
    
    -- Variables disponibles
    available_variables JSON NULL COMMENT 'Variables disponibles para la plantilla',
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_template_code (template_code),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: system_reports (Reportes del Sistema)
-- =============================================
CREATE TABLE system_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    report_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Configuración del reporte
    report_type ENUM('farm_summary', 'harvest_analysis', 'financial_summary', 'pest_monitoring', 'weather_analysis', 'market_trends', 'user_activity', 'system_performance', 'ai_insights', 'custom') NOT NULL,
    category ENUM('operational', 'financial', 'analytical', 'administrative', 'technical') NOT NULL,
    
    -- Parámetros y filtros
    parameters JSON NULL COMMENT 'Parámetros configurables del reporte',
    filters JSON NULL COMMENT 'Filtros aplicados al reporte',
    
    -- Configuración de datos
    data_sources JSON NOT NULL COMMENT 'Fuentes de datos del reporte',
    aggregation_rules JSON NULL COMMENT 'Reglas de agregación de datos',
    
    -- Programación
    schedule_type ENUM('manual', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom_cron') DEFAULT 'manual',
    schedule_config JSON NULL COMMENT 'Configuración de programación',
    next_execution DATETIME NULL,
    last_execution DATETIME NULL,
    
    -- Destinatarios
    recipients JSON NULL COMMENT 'Lista de destinatarios del reporte',
    
    -- Formato y entrega
    output_formats JSON NOT NULL COMMENT 'Formatos de salida: pdf, excel, csv, json',
    delivery_methods JSON NOT NULL COMMENT 'Métodos de entrega: email, download, api',
    
    -- Estado
    status ENUM('active', 'inactive', 'draft', 'archived') DEFAULT 'draft',
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_report_code (report_code),
    INDEX idx_report_type (report_type),
    INDEX idx_category (category),
    INDEX idx_schedule_type (schedule_type),
    INDEX idx_status (status),
    INDEX idx_next_execution (next_execution),
    INDEX idx_created_by (created_by),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: report_executions (Ejecuciones de Reportes)
-- =============================================
CREATE TABLE report_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relación con reporte
    report_id INT NOT NULL,
    execution_code VARCHAR(100) NOT NULL UNIQUE,
    
    -- Información de ejecución
    execution_type ENUM('manual', 'scheduled', 'api') NOT NULL,
    triggered_by VARCHAR(36) NULL,
    
    -- Parámetros utilizados
    parameters_used JSON NULL COMMENT 'Parámetros utilizados en esta ejecución',
    filters_used JSON NULL COMMENT 'Filtros aplicados en esta ejecución',
    
    -- Estado de ejecución
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Tiempos
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    execution_time_seconds INT NULL,
    
    -- Resultados
    result_data JSON NULL COMMENT 'Datos del resultado del reporte',
    output_files JSON NULL COMMENT 'Archivos generados',
    
    -- Estadísticas
    records_processed INT NULL,
    data_size_bytes BIGINT NULL,
    
    -- Errores
    error_message TEXT NULL,
    error_details JSON NULL,
    
    -- Entrega
    delivery_status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    delivered_at DATETIME NULL,
    delivery_details JSON NULL,
    
    -- Metadatos
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_report (report_id),
    INDEX idx_execution_code (execution_code),
    INDEX idx_execution_type (execution_type),
    INDEX idx_triggered_by (triggered_by),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at),
    INDEX idx_completed_at (completed_at),
    
    -- Claves foráneas
    FOREIGN KEY (report_id) REFERENCES system_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (triggered_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: system_configs (Configuraciones del Sistema)
-- =============================================
CREATE TABLE system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_group VARCHAR(100) NOT NULL,
    
    -- Valor y tipo
    config_value TEXT NULL,
    value_type ENUM('string', 'number', 'boolean', 'json', 'array', 'date', 'time', 'datetime') NOT NULL DEFAULT 'string',
    
    -- Metadatos
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Validación
    validation_rules JSON NULL COMMENT 'Reglas de validación para el valor',
    default_value TEXT NULL,
    
    -- Configuración
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Si la configuración es pública para el frontend',
    is_editable BOOLEAN DEFAULT TRUE COMMENT 'Si la configuración puede ser editada',
    requires_restart BOOLEAN DEFAULT FALSE COMMENT 'Si cambiar esta configuración requiere reinicio',
    
    -- Categorización
    category ENUM('general', 'database', 'email', 'notifications', 'ai', 'payments', 'security', 'performance', 'integrations') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_config_key (config_key),
    INDEX idx_config_group (config_group),
    INDEX idx_category (category),
    INDEX idx_is_public (is_public),
    INDEX idx_is_editable (is_editable),
    
    -- Claves foráneas
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: activity_logs (Logs de Actividad)
-- =============================================
CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    log_code VARCHAR(100) NOT NULL,
    
    -- Usuario y sesión
    user_id VARCHAR(36) NULL,
    session_id VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- Actividad
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NULL COMMENT 'Tipo de entidad afectada',
    entity_id VARCHAR(100) NULL COMMENT 'ID de la entidad afectada',
    
    -- Detalles
    description TEXT NULL,
    changes JSON NULL COMMENT 'Cambios realizados (antes/después)',
    metadata JSON NULL COMMENT 'Metadatos adicionales',
    
    -- Contexto
    module VARCHAR(100) NULL COMMENT 'Módulo de la aplicación',
    feature VARCHAR(100) NULL COMMENT 'Funcionalidad específica',
    
    -- Resultado
    status ENUM('success', 'failed', 'warning') DEFAULT 'success',
    error_message TEXT NULL,
    
    -- Tiempo
    duration_ms INT NULL COMMENT 'Duración de la operación en milisegundos',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_log_code (log_code),
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_module (module),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar plantillas de notificación básicas
INSERT INTO notification_templates (
    template_code, name, description, type, category,
    title_template, message_template, short_message_template,
    default_channels, available_variables, created_by
) VALUES 
(
    'WELCOME_USER', 'Bienvenida de Usuario', 'Plantilla de bienvenida para nuevos usuarios',
    'success', 'system',
    'Bienvenido a Café Colombia, {{user_name}}!',
    'Hola {{user_name}}, bienvenido a la plataforma Café Colombia. Estamos emocionados de tenerte con nosotros.',
    'Bienvenido {{user_name}}!',
    '["email", "in_app"]',
    '["user_name", "user_email"]',
    'admin-001'
),
(
    'PEST_ALERT', 'Alerta de Plagas', 'Plantilla para alertas de detección de plagas',
    'warning', 'pest_alert',
    'Alerta: {{pest_name}} detectada en {{farm_name}}',
    'Se ha detectado {{pest_name}} en la finca {{farm_name}}. Nivel de confianza: {{confidence}}%. Se recomienda tomar acción inmediata.',
    'Plaga detectada: {{pest_name}}',
    '["email", "push", "in_app"]',
    '["pest_name", "farm_name", "confidence", "severity"]',
    'admin-001'
),
(
    'HARVEST_REMINDER', 'Recordatorio de Cosecha', 'Plantilla para recordatorios de cosecha',
    'reminder', 'harvest',
    'Recordatorio: Cosecha programada para {{harvest_date}}',
    'Hola {{user_name}}, te recordamos que tienes una cosecha programada para el {{harvest_date}} en {{farm_name}}.',
    'Cosecha programada: {{harvest_date}}',
    '["email", "push", "in_app"]',
    '["user_name", "harvest_date", "farm_name", "lot_name"]',
    'admin-001'
),
(
    'PAYMENT_SUCCESS', 'Pago Exitoso', 'Plantilla para confirmación de pagos exitosos',
    'success', 'payment',
    'Pago confirmado - {{amount}} {{currency}}',
    'Tu pago de {{amount}} {{currency}} ha sido procesado exitosamente. Número de transacción: {{transaction_id}}.',
    'Pago confirmado: {{amount}} {{currency}}',
    '["email", "in_app"]',
    '["amount", "currency", "transaction_id", "payment_method"]',
    'admin-001'
);

-- Insertar preferencias de notificación por defecto
INSERT INTO notification_preferences (
    user_id, category, email_enabled, push_enabled, sms_enabled, in_app_enabled,
    frequency, min_priority
) VALUES 
('admin-001', 'system', TRUE, TRUE, FALSE, TRUE, 'immediate', 'low'),
('admin-001', 'farm', TRUE, TRUE, FALSE, TRUE, 'immediate', 'medium'),
('admin-001', 'payment', TRUE, TRUE, FALSE, TRUE, 'immediate', 'medium'),
('admin-001', 'harvest', TRUE, TRUE, FALSE, TRUE, 'immediate', 'medium'),
('admin-001', 'pest_alert', TRUE, TRUE, TRUE, TRUE, 'immediate', 'low'),
('admin-001', 'weather', TRUE, TRUE, FALSE, TRUE, 'daily', 'medium'),
('admin-001', 'market', TRUE, FALSE, FALSE, TRUE, 'daily', 'medium'),
('admin-001', 'task', TRUE, TRUE, FALSE, TRUE, 'immediate', 'medium'),
('admin-001', 'subscription', TRUE, TRUE, FALSE, TRUE, 'immediate', 'medium');

-- Insertar reportes del sistema básicos
INSERT INTO system_reports (
    report_code, name, description, report_type, category,
    data_sources, output_formats, delivery_methods,
    status, created_by
) VALUES 
(
    'FARM_SUMMARY_MONTHLY', 'Resumen Mensual de Fincas', 'Reporte mensual con estadísticas de todas las fincas',
    'farm_summary', 'operational',
    '["farms", "lots", "harvests", "tasks"]',
    '["pdf", "excel"]',
    '["email", "download"]',
    'active', 'admin-001'
),
(
    'FINANCIAL_SUMMARY_QUARTERLY', 'Resumen Financiero Trimestral', 'Reporte trimestral de ingresos y gastos',
    'financial_summary', 'financial',
    '["payments", "expenses", "subscriptions"]',
    '["pdf", "excel", "csv"]',
    '["email", "download"]',
    'active', 'admin-001'
),
(
    'PEST_MONITORING_WEEKLY', 'Monitoreo Semanal de Plagas', 'Reporte semanal de detecciones de plagas',
    'pest_monitoring', 'operational',
    '["pests", "phytosanitary_detections", "ai_analysis_results"]',
    '["pdf", "excel"]',
    '["email", "download"]',
    'active', 'admin-001'
);

-- Insertar configuraciones del sistema básicas
INSERT INTO system_configs (
    config_key, config_group, config_value, value_type, name, description,
    category, is_public, is_editable
) VALUES 
(
    'app.name', 'general', 'Café Colombia', 'string', 'Nombre de la Aplicación', 'Nombre principal de la aplicación',
    'general', TRUE, TRUE
),
(
    'app.version', 'general', '1.0.0', 'string', 'Versión de la Aplicación', 'Versión actual de la aplicación',
    'general', TRUE, FALSE
),
(
    'notifications.email.enabled', 'notifications', 'true', 'boolean', 'Email Habilitado', 'Habilitar notificaciones por email',
    'notifications', FALSE, TRUE
),
(
    'notifications.push.enabled', 'notifications', 'true', 'boolean', 'Push Habilitado', 'Habilitar notificaciones push',
    'notifications', FALSE, TRUE
),
(
    'ai.confidence.threshold', 'ai', '0.75', 'number', 'Umbral de Confianza IA', 'Umbral mínimo de confianza para análisis de IA',
    'ai', FALSE, TRUE
),
(
    'reports.max.execution.time', 'reports', '300', 'number', 'Tiempo Máximo de Ejecución', 'Tiempo máximo en segundos para ejecutar reportes',
    'performance', FALSE, TRUE
),
(
    'system.maintenance.mode', 'general', 'false', 'boolean', 'Modo Mantenimiento', 'Activar modo de mantenimiento',
    'general', TRUE, TRUE
);

-- Insertar ejemplo de log de actividad
INSERT INTO activity_logs (
    log_code, user_id, action, entity_type, entity_id,
    description, module, feature, status
) VALUES (
    'LOG-INIT-001', 'admin-001', 'system_initialization', 'system', 'cafe_colombia',
    'Inicialización del sistema Café Colombia con datos básicos',
    'system', 'initialization', 'success'
);