-- Migración 009: Análisis de IA y Funcionalidades Avanzadas
-- Fecha: 2024-01-18
-- Descripción: Creación de tablas para análisis de IA, predicciones, diagnósticos y optimización

-- =============================================
-- TABLA: ai_analysis_results (Resultados de Análisis de IA)
-- =============================================
CREATE TABLE ai_analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación del análisis
    analysis_code VARCHAR(100) NOT NULL UNIQUE,
    agent_type ENUM('phytosanitary', 'predictive', 'rag_assistant', 'optimization') NOT NULL,
    
    -- Relaciones
    farm_id INT NULL,
    lot_id INT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Datos de entrada y resultado
    input_data JSON NOT NULL COMMENT 'Datos de entrada para el análisis',
    result_data JSON NULL COMMENT 'Resultado del análisis de IA',
    
    -- Estado y procesamiento
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    
    -- Métricas de calidad
    confidence_score DECIMAL(5,4) NULL COMMENT 'Puntuación de confianza (0-1)',
    processing_time_ms INT NULL COMMENT 'Tiempo de procesamiento en milisegundos',
    
    -- Información de errores y reintentos
    error_message TEXT NULL,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    
    -- Sincronización
    sync_status ENUM('pending', 'syncing', 'synced', 'failed') DEFAULT 'pending',
    last_sync_at DATETIME NULL,
    pending_sync BOOLEAN DEFAULT TRUE,
    sync_action ENUM('create', 'update', 'delete') DEFAULT 'create',
    
    -- Metadatos
    metadata JSON NULL COMMENT 'Metadatos adicionales del análisis',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Índices
    INDEX idx_analysis_code (analysis_code),
    INDEX idx_agent_type (agent_type),
    INDEX idx_farm (farm_id),
    INDEX idx_lot (lot_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_sync_status (sync_status),
    INDEX idx_created_at (created_at),
    INDEX idx_confidence (confidence_score),
    
    -- Claves foráneas
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL,
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- =============================================
-- TABLA: phytosanitary_detections (Detecciones Fitosanitarias)
-- =============================================
CREATE TABLE phytosanitary_detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relación con análisis
    analysis_id INT NOT NULL,
    
    -- Información de la detección
    detection_type ENUM('pest', 'disease', 'deficiency', 'healthy') NOT NULL,
    pest_id INT NULL,
    confidence_score DECIMAL(5,4) NOT NULL COMMENT 'Confianza de la detección (0-1)',
    
    -- Ubicación en la imagen
    bounding_box JSON NULL COMMENT 'Coordenadas del área detectada',
    image_region VARCHAR(50) NULL COMMENT 'Región de la imagen',
    
    -- Severidad y clasificación
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    affected_area_percentage DECIMAL(5,2) NULL COMMENT 'Porcentaje del área afectada',
    
    -- Información adicional
    description TEXT NULL,
    symptoms JSON NULL COMMENT 'Síntomas identificados',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_analysis (analysis_id),
    INDEX idx_detection_type (detection_type),
    INDEX idx_pest (pest_id),
    INDEX idx_severity (severity),
    INDEX idx_confidence (confidence_score),
    
    -- Claves foráneas
    FOREIGN KEY (analysis_id) REFERENCES ai_analysis_results(id) ON DELETE CASCADE,
    FOREIGN KEY (pest_id) REFERENCES pests(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: ai_recommendations (Recomendaciones de IA)
-- =============================================
CREATE TABLE ai_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relación con análisis
    analysis_id INT NOT NULL,
    detection_id INT NULL,
    
    -- Información de la recomendación
    recommendation_type ENUM('treatment', 'prevention', 'monitoring', 'cultural_practice', 'chemical_control', 'biological_control') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Prioridad y urgencia
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    urgency_days INT NULL COMMENT 'Días para implementar la recomendación',
    
    -- Productos y tratamientos
    recommended_products JSON NULL COMMENT 'Productos recomendados',
    dosage_instructions TEXT NULL,
    application_method VARCHAR(255) NULL,
    
    -- Costos estimados
    estimated_cost DECIMAL(10,2) NULL,
    cost_currency VARCHAR(3) DEFAULT 'COP',
    
    -- Efectividad esperada
    expected_effectiveness DECIMAL(5,2) NULL COMMENT 'Efectividad esperada en porcentaje',
    implementation_difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    
    -- Estado de implementación
    implementation_status ENUM('pending', 'in_progress', 'completed', 'skipped', 'failed') DEFAULT 'pending',
    implemented_at DATETIME NULL,
    implementation_notes TEXT NULL,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_analysis (analysis_id),
    INDEX idx_detection (detection_id),
    INDEX idx_recommendation_type (recommendation_type),
    INDEX idx_priority (priority),
    INDEX idx_implementation_status (implementation_status),
    INDEX idx_urgency (urgency_days),
    
    -- Claves foráneas
    FOREIGN KEY (analysis_id) REFERENCES ai_analysis_results(id) ON DELETE CASCADE,
    FOREIGN KEY (detection_id) REFERENCES phytosanitary_detections(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: predictive_models (Modelos Predictivos)
-- =============================================
CREATE TABLE predictive_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del modelo
    model_name VARCHAR(255) NOT NULL,
    model_type ENUM('yield_prediction', 'price_forecast', 'weather_prediction', 'pest_outbreak', 'disease_risk', 'quality_assessment') NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    
    -- Configuración del modelo
    algorithm VARCHAR(100) NOT NULL,
    parameters JSON NULL COMMENT 'Parámetros del modelo',
    training_data_info JSON NULL COMMENT 'Información sobre datos de entrenamiento',
    
    -- Métricas de rendimiento
    accuracy_score DECIMAL(5,4) NULL,
    precision_score DECIMAL(5,4) NULL,
    recall_score DECIMAL(5,4) NULL,
    f1_score DECIMAL(5,4) NULL,
    
    -- Estado del modelo
    status ENUM('training', 'active', 'deprecated', 'failed') NOT NULL DEFAULT 'training',
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Fechas importantes
    trained_at DATETIME NULL,
    last_validation_at DATETIME NULL,
    deprecated_at DATETIME NULL,
    
    -- Metadatos
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    
    -- Índices
    INDEX idx_model_name (model_name),
    INDEX idx_model_type (model_type),
    INDEX idx_status (status),
    INDEX idx_is_default (is_default),
    INDEX idx_accuracy (accuracy_score),
    
    -- Claves foráneas
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- =============================================
-- TABLA: predictions (Predicciones)
-- =============================================
CREATE TABLE predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relación con modelo y entidades
    model_id INT NOT NULL,
    farm_id INT NULL,
    lot_id INT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Información de la predicción
    prediction_type ENUM('yield', 'price', 'weather', 'pest_risk', 'disease_risk', 'quality') NOT NULL,
    prediction_code VARCHAR(100) NOT NULL UNIQUE,
    
    -- Datos de entrada y resultado
    input_features JSON NOT NULL COMMENT 'Características de entrada',
    prediction_result JSON NOT NULL COMMENT 'Resultado de la predicción',
    confidence_interval JSON NULL COMMENT 'Intervalo de confianza',
    
    -- Período de predicción
    prediction_date DATE NOT NULL COMMENT 'Fecha para la cual se hace la predicción',
    prediction_horizon_days INT NOT NULL COMMENT 'Horizonte de predicción en días',
    
    -- Métricas de calidad
    confidence_score DECIMAL(5,4) NOT NULL,
    uncertainty_score DECIMAL(5,4) NULL,
    
    -- Validación posterior
    actual_value DECIMAL(15,4) NULL COMMENT 'Valor real observado',
    validation_date DATE NULL,
    prediction_error DECIMAL(15,4) NULL,
    
    -- Estado
    status ENUM('active', 'validated', 'expired', 'cancelled') DEFAULT 'active',
    
    -- Metadatos
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_prediction_code (prediction_code),
    INDEX idx_model (model_id),
    INDEX idx_farm (farm_id),
    INDEX idx_lot (lot_id),
    INDEX idx_user (user_id),
    INDEX idx_prediction_type (prediction_type),
    INDEX idx_prediction_date (prediction_date),
    INDEX idx_status (status),
    INDEX idx_confidence (confidence_score),
    
    -- Claves foráneas
    FOREIGN KEY (model_id) REFERENCES predictive_models(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL,
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TABLA: optimization_suggestions (Sugerencias de Optimización)
-- =============================================
CREATE TABLE optimization_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    farm_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Información de la sugerencia
    optimization_type ENUM('resource_allocation', 'cost_reduction', 'yield_improvement', 'quality_enhancement', 'sustainability', 'efficiency') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Análisis actual vs optimizado
    current_metrics JSON NOT NULL COMMENT 'Métricas actuales',
    optimized_metrics JSON NOT NULL COMMENT 'Métricas optimizadas proyectadas',
    improvement_percentage DECIMAL(5,2) NOT NULL COMMENT 'Porcentaje de mejora esperado',
    
    -- Implementación
    implementation_steps JSON NOT NULL COMMENT 'Pasos para implementar',
    estimated_cost DECIMAL(12,2) NULL,
    estimated_savings DECIMAL(12,2) NULL,
    payback_period_months INT NULL,
    
    -- Prioridad y factibilidad
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    feasibility_score DECIMAL(3,2) NOT NULL COMMENT 'Puntuación de factibilidad (0-10)',
    complexity ENUM('simple', 'moderate', 'complex', 'expert') NOT NULL,
    
    -- Estado de implementación
    status ENUM('suggested', 'under_review', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled') DEFAULT 'suggested',
    reviewed_by VARCHAR(36) NULL,
    reviewed_at DATETIME NULL,
    review_notes TEXT NULL,
    
    -- Seguimiento de resultados
    implemented_at DATETIME NULL,
    actual_results JSON NULL COMMENT 'Resultados reales obtenidos',
    success_rate DECIMAL(5,2) NULL COMMENT 'Tasa de éxito de la implementación',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    
    -- Índices
    INDEX idx_farm (farm_id),
    INDEX idx_user (user_id),
    INDEX idx_optimization_type (optimization_type),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_feasibility (feasibility_score),
    INDEX idx_improvement (improvement_percentage),
    INDEX idx_reviewed_by (reviewed_by),
    
    -- Claves foráneas
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: early_warning_alerts (Alertas de Alerta Temprana)
-- =============================================
CREATE TABLE early_warning_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    farm_id INT NULL,
    lot_id INT NULL,
    user_id VARCHAR(36) NOT NULL,
    prediction_id INT NULL,
    
    -- Información de la alerta
    alert_type ENUM('pest_outbreak', 'disease_risk', 'weather_extreme', 'market_volatility', 'resource_shortage', 'quality_risk') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Datos de la alerta
    alert_data JSON NOT NULL COMMENT 'Datos específicos de la alerta',
    threshold_values JSON NULL COMMENT 'Valores de umbral que activaron la alerta',
    current_values JSON NULL COMMENT 'Valores actuales',
    
    -- Tiempo y validez
    alert_date DATETIME NOT NULL,
    valid_until DATETIME NULL,
    estimated_impact_date DATE NULL,
    
    -- Acciones recomendadas
    recommended_actions JSON NULL COMMENT 'Acciones recomendadas',
    urgency_level ENUM('immediate', 'within_24h', 'within_week', 'monitor') NOT NULL,
    
    -- Estado de la alerta
    status ENUM('active', 'acknowledged', 'resolved', 'expired', 'false_positive') DEFAULT 'active',
    acknowledged_by VARCHAR(36) NULL,
    acknowledged_at DATETIME NULL,
    resolved_at DATETIME NULL,
    resolution_notes TEXT NULL,
    
    -- Notificaciones
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels JSON NULL COMMENT 'Canales de notificación utilizados',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_farm (farm_id),
    INDEX idx_lot (lot_id),
    INDEX idx_user (user_id),
    INDEX idx_prediction (prediction_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_alert_date (alert_date),
    INDEX idx_urgency (urgency_level),
    INDEX idx_acknowledged_by (acknowledged_by),
    
    -- Claves foráneas
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL,
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE SET NULL,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar modelos predictivos iniciales
INSERT INTO predictive_models (
    model_name, model_type, model_version, algorithm, 
    accuracy_score, status, is_default, description, created_by
) VALUES 
(
    'Predicción de Rendimiento Café v1.0', 'yield_prediction', '1.0.0', 'Random Forest',
    0.8500, 'active', TRUE, 'Modelo para predecir el rendimiento de cosecha basado en datos históricos y condiciones climáticas',
    'admin-001'
),
(
    'Pronóstico de Precios Café v1.0', 'price_forecast', '1.0.0', 'LSTM Neural Network',
    0.7800, 'active', TRUE, 'Modelo para pronosticar precios del café basado en tendencias del mercado',
    'admin-001'
),
(
    'Detección de Riesgo de Plagas v1.0', 'pest_outbreak', '1.0.0', 'Gradient Boosting',
    0.9200, 'active', TRUE, 'Modelo para predecir brotes de plagas basado en condiciones ambientales',
    'admin-001'
);

-- Insertar ejemplo de análisis de IA
INSERT INTO ai_analysis_results (
    analysis_code, agent_type, user_id, input_data, result_data,
    status, priority, confidence_score, processing_time_ms, created_by
) VALUES (
    'AI-PHYTO-2024-001', 'phytosanitary', 'admin-001',
    '{"image_url": "/uploads/leaf_sample_001.jpg", "farm_id": 1, "lot_id": 1}',
    '{"detections": [{"type": "pest", "confidence": 0.92, "pest_name": "Broca del café"}]}',
    'completed', 'high', 0.9200, 1500, 'admin-001'
);

-- Insertar ejemplo de detección fitosanitaria
INSERT INTO phytosanitary_detections (
    analysis_id, detection_type, confidence_score, severity,
    affected_area_percentage, description
) VALUES (
    1, 'pest', 0.9200, 'high', 15.50,
    'Detección de broca del café en hojas con síntomas característicos'
);

-- Insertar ejemplo de recomendación
INSERT INTO ai_recommendations (
    analysis_id, detection_id, recommendation_type, title, description,
    priority, urgency_days, estimated_cost, expected_effectiveness
) VALUES (
    1, 1, 'chemical_control', 'Aplicación de insecticida específico para broca',
    'Se recomienda aplicar insecticida sistémico para controlar la población de broca del café',
    'high', 7, 150000.00, 85.00
);

-- Insertar ejemplo de predicción
INSERT INTO predictions (
    model_id, user_id, prediction_type, prediction_code,
    input_features, prediction_result, prediction_date, prediction_horizon_days,
    confidence_score
) VALUES (
    1, 'admin-001', 'yield', 'PRED-YIELD-2024-001',
    '{"farm_area": 5.2, "tree_age": 8, "rainfall": 1200, "temperature": 22}',
    '{"predicted_yield": 2800, "unit": "kg", "confidence_interval": [2600, 3000]}',
    '2024-06-01', 120, 0.8500
);

-- Insertar ejemplo de sugerencia de optimización
INSERT INTO optimization_suggestions (
    farm_id, user_id, optimization_type, title, description,
    current_metrics, optimized_metrics, improvement_percentage,
    priority, feasibility_score, complexity, estimated_cost, estimated_savings
) VALUES (
    1, 'admin-001', 'yield_improvement', 'Optimización de densidad de siembra',
    'Ajustar la densidad de siembra para maximizar el rendimiento por hectárea',
    '{"current_density": 4000, "current_yield": 2500}',
    '{"optimized_density": 4500, "projected_yield": 2875}',
    15.00, 'medium', 7.50, 'moderate', 500000.00, 750000.00
);

-- Insertar ejemplo de alerta temprana
INSERT INTO early_warning_alerts (
    user_id, alert_type, severity, title, message,
    alert_data, alert_date, urgency_level, recommended_actions
) VALUES (
    'admin-001', 'weather_extreme', 'high', 'Alerta de sequía prolongada',
    'Se pronostica una sequía prolongada que podría afectar significativamente la producción',
    '{"rainfall_deficit": 40, "temperature_increase": 3.5, "duration_days": 45}',
    NOW(), 'within_24h',
    '["Implementar sistema de riego", "Aplicar mulch", "Monitorear humedad del suelo"]'
);