-- Migración 005: Inventarios y Control Fitosanitario
-- Fecha: 2024-01-15
-- Descripción: Creación de tablas para gestión de inventarios y control fitosanitario

-- =============================================
-- TABLA: inventory_categories (Categorías de Inventario)
-- =============================================
CREATE TABLE inventory_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    code VARCHAR(50) NULL UNIQUE,
    parent_id INT NULL COMMENT 'Para categorías jerárquicas',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_parent (parent_id),
    INDEX idx_code (code),
    
    -- Claves foráneas
    FOREIGN KEY (parent_id) REFERENCES inventory_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: inventory_items (Artículos de Inventario)
-- =============================================
CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    category_id INT NOT NULL,
    
    -- Información básica del artículo
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    code VARCHAR(100) NULL UNIQUE,
    barcode VARCHAR(255) NULL,
    
    -- Clasificación
    item_type ENUM('insumo', 'herramienta', 'maquinaria', 'producto', 'material') NOT NULL,
    unit_of_measure ENUM('kg', 'g', 'l', 'ml', 'unidad', 'caja', 'saco', 'bulto', 'galon', 'libra') NOT NULL,
    
    -- Información de inventario
    current_stock DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    minimum_stock DECIMAL(10,3) NULL COMMENT 'Stock mínimo para alertas',
    maximum_stock DECIMAL(10,3) NULL COMMENT 'Stock máximo recomendado',
    reorder_point DECIMAL(10,3) NULL COMMENT 'Punto de reorden',
    
    -- Información económica
    unit_cost DECIMAL(10,2) NULL COMMENT 'Costo unitario',
    average_cost DECIMAL(10,2) NULL COMMENT 'Costo promedio ponderado',
    last_purchase_price DECIMAL(10,2) NULL,
    last_purchase_date DATE NULL,
    
    -- Información del proveedor
    supplier_name VARCHAR(255) NULL,
    supplier_contact VARCHAR(255) NULL,
    
    -- Información de almacenamiento
    storage_location VARCHAR(255) NULL,
    storage_conditions TEXT NULL COMMENT 'Condiciones especiales de almacenamiento',
    
    -- Fechas importantes
    expiration_date DATE NULL,
    last_inventory_date DATE NULL,
    
    -- Estado y metadatos
    status ENUM('active', 'inactive', 'discontinued') NOT NULL DEFAULT 'active',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    deleted_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_farm (farm_id),
    INDEX idx_category (category_id),
    INDEX idx_code (code),
    INDEX idx_barcode (barcode),
    INDEX idx_type (item_type),
    INDEX idx_status (status),
    INDEX idx_stock_level (current_stock),
    INDEX idx_expiration (expiration_date),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id),
    FOREIGN KEY (deleted_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: inventory_movements (Movimientos de Inventario)
-- =============================================
CREATE TABLE inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    
    -- Información del movimiento
    movement_type ENUM('entrada', 'salida', 'ajuste', 'transferencia', 'merma', 'devolucion') NOT NULL,
    movement_date DATETIME NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) NULL,
    total_cost DECIMAL(10,2) NULL,
    
    -- Información de referencia
    reference_type ENUM('compra', 'venta', 'uso_interno', 'ajuste_inventario', 'transferencia', 'merma', 'devolucion') NULL,
    reference_id INT NULL COMMENT 'ID de la transacción de referencia',
    reference_number VARCHAR(100) NULL COMMENT 'Número de documento de referencia',
    
    -- Información adicional
    reason TEXT NULL COMMENT 'Razón del movimiento',
    notes TEXT NULL,
    
    -- Información de ubicación
    from_location VARCHAR(255) NULL,
    to_location VARCHAR(255) NULL,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_item (item_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_movement_date (movement_date),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: pests_diseases (Plagas y Enfermedades)
-- =============================================
CREATE TABLE pests_diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255) NULL,
    common_names JSON NULL COMMENT 'Array de nombres comunes',
    type ENUM('plaga', 'enfermedad', 'virus', 'bacteria', 'hongo', 'nematodo', 'acaro', 'insecto') NOT NULL,
    
    -- Descripción y características
    description TEXT NULL,
    symptoms TEXT NULL COMMENT 'Síntomas que produce',
    affected_parts JSON NULL COMMENT 'Partes de la planta afectadas',
    
    -- Condiciones favorables
    favorable_conditions TEXT NULL,
    temperature_range VARCHAR(50) NULL,
    humidity_range VARCHAR(50) NULL,
    season_occurrence VARCHAR(100) NULL,
    
    -- Nivel de amenaza
    severity_level ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
    economic_impact ENUM('bajo', 'medio', 'alto', 'muy_alto') NULL,
    
    -- Información de control
    prevention_methods TEXT NULL,
    organic_control_methods TEXT NULL,
    chemical_control_methods TEXT NULL,
    biological_control_methods TEXT NULL,
    
    -- Metadatos
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_type (type),
    INDEX idx_severity (severity_level),
    INDEX idx_active (is_active),
    INDEX idx_name (name),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: phytosanitary_inspections (Inspecciones Fitosanitarias)
