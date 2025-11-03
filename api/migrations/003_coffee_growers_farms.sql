-- Migración 003: Caficultores y Fincas
-- Fecha: 2024-01-15
-- Descripción: Creación de tablas para gestión de caficultores y fincas

-- =============================================
-- TABLA: coffee_growers (Caficultores)
-- =============================================
CREATE TABLE coffee_growers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identification_number VARCHAR(50) NOT NULL UNIQUE,
    identification_type ENUM('cedula', 'cedula_extranjeria', 'pasaporte', 'nit') NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    birth_date DATE NULL,
    gender ENUM('masculino', 'femenino', 'otro', 'prefiero_no_decir') NULL,
    address TEXT NULL,
    department VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    rural_zone VARCHAR(100) NULL,
    
    -- Información de experiencia
    farm_experience_years INT NULL,
    coffee_experience_years INT NULL,
    
    -- Certificaciones
    certification_type ENUM('organico', 'rainforest', 'utz', 'fairtrade', 'cafe_especial', 'ninguna') NULL,
    certification_number VARCHAR(100) NULL,
    certification_expiry DATE NULL,
    
    -- Información de producción
    total_farm_area DECIMAL(10,2) NULL COMMENT 'Área total en hectáreas',
    coffee_area DECIMAL(10,2) NULL COMMENT 'Área de café en hectáreas',
    other_crops TEXT NULL,
    farming_practices ENUM('tradicional', 'organico', 'sostenible', 'agroecologico', 'convencional') NULL,
    processing_method ENUM('lavado', 'natural', 'honey', 'semi_lavado', 'experimental') NULL,
    annual_production DECIMAL(10,2) NULL COMMENT 'Producción anual en kg',
    quality_score INT NULL COMMENT 'Puntuación de calidad 1-100',
    preferred_varieties TEXT NULL,
    
    -- Metadatos
    notes TEXT NULL,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    deleted_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_identification (identification_number),
    INDEX idx_department (department),
    INDEX idx_municipality (municipality),
    INDEX idx_status (status),
    INDEX idx_certification (certification_type),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id),
    FOREIGN KEY (deleted_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: farms (Fincas)
-- =============================================
CREATE TABLE farms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coffee_grower_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NULL UNIQUE COMMENT 'Código único de la finca',
    description TEXT NULL,
    
    -- Ubicación
    address TEXT NOT NULL,
    department VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    rural_zone VARCHAR(100) NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    altitude INT NULL COMMENT 'Altitud en metros sobre el nivel del mar',
    
    -- Información básica de áreas
    total_area DECIMAL(10,2) NOT NULL COMMENT 'Área total en hectáreas',
    coffee_area DECIMAL(10,2) NOT NULL COMMENT 'Área de café en hectáreas',
    other_crops_area DECIMAL(10,2) NULL COMMENT 'Área de otros cultivos en hectáreas',
    forest_area DECIMAL(10,2) NULL COMMENT 'Área de bosque en hectáreas',
    infrastructure_area DECIMAL(10,2) NULL COMMENT 'Área de infraestructura en hectáreas',
    
    -- Información del suelo
    soil_type ENUM('arcilloso', 'arenoso', 'limoso', 'franco', 'volcanico', 'otro') NULL,
    ph_level DECIMAL(3,1) NULL,
    organic_matter_percentage DECIMAL(5,2) NULL,
    nitrogen_level VARCHAR(20) NULL,
    phosphorus_level VARCHAR(20) NULL,
    potassium_level VARCHAR(20) NULL,
    drainage_quality ENUM('excelente', 'bueno', 'regular', 'malo') NULL,
    erosion_risk ENUM('bajo', 'medio', 'alto') NULL,
    
    -- Información climática
    average_temperature DECIMAL(4,1) NULL COMMENT 'Temperatura promedio en °C',
    min_temperature DECIMAL(4,1) NULL,
    max_temperature DECIMAL(4,1) NULL,
    annual_rainfall DECIMAL(6,1) NULL COMMENT 'Precipitación anual en mm',
    humidity_percentage DECIMAL(5,2) NULL,
    climate_type ENUM('tropical', 'subtropical', 'templado', 'frio', 'paramo') NULL,
    
    -- Información técnica
    irrigation_type ENUM('riego', 'secano', 'mixto') NOT NULL,
    coffee_varieties JSON NULL COMMENT 'Array de variedades de café',
    planting_density INT NULL COMMENT 'Plantas por hectárea',
    tree_age_years INT NULL,
    processing_method ENUM('lavado', 'natural', 'honey', 'semi_lavado', 'experimental') NOT NULL,
    
    -- Certificaciones
    certification_status ENUM('certificada', 'en_proceso', 'no_certificada') NOT NULL,
    certifications JSON NULL COMMENT 'Array de certificaciones',
    certification_expiry DATE NULL,
    
    -- Producción
    annual_production DECIMAL(10,2) NULL COMMENT 'Producción anual en kg',
    last_harvest_date DATE NULL,
    next_harvest_date DATE NULL,
    
    -- Infraestructura
    has_processing_facility BOOLEAN NOT NULL DEFAULT FALSE,
    has_storage_facility BOOLEAN NOT NULL DEFAULT FALSE,
    has_drying_facility BOOLEAN NOT NULL DEFAULT FALSE,
    has_water_source BOOLEAN NOT NULL DEFAULT FALSE,
    has_electricity BOOLEAN NOT NULL DEFAULT FALSE,
    access_road_condition ENUM('excelente', 'bueno', 'regular', 'malo') NULL,
    
    -- Prácticas agrícolas
    farming_practices JSON NULL COMMENT 'Array de prácticas agrícolas',
    pest_control_methods JSON NULL COMMENT 'Array de métodos de control de plagas',
    fertilization_program TEXT NULL,
    pruning_schedule TEXT NULL,
    
    -- Metadatos
    status ENUM('active', 'inactive', 'maintenance', 'abandoned') NOT NULL DEFAULT 'active',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    deleted_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_coffee_grower (coffee_grower_id),
    INDEX idx_department (department),
    INDEX idx_municipality (municipality),
    INDEX idx_status (status),
    INDEX idx_certification_status (certification_status),
    INDEX idx_irrigation_type (irrigation_type),
    INDEX idx_processing_method (processing_method),
    INDEX idx_coordinates (latitude, longitude),
    INDEX idx_created_at (created_at),
    
    -- Claves foráneas
    FOREIGN KEY (coffee_grower_id) REFERENCES coffee_growers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id),
    FOREIGN KEY (deleted_by) REFERENCES admin_users(id)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar caficultor de ejemplo
