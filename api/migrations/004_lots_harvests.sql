-- Migración 004: Lotes y Cosechas
-- Fecha: 2024-01-15
-- Descripción: Creación de tablas para gestión de lotes y cosechas

-- =============================================
-- TABLA: lots (Lotes)
-- =============================================
CREATE TABLE lots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NULL UNIQUE COMMENT 'Código único del lote',
    description TEXT NULL,
    
    -- Ubicación dentro de la finca
    location_description TEXT NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    altitude INT NULL COMMENT 'Altitud en metros sobre el nivel del mar',
    
    -- Información básica
    area DECIMAL(10,2) NOT NULL COMMENT 'Área del lote en hectáreas',
    slope_percentage DECIMAL(5,2) NULL COMMENT 'Porcentaje de pendiente',
    orientation ENUM('norte', 'sur', 'este', 'oeste', 'noreste', 'noroeste', 'sureste', 'suroeste') NULL,
    
    -- Información del cultivo
    coffee_variety ENUM('arabica', 'robusta', 'caturra', 'colombia', 'castillo', 'geisha', 'bourbon', 'typica', 'otro') NOT NULL,
    planting_date DATE NULL,
    planting_density INT NULL COMMENT 'Plantas por hectárea',
    tree_age_years INT NULL,
    renovation_date DATE NULL,
    
    -- Información del suelo específica del lote
    soil_type ENUM('arcilloso', 'arenoso', 'limoso', 'franco', 'volcanico', 'otro') NULL,
    ph_level DECIMAL(3,1) NULL,
    organic_matter_percentage DECIMAL(5,2) NULL,
    drainage_quality ENUM('excelente', 'bueno', 'regular', 'malo') NULL,
    
    -- Manejo agronómico
    irrigation_system ENUM('goteo', 'aspersion', 'microaspersion', 'gravedad', 'ninguno') NULL,
    shade_type ENUM('sin_sombra', 'sombra_regulada', 'sombra_diversificada', 'bosque') NULL,
    shade_percentage DECIMAL(5,2) NULL,
    
    -- Producción estimada
    estimated_annual_production DECIMAL(10,2) NULL COMMENT 'Producción estimada anual en kg',
    last_production_kg DECIMAL(10,2) NULL,
    average_quality_score INT NULL COMMENT 'Puntuación promedio de calidad 1-100',
    
    -- Estado y metadatos
    status ENUM('active', 'inactive', 'renovation', 'abandoned') NOT NULL DEFAULT 'active',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    deleted_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_farm (farm_id),
    INDEX idx_variety (coffee_variety),
    INDEX idx_status (status),
    INDEX idx_planting_date (planting_date),
    INDEX idx_coordinates (latitude, longitude),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id),
    FOREIGN KEY (deleted_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: harvests (Cosechas)
-- =============================================
CREATE TABLE harvests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lot_id INT NOT NULL,
    harvest_date DATE NOT NULL,
    
    -- Información de la cosecha
    quantity_kg DECIMAL(10,2) NOT NULL COMMENT 'Cantidad cosechada en kilogramos',
    quality_grade ENUM('A', 'B', 'C', 'D', 'Premium', 'Especial') NULL,
    moisture_percentage DECIMAL(5,2) NULL,
    defect_percentage DECIMAL(5,2) NULL,
    
    -- Condiciones climáticas durante la cosecha
    weather_conditions ENUM('soleado', 'nublado', 'lluvioso', 'mixto') NULL,
    temperature_celsius DECIMAL(4,1) NULL,
    humidity_percentage DECIMAL(5,2) NULL,
    
    -- Información del proceso
    harvest_method ENUM('manual', 'mecanico', 'mixto') NOT NULL DEFAULT 'manual',
    processing_method ENUM('lavado', 'natural', 'honey', 'semi_lavado', 'experimental') NOT NULL,
    fermentation_hours INT NULL,
    drying_method ENUM('patio', 'marquesina', 'secadora_mecanica', 'mixto') NULL,
    drying_days INT NULL,
    
    -- Personal y costos
    workers_count INT NULL,
    workers_data JSON NULL COMMENT 'Array con información de trabajadores',
    labor_cost DECIMAL(10,2) NULL,
    processing_cost DECIMAL(10,2) NULL,
    total_cost DECIMAL(10,2) NULL,
    
    -- Calidad y análisis
    cup_score DECIMAL(4,2) NULL COMMENT 'Puntuación de taza (0-100)',
    acidity_level ENUM('bajo', 'medio', 'alto') NULL,
    body_level ENUM('ligero', 'medio', 'completo') NULL,
    aroma_intensity ENUM('bajo', 'medio', 'alto', 'intenso') NULL,
    flavor_notes TEXT NULL,
    
    -- Destino y comercialización
    destination ENUM('venta_directa', 'cooperativa', 'exportacion', 'consumo_propio', 'almacenamiento') NULL,
    price_per_kg DECIMAL(10,2) NULL,
    total_revenue DECIMAL(10,2) NULL,
    buyer_information TEXT NULL,
    
    -- Trazabilidad
    batch_number VARCHAR(100) NULL,
    certification_applied BOOLEAN DEFAULT FALSE,
    organic_certified BOOLEAN DEFAULT FALSE,
    fair_trade_certified BOOLEAN DEFAULT FALSE,
    
    -- Estado y metadatos
    status ENUM('pending', 'in_process', 'completed', 'sold') NOT NULL DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    deleted_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_lot (lot_id),
    INDEX idx_harvest_date (harvest_date),
    INDEX idx_quality_grade (quality_grade),
    INDEX idx_processing_method (processing_method),
    INDEX idx_status (status),
    INDEX idx_batch_number (batch_number),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id),
    FOREIGN KEY (deleted_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: production_data (Datos de Producción Histórica)
-- =============================================
CREATE TABLE production_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lot_id INT NOT NULL,
    harvest_year YEAR NOT NULL,
    
    -- Datos de producción
    total_production_kg DECIMAL(10,2) NOT NULL,
    quality_score DECIMAL(4,2) NULL COMMENT 'Puntuación promedio de calidad',
    average_price_per_kg DECIMAL(10,2) NULL,
    total_revenue DECIMAL(12,2) NULL,
    production_costs DECIMAL(12,2) NULL,
    net_profit DECIMAL(12,2) NULL,
    
    -- Métricas de eficiencia
    yield_per_hectare DECIMAL(10,2) NULL COMMENT 'Rendimiento por hectárea',
    trees_per_hectare INT NULL,
    production_per_tree DECIMAL(6,3) NULL COMMENT 'Producción promedio por árbol en kg',
    
    -- Factores climáticos del año
    annual_rainfall DECIMAL(6,1) NULL COMMENT 'Precipitación anual en mm',
    average_temperature DECIMAL(4,1) NULL,
    extreme_weather_events TEXT NULL,
    
    -- Manejo agronómico aplicado
    fertilization_program TEXT NULL,
    pest_control_applications INT NULL,
    pruning_performed BOOLEAN DEFAULT FALSE,
    renovation_percentage DECIMAL(5,2) NULL,
    
    -- Observaciones y notas
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_lot_year (lot_id, harvest_year),
    INDEX idx_harvest_year (harvest_year),
    INDEX idx_yield (yield_per_hectare),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id),
    
    -- Constraint único para evitar duplicados
    UNIQUE KEY unique_lot_year (lot_id, harvest_year)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar lote de ejemplo
