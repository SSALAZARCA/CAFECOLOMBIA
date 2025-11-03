-- Migración 006: Trazabilidad y Gestión de Tareas
-- Fecha: 2024-01-16
-- Descripción: Creación de tablas para trazabilidad de productos y gestión de tareas

-- =============================================
-- TABLA: traceability_records (Registros de Trazabilidad)
-- =============================================
CREATE TABLE traceability_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación del producto/lote
    lot_id INT NOT NULL,
    harvest_id INT NULL,
    batch_code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Código único del lote/batch',
    
    -- Información del producto
    product_type ENUM('cafe_verde', 'cafe_pergamino', 'cafe_tostado', 'cafe_molido', 'cafe_soluble') NOT NULL,
    variety VARCHAR(100) NULL COMMENT 'Variedad del café',
    processing_method ENUM('lavado', 'natural', 'honey', 'semi_lavado') NULL,
    
    -- Cantidades
    initial_quantity DECIMAL(10,3) NOT NULL COMMENT 'Cantidad inicial en kg',
    current_quantity DECIMAL(10,3) NOT NULL COMMENT 'Cantidad actual en kg',
    unit_of_measure ENUM('kg', 'g', 'quintal', 'arroba', 'libra') NOT NULL DEFAULT 'kg',
    
    -- Calidad
    quality_grade ENUM('supremo', 'excelso', 'extra', 'primera', 'segunda', 'tercera') NULL,
    moisture_percentage DECIMAL(4,2) NULL,
    defect_percentage DECIMAL(4,2) NULL,
    cup_score DECIMAL(4,2) NULL COMMENT 'Puntaje de catación (0-100)',
    
    -- Fechas importantes
    harvest_date DATE NULL,
    processing_start_date DATE NULL,
    processing_end_date DATE NULL,
    drying_start_date DATE NULL,
    drying_end_date DATE NULL,
    storage_date DATE NULL,
    
    -- Ubicación y almacenamiento
    current_location VARCHAR(255) NULL,
    storage_conditions TEXT NULL,
    storage_temperature_range VARCHAR(50) NULL,
    storage_humidity_range VARCHAR(50) NULL,
    
    -- Certificaciones
    organic_certified BOOLEAN DEFAULT FALSE,
    fair_trade_certified BOOLEAN DEFAULT FALSE,
    rainforest_certified BOOLEAN DEFAULT FALSE,
    utz_certified BOOLEAN DEFAULT FALSE,
    specialty_certified BOOLEAN DEFAULT FALSE,
    certifications JSON NULL COMMENT 'Array de certificaciones adicionales',
    
    -- Estado del producto
    status ENUM('en_proceso', 'almacenado', 'en_transito', 'vendido', 'exportado', 'consumido') NOT NULL DEFAULT 'en_proceso',
    
    -- Información de venta/destino
    buyer_name VARCHAR(255) NULL,
    buyer_contact VARCHAR(255) NULL,
    sale_date DATE NULL,
    sale_price_per_kg DECIMAL(10,2) NULL,
    destination_country VARCHAR(100) NULL,
    export_date DATE NULL,
    
    -- Metadatos
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_lot (lot_id),
    INDEX idx_harvest (harvest_id),
    INDEX idx_batch_code (batch_code),
    INDEX idx_product_type (product_type),
    INDEX idx_status (status),
    INDEX idx_harvest_date (harvest_date),
    INDEX idx_quality_grade (quality_grade),
    INDEX idx_certifications (organic_certified, fair_trade_certified),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
    FOREIGN KEY (harvest_id) REFERENCES harvests(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: traceability_events (Eventos de Trazabilidad)
-- =============================================
CREATE TABLE traceability_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    traceability_record_id INT NOT NULL,
    
    -- Información del evento
    event_type ENUM('cosecha', 'despulpado', 'fermentacion', 'lavado', 'secado', 'almacenamiento', 'transporte', 'procesamiento', 'empaque', 'venta', 'exportacion') NOT NULL,
    event_date DATETIME NOT NULL,
    event_location VARCHAR(255) NULL,
    
    -- Detalles del evento
    description TEXT NULL,
    quantity_before DECIMAL(10,3) NULL,
    quantity_after DECIMAL(10,3) NULL,
    quantity_lost DECIMAL(10,3) NULL COMMENT 'Cantidad perdida en el proceso',
    loss_reason VARCHAR(255) NULL,
    
    -- Condiciones del evento
    temperature DECIMAL(5,2) NULL,
    humidity_percentage DECIMAL(5,2) NULL,
    duration_hours DECIMAL(6,2) NULL,
    
    -- Personal responsable
    responsible_person VARCHAR(255) NULL,
    operator_name VARCHAR(255) NULL,
    supervisor_name VARCHAR(255) NULL,
    
    -- Equipos y materiales utilizados
    equipment_used VARCHAR(255) NULL,
    materials_used JSON NULL COMMENT 'Array de materiales utilizados',
    
    -- Calidad después del evento
    quality_notes TEXT NULL,
    quality_parameters JSON NULL COMMENT 'Parámetros de calidad medidos',
    
    -- Costos asociados
    labor_cost DECIMAL(10,2) NULL,
    material_cost DECIMAL(10,2) NULL,
    equipment_cost DECIMAL(10,2) NULL,
    total_cost DECIMAL(10,2) NULL,
    
    -- Metadatos
    photos JSON NULL COMMENT 'URLs de fotos del evento',
    documents JSON NULL COMMENT 'URLs de documentos relacionados',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_traceability_record (traceability_record_id),
    INDEX idx_event_type (event_type),
    INDEX idx_event_date (event_date),
    INDEX idx_event_location (event_location),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (traceability_record_id) REFERENCES traceability_records(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: task_categories (Categorías de Tareas)
-- =============================================
CREATE TABLE task_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    color VARCHAR(7) NULL COMMENT 'Color hexadecimal para la categoría',
    icon VARCHAR(50) NULL COMMENT 'Icono para la categoría',
    
    -- Metadatos
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_name (name),
    INDEX idx_active (is_active),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: tasks (Tareas)
-- =============================================
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    lot_id INT NULL COMMENT 'Lote específico si aplica',
    category_id INT NOT NULL,
    
    -- Información básica de la tarea
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    task_type ENUM('mantenimiento', 'cosecha', 'siembra', 'poda', 'fertilizacion', 'fumigacion', 'riego', 'control_plagas', 'control_malezas', 'capacitacion', 'inspeccion', 'administrativo', 'otro') NOT NULL,
    
    -- Prioridad y urgencia
    priority ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
    urgency ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
    
    -- Fechas y tiempo
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    estimated_duration_hours DECIMAL(6,2) NULL,
    actual_start_datetime DATETIME NULL,
    actual_end_datetime DATETIME NULL,
    actual_duration_hours DECIMAL(6,2) NULL,
    
    -- Asignación
    assigned_to VARCHAR(255) NULL COMMENT 'Persona asignada',
    assigned_team VARCHAR(255) NULL COMMENT 'Equipo asignado',
    supervisor VARCHAR(255) NULL,
    
    -- Recursos necesarios
    required_tools JSON NULL COMMENT 'Herramientas necesarias',
    required_materials JSON NULL COMMENT 'Materiales necesarios',
    required_equipment JSON NULL COMMENT 'Equipos necesarios',
    estimated_cost DECIMAL(10,2) NULL,
    actual_cost DECIMAL(10,2) NULL,
    
    -- Condiciones y requisitos
    weather_dependent BOOLEAN DEFAULT FALSE,
    min_temperature DECIMAL(4,1) NULL,
    max_temperature DECIMAL(4,1) NULL,
    max_wind_speed DECIMAL(4,1) NULL,
    no_rain_required BOOLEAN DEFAULT FALSE,
    
    -- Estado y progreso
    status ENUM('pendiente', 'en_progreso', 'pausada', 'completada', 'cancelada', 'vencida') NOT NULL DEFAULT 'pendiente',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completion_notes TEXT NULL,
    
    -- Calidad y resultados
    quality_check_required BOOLEAN DEFAULT FALSE,
    quality_check_passed BOOLEAN NULL,
    quality_notes TEXT NULL,
    results_description TEXT NULL,
    
    -- Seguimiento
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE NULL,
    follow_up_notes TEXT NULL,
    
    -- Recurrencia
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern ENUM('diario', 'semanal', 'quincenal', 'mensual', 'trimestral', 'semestral', 'anual') NULL,
    recurrence_end_date DATE NULL,
    parent_task_id INT NULL COMMENT 'Tarea padre si es recurrente',
    
    -- Metadatos
    photos JSON NULL COMMENT 'URLs de fotos de la tarea',
    documents JSON NULL COMMENT 'URLs de documentos relacionados',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    deleted_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_farm (farm_id),
    INDEX idx_lot (lot_id),
    INDEX idx_category (category_id),
    INDEX idx_task_type (task_type),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_due_date (due_date),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_recurring (is_recurring, recurrence_pattern),
    INDEX idx_parent_task (parent_task_id),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES task_categories(id),
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id),
    FOREIGN KEY (deleted_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: task_comments (Comentarios de Tareas)
-- =============================================
CREATE TABLE task_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    
    -- Información del comentario
    comment TEXT NOT NULL,
    comment_type ENUM('general', 'progreso', 'problema', 'solucion', 'calidad', 'costo') NOT NULL DEFAULT 'general',
    
    -- Archivos adjuntos
    attachments JSON NULL COMMENT 'URLs de archivos adjuntos',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_task (task_id),
    INDEX idx_comment_type (comment_type),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: task_time_logs (Registro de Tiempo de Tareas)
-- =============================================
CREATE TABLE task_time_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    
    -- Información del registro de tiempo
    worker_name VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_hours DECIMAL(6,2) NULL,
    
    -- Tipo de trabajo
    work_type ENUM('preparacion', 'ejecucion', 'limpieza', 'supervision', 'transporte', 'otro') NOT NULL DEFAULT 'ejecucion',
    description TEXT NULL,
    
    -- Costos
    hourly_rate DECIMAL(8,2) NULL,
    total_cost DECIMAL(10,2) NULL,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_task (task_id),
    INDEX idx_worker (worker_name),
    INDEX idx_start_time (start_time),
    INDEX idx_work_type (work_type),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar categorías de tareas
INSERT INTO task_categories (name, description, color, icon, created_by) VALUES
('Mantenimiento', 'Tareas de mantenimiento general de la finca', '#FF6B6B', 'wrench', 'admin-001'),
('Cosecha', 'Actividades relacionadas con la cosecha', '#4ECDC4', 'harvest', 'admin-001'),
('Cultivo', 'Tareas de siembra, poda y cuidado de plantas', '#45B7D1', 'plant', 'admin-001'),
('Control Fitosanitario', 'Control de plagas y enfermedades', '#96CEB4', 'bug', 'admin-001'),
('Fertilización', 'Aplicación de fertilizantes y nutrientes', '#FFEAA7', 'leaf', 'admin-001'),
('Administrativo', 'Tareas administrativas y de gestión', '#DDA0DD', 'clipboard', 'admin-001');

-- Insertar registro de trazabilidad de ejemplo
INSERT INTO traceability_records (
    lot_id, batch_code, product_type, variety, processing_method,
    initial_quantity, current_quantity, quality_grade, moisture_percentage,
    harvest_date, processing_start_date, current_location, status,
    organic_certified, fair_trade_certified, created_by
) VALUES (
    1, 'LOT-2024-001-CF', 'cafe_pergamino', 'Caturra', 'lavado',
    1000.000, 850.000, 'supremo', 12.5,
    '2024-01-10', '2024-01-11', 'Bodega de Secado Principal', 'almacenado',
    TRUE, TRUE, 'admin-001'
);

-- Insertar evento de trazabilidad de ejemplo
INSERT INTO traceability_events (
    traceability_record_id, event_type, event_date, event_location,
    description, quantity_before, quantity_after, duration_hours,
    responsible_person, quality_notes, created_by
) VALUES (
    1, 'despulpado', '2024-01-11 08:00:00', 'Beneficiadero Principal',
    'Despulpado mecánico de café cereza maduro',
    1200.000, 1000.000, 4.5, 'Juan Pérez - Operador',
    'Café de excelente calidad, frutos uniformemente maduros', 'admin-001'
);

-- Insertar tarea de ejemplo
INSERT INTO tasks (
    farm_id, lot_id, category_id, title, description, task_type,
    priority, start_date, due_date, estimated_duration_hours,
    assigned_to, required_tools, estimated_cost, status, created_by
) VALUES (
    1, 1, 2, 'Cosecha Selectiva Lote Norte',
    'Realizar cosecha selectiva de café maduro en el lote norte, recolectando únicamente frutos en punto óptimo de maduración',
    'cosecha', 'alta', '2024-01-20', '2024-01-25', 40.0,
    'Equipo de Cosecha A', '["canastos", "escaleras", "lonas"]', 800000.00,
    'pendiente', 'admin-001'
);