INSERT INTO coffee_growers (
    identification_number,
    identification_type,
    full_name,
    email,
    phone,
    department,
    municipality,
    farm_experience_years,
    coffee_experience_years,
    certification_type,
    total_farm_area,
    coffee_area,
    farming_practices,
    processing_method,
    annual_production,
    quality_score,
    status,
    created_by
) VALUES (
    '12345678',
    'cedula',
    'Juan Carlos Pérez',
    'juan.perez@email.com',
    '+57 300 123 4567',
    'Huila',
    'Pitalito',
    15,
    12,
    'organico',
    5.5,
    4.2,
    'organico',
    'lavado',
    8500.00,
    85,
    'active',
    'admin-001'
);

-- Insertar finca de ejemplo
INSERT INTO farms (
    coffee_grower_id,
    name,
    code,
    description,
    address,
    department,
    municipality,
    rural_zone,
    latitude,
    longitude,
    altitude,
    total_area,
    coffee_area,
    other_crops_area,
    forest_area,
    soil_type,
    ph_level,
    average_temperature,
    annual_rainfall,
    climate_type,
    irrigation_type,
    coffee_varieties,
    planting_density,
    tree_age_years,
    processing_method,
    certification_status,
    certifications,
    annual_production,
    has_processing_facility,
    has_storage_facility,
    has_drying_facility,
    has_water_source,
    has_electricity,
    access_road_condition,
    farming_practices,
    status,
    created_by
) VALUES (
    1,
    'Finca El Paraíso',
    'FEP-001',
    'Finca cafetera especializada en café orgánico de alta calidad',
    'Vereda El Paraíso, Km 5 vía Pitalito-San Agustín',
    'Huila',
    'Pitalito',
    'El Paraíso',
    1.8833,
    -76.0500,
    1650,
    5.50,
    4.20,
    0.80,
    0.50,
    'franco',
    6.2,
    19.5,
    1800.0,
    'templado',
    'secano',
    '["caturra", "colombia", "castillo"]',
    5500,
    8,
    'lavado',
    'certificada',
    '["organico", "rainforest"]',
    8500.00,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    'bueno',
    '["organico", "sostenible", "agroecologico"]',
    'active',
    'admin-001'
);