-- =============================================
CREATE TABLE phytosanitary_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    lot_id INT NULL COMMENT 'Lote específico inspeccionado',
    
    -- Información de la inspección
    inspection_date DATE NOT NULL,
    inspection_time TIME NULL,
    inspector_name VARCHAR(255) NOT NULL,
    inspection_type ENUM('rutinaria', 'seguimiento', 'emergencia', 'certificacion') NOT NULL DEFAULT 'rutinaria',
    
    -- Condiciones durante la inspección
    weather_conditions ENUM('soleado', 'nublado', 'lluvioso', 'ventoso') NULL,
    temperature DECIMAL(4,1) NULL,
    humidity_percentage DECIMAL(5,2) NULL,
    
    -- Área inspeccionada
    area_inspected DECIMAL(10,2) NULL COMMENT 'Área en hectáreas',
    trees_inspected INT NULL,
    sampling_method ENUM('sistematico', 'aleatorio', 'dirigido', 'completo') NULL,
    
    -- Resultados generales
    overall_health_status ENUM('excelente', 'bueno', 'regular', 'malo', 'critico') NOT NULL,
    pest_pressure_level ENUM('nulo', 'bajo', 'medio', 'alto', 'muy_alto') NOT NULL DEFAULT 'nulo',
    disease_pressure_level ENUM('nulo', 'bajo', 'medio', 'alto', 'muy_alto') NOT NULL DEFAULT 'nulo',
    
    -- Observaciones y recomendaciones
    general_observations TEXT NULL,
    recommendations TEXT NULL,
    urgent_actions_required TEXT NULL,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE NULL,
    
    -- Metadatos
    status ENUM('programada', 'en_progreso', 'completada', 'cancelada') NOT NULL DEFAULT 'programada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_farm (farm_id),
    INDEX idx_lot (lot_id),
    INDEX idx_inspection_date (inspection_date),
    INDEX idx_inspection_type (inspection_type),
    INDEX idx_health_status (overall_health_status),
    INDEX idx_status (status),
    INDEX idx_follow_up (follow_up_required, follow_up_date),
    
    -- Claves foráneas
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: phytosanitary_detections (Detecciones Fitosanitarias)
-- =============================================
CREATE TABLE phytosanitary_detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    pest_disease_id INT NOT NULL,
    
    -- Información de la detección
    detection_date DATE NOT NULL,
    affected_area DECIMAL(10,2) NULL COMMENT 'Área afectada en hectáreas',
    affected_trees_count INT NULL,
    affected_trees_percentage DECIMAL(5,2) NULL,
    
    -- Severidad de la afectación
    severity_level ENUM('leve', 'moderado', 'severo', 'critico') NOT NULL,
    incidence_percentage DECIMAL(5,2) NULL COMMENT 'Porcentaje de incidencia',
    intensity_level ENUM('bajo', 'medio', 'alto') NULL COMMENT 'Intensidad del daño',
    
    -- Ubicación específica
    location_description TEXT NULL,
    gps_coordinates VARCHAR(100) NULL,
    affected_plant_parts JSON NULL COMMENT 'Partes de la planta afectadas',
    
    -- Condiciones asociadas
    associated_factors TEXT NULL COMMENT 'Factores que favorecieron la aparición',
    stage_of_development ENUM('inicial', 'desarrollo', 'avanzado', 'critico') NOT NULL,
    
    -- Acciones tomadas
    immediate_actions TEXT NULL,
    treatment_applied BOOLEAN DEFAULT FALSE,
    treatment_date DATE NULL,
    treatment_method VARCHAR(255) NULL,
    treatment_products JSON NULL COMMENT 'Productos utilizados en el tratamiento',
    
    -- Seguimiento
    monitoring_required BOOLEAN DEFAULT TRUE,
    next_monitoring_date DATE NULL,
    
    -- Metadatos
    notes TEXT NULL,
    photos JSON NULL COMMENT 'URLs de fotos de la detección',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_inspection (inspection_id),
    INDEX idx_pest_disease (pest_disease_id),
    INDEX idx_detection_date (detection_date),
    INDEX idx_severity (severity_level),
    INDEX idx_treatment (treatment_applied, treatment_date),
    INDEX idx_monitoring (monitoring_required, next_monitoring_date),
    
    -- Claves foráneas
    FOREIGN KEY (inspection_id) REFERENCES phytosanitary_inspections(id) ON DELETE CASCADE,
    FOREIGN KEY (pest_disease_id) REFERENCES pests_diseases(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: phytosanitary_treatments (Tratamientos Fitosanitarios)
-- =============================================
CREATE TABLE phytosanitary_treatments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    detection_id INT NULL COMMENT 'Detección que originó el tratamiento',
    farm_id INT NOT NULL,
    lot_id INT NULL,
    
    -- Información del tratamiento
    treatment_date DATE NOT NULL,
    treatment_time TIME NULL,
    treatment_type ENUM('preventivo', 'curativo', 'erradicacion', 'control') NOT NULL,
    application_method ENUM('aspersion', 'espolvoreo', 'inyeccion', 'cebo', 'trampa', 'biologico', 'manual') NOT NULL,
    
    -- Productos utilizados
    products_used JSON NOT NULL COMMENT 'Array de productos con dosis y concentraciones',
    total_product_cost DECIMAL(10,2) NULL,
    
    -- Área tratada
    area_treated DECIMAL(10,2) NULL COMMENT 'Área en hectáreas',
    trees_treated INT NULL,
    
    -- Condiciones de aplicación
    weather_conditions ENUM('soleado', 'nublado', 'sin_viento', 'viento_leve') NULL,
    temperature DECIMAL(4,1) NULL,
    humidity_percentage DECIMAL(5,2) NULL,
    wind_speed VARCHAR(50) NULL,
    
    -- Personal y equipos
    applicator_name VARCHAR(255) NULL,
    equipment_used VARCHAR(255) NULL,
    protective_equipment_used TEXT NULL,
    
    -- Costos y recursos
    labor_hours DECIMAL(5,2) NULL,
    labor_cost DECIMAL(10,2) NULL,
    equipment_cost DECIMAL(10,2) NULL,
    total_treatment_cost DECIMAL(10,2) NULL,
    
    -- Seguimiento y eficacia
    expected_efficacy_percentage DECIMAL(5,2) NULL,
    evaluation_date DATE NULL,
    actual_efficacy_percentage DECIMAL(5,2) NULL,
    side_effects TEXT NULL,
    
    -- Información de seguridad
    pre_harvest_interval_days INT NULL COMMENT 'Días antes de cosecha',
    re_entry_interval_hours INT NULL COMMENT 'Horas antes de reingreso',
    safety_precautions TEXT NULL,
    
    -- Metadatos
    notes TEXT NULL,
    status ENUM('programado', 'aplicado', 'evaluado', 'completado') NOT NULL DEFAULT 'programado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_detection (detection_id),
    INDEX idx_farm (farm_id),
    INDEX idx_lot (lot_id),
    INDEX idx_treatment_date (treatment_date),
    INDEX idx_treatment_type (treatment_type),
    INDEX idx_status (status),
    INDEX idx_evaluation (evaluation_date),
    
    -- Claves foráneas
    FOREIGN KEY (detection_id) REFERENCES phytosanitary_detections(id) ON DELETE SET NULL,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar categorías de inventario
INSERT INTO inventory_categories (name, description, code, created_by) VALUES
('Fertilizantes', 'Productos para nutrición de plantas', 'FERT', 'admin-001'),
('Pesticidas', 'Productos para control de plagas y enfermedades', 'PEST', 'admin-001'),
('Herramientas', 'Herramientas de trabajo agrícola', 'HERR', 'admin-001'),
('Maquinaria', 'Equipos y maquinaria agrícola', 'MAQUI', 'admin-001'),
('Materiales', 'Materiales diversos para la finca', 'MAT', 'admin-001');

-- Insertar artículo de inventario de ejemplo
INSERT INTO inventory_items (
    farm_id, category_id, name, description, code, item_type,
    unit_of_measure, current_stock, minimum_stock, unit_cost,
    supplier_name, storage_location, status, created_by
) VALUES (
    1, 1, 'Fertilizante Orgánico Compost', 'Compost orgánico para nutrición del café',
    'FERT-001', 'insumo', 'kg', 500.000, 100.000, 1200.00,
    'Abonos Orgánicos S.A.S.', 'Bodega Principal', 'active', 'admin-001'
);

-- Insertar plagas y enfermedades comunes del café
INSERT INTO pests_diseases (
    name, scientific_name, type, description, symptoms,
    affected_parts, severity_level, prevention_methods, created_by
) VALUES 
(
    'Broca del Café', 'Hypothenemus hampei', 'insecto',
    'Insecto que perfora los granos de café causando pérdidas significativas',
    'Perforaciones circulares en los granos, presencia de polvo blanco',
    '["granos", "frutos"]', 'alta',
    'Recolección oportuna, trampas con alcohol, control biológico', 'admin-001'
),
(
    'Roya del Café', 'Hemileia vastatrix', 'hongo',
    'Enfermedad fúngica que afecta las hojas del café',
    'Manchas amarillas en el envés de las hojas, defoliación prematura',
    '["hojas"]', 'critica',
    'Variedades resistentes, manejo de sombra, fungicidas preventivos', 'admin-001'
),
(
    'Antracnosis', 'Colletotrichum spp.', 'hongo',
    'Enfermedad que afecta frutos y ramas del café',
    'Manchas necróticas en frutos, muerte regresiva de ramas',
    '["frutos", "ramas", "hojas"]', 'media',
    'Poda sanitaria, manejo de humedad, fungicidas', 'admin-001'
);

-- Insertar inspección fitosanitaria de ejemplo
INSERT INTO phytosanitary_inspections (
    farm_id, lot_id, inspection_date, inspector_name, inspection_type,
    weather_conditions, temperature, humidity_percentage, area_inspected,
    trees_inspected, overall_health_status, pest_pressure_level,
    disease_pressure_level, general_observations, recommendations,
    status, created_by
) VALUES (
    1, 1, '2024-01-15', 'Dr. María González - Ingeniera Agrónoma', 'rutinaria',
    'soleado', 21.5, 68.5, 2.50, 150, 'bueno', 'bajo', 'bajo',
    'Plantación en buen estado general. Se observa presencia leve de broca en algunos frutos.',
    'Continuar con monitoreo semanal. Implementar trampas para broca en puntos estratégicos.',
    'completada', 'admin-001'
);