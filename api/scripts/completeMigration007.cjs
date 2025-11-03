const mysql = require('mysql2/promise');
require('dotenv').config();

async function completeMigration007() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Marcar migración 007 como ejecutada
        await connection.execute(
            'INSERT INTO migrations (filename, executed_at) VALUES (?, NOW())',
            ['007_market_analysis_subscriptions.sql']
        );
        console.log('✅ Migración 007 marcada como ejecutada');
        
        // Crear las tablas faltantes
        console.log('Creando tablas faltantes...');
        
        // market_data_sources
        await connection.execute(`
            CREATE TABLE market_data_sources (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                source_type ENUM('api', 'manual', 'scraping', 'feed') NOT NULL,
                update_frequency ENUM('tiempo_real', 'diario', 'semanal', 'mensual', 'manual') NOT NULL,
                last_update TIMESTAMP NULL,
                next_update TIMESTAMP NULL,
                api_endpoint VARCHAR(500) NULL,
                api_key_required BOOLEAN DEFAULT FALSE,
                authentication_type ENUM('none', 'api_key', 'oauth', 'basic_auth') DEFAULT 'none',
                is_active BOOLEAN DEFAULT TRUE,
                reliability_score DECIMAL(3,2) DEFAULT 5.00,
                priority_level INT DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by VARCHAR(36) NOT NULL,
                INDEX idx_source_type (source_type),
                INDEX idx_active (is_active),
                INDEX idx_update_frequency (update_frequency),
                INDEX idx_last_update (last_update),
                FOREIGN KEY (created_by) REFERENCES admin_users(id)
            )
        `);
        console.log('✅ Tabla market_data_sources creada');
        
        // market_analysis
        await connection.execute(`
            CREATE TABLE market_analysis (
                id INT AUTO_INCREMENT PRIMARY KEY,
                source_id INT NOT NULL,
                analysis_date DATE NOT NULL,
                product_type ENUM('cafe_verde', 'cafe_tostado', 'cafe_molido', 'cafe_soluble') NOT NULL,
                variety VARCHAR(100) NULL,
                quality_grade ENUM('specialty', 'premium', 'commercial', 'standard', 'supremo', 'extra') NOT NULL,
                price_min DECIMAL(10,2) NULL,
                price_max DECIMAL(10,2) NULL,
                price_avg DECIMAL(10,2) NOT NULL,
                price_opening DECIMAL(10,2) NULL,
                price_closing DECIMAL(10,2) NULL,
                currency VARCHAR(3) DEFAULT 'COP',
                volume_traded DECIMAL(12,3) NULL,
                market_name VARCHAR(255) NOT NULL,
                market_type ENUM('local', 'nacional', 'internacional', 'export') NOT NULL,
                trend ENUM('alcista', 'bajista', 'estable', 'volatil') NOT NULL,
                market_sentiment ENUM('muy_pesimista', 'pesimista', 'neutral', 'optimista', 'muy_optimista') NOT NULL,
                forecast_short_term ENUM('alza', 'baja', 'estable', 'incierto') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by VARCHAR(36) NOT NULL,
                INDEX idx_source_id (source_id),
                INDEX idx_analysis_date (analysis_date),
                INDEX idx_product_type (product_type),
                INDEX idx_quality_grade (quality_grade),
                INDEX idx_market_type (market_type),
                INDEX idx_trend (trend),
                FOREIGN KEY (source_id) REFERENCES market_data_sources(id),
                FOREIGN KEY (created_by) REFERENCES admin_users(id)
            )
        `);
        console.log('✅ Tabla market_analysis creada');
        
        // subscription_usage
        await connection.execute(`
            CREATE TABLE subscription_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subscription_id INT NOT NULL,
                usage_date DATE NOT NULL,
                usage_month VARCHAR(7) NOT NULL,
                farms_used INT DEFAULT 0,
                lots_used INT DEFAULT 0,
                users_active INT DEFAULT 0,
                storage_used_gb DECIMAL(8,2) DEFAULT 0.00,
                api_calls_count INT DEFAULT 0,
                login_count INT DEFAULT 0,
                reports_generated INT DEFAULT 0,
                exports_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_subscription_id (subscription_id),
                INDEX idx_usage_date (usage_date),
                INDEX idx_usage_month (usage_month),
                UNIQUE KEY unique_subscription_usage (subscription_id, usage_date),
                FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla subscription_usage creada');
        
        // Insertar datos iniciales
        console.log('Insertando datos iniciales...');
        
        // Fuentes de datos de mercado
        await connection.execute(`
            INSERT INTO market_data_sources (name, description, source_type, update_frequency, is_active, created_by) VALUES
            ('Bolsa Nacional Agropecuaria', 'Precios oficiales de la BNA para café', 'api', 'diario', TRUE, 'admin-001'),
            ('Federación Nacional de Cafeteros', 'Datos de precios de la FNC', 'manual', 'diario', TRUE, 'admin-001'),
            ('Mercado Internacional ICE', 'Precios internacionales del café', 'api', 'tiempo_real', TRUE, 'admin-001'),
            ('Cooperativas Locales', 'Precios de cooperativas regionales', 'manual', 'semanal', TRUE, 'admin-001')
        `);
        console.log('✅ Datos iniciales de market_data_sources insertados');
        
        // Análisis de mercado de ejemplo
        await connection.execute(`
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
            )
        `);
        console.log('✅ Datos iniciales de market_analysis insertados');
        
        // Uso de suscripción de ejemplo
        await connection.execute(`
            INSERT INTO subscription_usage (
                subscription_id, usage_date, usage_month,
                farms_used, lots_used, users_active, storage_used_gb,
                login_count, reports_generated
            ) VALUES (
                1, '2024-01-15', '2024-01',
                1, 3, 2, 0.5,
                5, 2
            )
        `);
        console.log('✅ Datos iniciales de subscription_usage insertados');
        
        console.log('🎉 Migración 007 completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

completeMigration007();