INSERT INTO lots (
    farm_id,
    name,
    code,
    description,
    location_description,
    latitude,
    longitude,
    altitude,
    area,
    slope_percentage,
    orientation,
    coffee_variety,
    planting_date,
    planting_density,
    tree_age_years,
    soil_type,
    ph_level,
    organic_matter_percentage,
    drainage_quality,
    irrigation_system,
    shade_type,
    shade_percentage,
    estimated_annual_production,
    average_quality_score,
    status,
    created_by
) VALUES (
    1,
    'Lote La Esperanza',
    'LE-001',
    'Lote principal con café caturra de alta calidad',
    'Parte alta de la finca, cerca del bosque nativo',
    1.8835,
    -76.0505,
    1680,
    2.50,
    15.5,
    'sureste',
    'caturra',
    '2016-03-15',
    5500,
    8,
    'franco',
    6.3,
    4.2,
    'bueno',
    'ninguno',
    'sombra_regulada',
    25.0,
    5000.00,
    88,
    'active',
    'admin-001'
);

-- Insertar cosecha de ejemplo
INSERT INTO harvests (
    lot_id,
    harvest_date,
    quantity_kg,
    quality_grade,
    moisture_percentage,
    defect_percentage,
    weather_conditions,
    temperature_celsius,
    humidity_percentage,
    harvest_method,
    processing_method,
    fermentation_hours,
    drying_method,
    drying_days,
    workers_count,
    labor_cost,
    processing_cost,
    total_cost,
    cup_score,
    acidity_level,
    body_level,
    aroma_intensity,
    flavor_notes,
    destination,
    price_per_kg,
    total_revenue,
    batch_number,
    certification_applied,
    organic_certified,
    status,
    created_by
) VALUES (
    1,
    '2024-10-15',
    1250.50,
    'A',
    11.5,
    2.1,
    'soleado',
    22.5,
    65.0,
    'manual',
    'lavado',
    18,
    'patio',
    12,
    8,
    450000.00,
    125000.00,
    575000.00,
    86.5,
    'medio',
    'medio',
    'alto',
    'Notas de chocolate, caramelo y frutas cítricas',
    'cooperativa',
    8500.00,
    10629250.00,
    'LE-001-2024-10',
    TRUE,
    TRUE,
    'completed',
    'admin-001'
);

-- Insertar datos de producción histórica
INSERT INTO production_data (
    lot_id,
    harvest_year,
    total_production_kg,
    quality_score,
    average_price_per_kg,
    total_revenue,
    production_costs,
    net_profit,
    yield_per_hectare,
    trees_per_hectare,
    production_per_tree,
    annual_rainfall,
    average_temperature,
    fertilization_program,
    pest_control_applications,
    pruning_performed,
    notes,
    created_by
) VALUES (
    1,
    2024,
    5125.75,
    87.2,
    8200.00,
    42031150.00,
    15500000.00,
    26531150.00,
    2050.30,
    5500,
    0.932,
    1850.5,
    19.8,
    'Fertilización orgánica trimestral con compost y lombricompuesto',
    3,
    TRUE,
    'Excelente año productivo con condiciones climáticas favorables',
    'admin-001'
);