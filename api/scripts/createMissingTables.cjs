const mysql = require('mysql2/promise');

// Configuración usando las credenciales correctas
const dbConfig = {
    host: '193.203.175.58',
    port: 3306,
    user: 'u689528678_SSALAZARCA',
    password: 'Ssc841209*',
    database: 'u689528678_CAFECOLOMBIA',
    charset: 'utf8mb4',
    timezone: '+00:00',
    ssl: {
        rejectUnauthorized: false
    }
};

async function createMissingTables() {
    let connection;
    
    try {
        console.log('🚀 Creando tablas faltantes de las migraciones 008, 009, 010...\n');
        
        // Conectar
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa a MySQL');
        
        // Obtener admin_user_id para las foreign keys
        const [adminUsers] = await connection.execute('SELECT id FROM admin_users LIMIT 1');
        const adminUserId = adminUsers[0]?.id;
        
        if (!adminUserId) {
            throw new Error('No se encontró un admin_user para las foreign keys');
        }
        
        console.log(`📋 Usando admin_user_id: ${adminUserId}`);
        
        // Tabla payments (de migración 008)
        console.log('\n📋 Creando tabla payments...');
        const paymentsSQL = `
        CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            payment_code VARCHAR(100) NOT NULL UNIQUE,
            external_id VARCHAR(255) NULL,
            user_id VARCHAR(36) NOT NULL,
            subscription_id INT NULL,
            payment_method_id INT NOT NULL,
            payment_type ENUM('suscripcion', 'upgrade', 'addon', 'multa', 'reembolso', 'otro') NOT NULL,
            status ENUM('pendiente', 'procesando', 'completado', 'fallido', 'cancelado', 'reembolsado', 'parcialmente_reembolsado') NOT NULL DEFAULT 'pendiente',
            amount DECIMAL(12,2) NOT NULL,
            currency_code VARCHAR(3) DEFAULT 'COP',
            base_amount DECIMAL(12,2) NOT NULL,
            discount_amount DECIMAL(12,2) DEFAULT 0.00,
            tax_amount DECIMAL(12,2) DEFAULT 0.00,
            fee_amount DECIMAL(12,2) DEFAULT 0.00,
            net_amount DECIMAL(12,2) NOT NULL,
            payment_date DATETIME NULL,
            due_date DATE NULL,
            processed_at DATETIME NULL,
            description TEXT NULL,
            metadata JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by VARCHAR(36) NOT NULL,
            updated_by VARCHAR(36) NULL,
            INDEX idx_payment_code (payment_code),
            INDEX idx_user (user_id),
            INDEX idx_status (status),
            FOREIGN KEY (created_by) REFERENCES admin_users(id),
            FOREIGN KEY (updated_by) REFERENCES admin_users(id)
        )`;
        
        await connection.execute(paymentsSQL);
        console.log('✅ Tabla payments creada');
        
        // Tabla audit_logs (de migración 008)
        console.log('\n📋 Creando tabla audit_logs...');
        const auditLogsSQL = `
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(36) NULL,
            admin_user_id VARCHAR(36) NULL,
            action VARCHAR(100) NOT NULL,
            table_name VARCHAR(100) NOT NULL,
            record_id VARCHAR(36) NULL,
            old_values JSON NULL,
            new_values JSON NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_admin_user (admin_user_id),
            INDEX idx_action (action),
            INDEX idx_table (table_name),
            INDEX idx_created_at (created_at),
            FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
        )`;
        
        await connection.execute(auditLogsSQL);
        console.log('✅ Tabla audit_logs creada');
        
        // Tabla ai_analysis_results (de migración 009)
        console.log('\n📋 Creando tabla ai_analysis_results...');
        const aiAnalysisSQL = `
        CREATE TABLE IF NOT EXISTS ai_analysis_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            analysis_type ENUM('pest_detection', 'disease_detection', 'quality_assessment', 'yield_prediction', 'market_analysis') NOT NULL,
            farm_id INT NULL,
            lot_id INT NULL,
            image_url VARCHAR(500) NULL,
            confidence_score DECIMAL(5,4) NULL,
            results JSON NOT NULL,
            recommendations JSON NULL,
            status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
            processed_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by VARCHAR(36) NOT NULL,
            INDEX idx_analysis_type (analysis_type),
            INDEX idx_farm (farm_id),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at),
            FOREIGN KEY (farm_id) REFERENCES farms(id),
            FOREIGN KEY (lot_id) REFERENCES lots(id),
            FOREIGN KEY (created_by) REFERENCES admin_users(id)
        )`;
        
        await connection.execute(aiAnalysisSQL);
        console.log('✅ Tabla ai_analysis_results creada');
        
        // Tabla ai_notifications (de migración 009)
        console.log('\n📋 Creando tabla ai_notifications...');
        const aiNotificationsSQL = `
        CREATE TABLE IF NOT EXISTS ai_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            notification_type ENUM('alert', 'recommendation', 'warning', 'info') NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
            is_read BOOLEAN DEFAULT FALSE,
            read_at DATETIME NULL,
            metadata JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_type (notification_type),
            INDEX idx_priority (priority),
            INDEX idx_read (is_read),
            INDEX idx_created_at (created_at)
        )`;
        
        await connection.execute(aiNotificationsSQL);
        console.log('✅ Tabla ai_notifications creada');
        
        // Tabla notifications (de migración 010)
        console.log('\n📋 Creando tabla notifications...');
        const notificationsSQL = `
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            read_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_type (type),
            INDEX idx_read (is_read),
            INDEX idx_created_at (created_at)
        )`;
        
        await connection.execute(notificationsSQL);
        console.log('✅ Tabla notifications creada');
        
        // Tabla reports (de migración 010)
        console.log('\n📋 Creando tabla reports...');
        const reportsSQL = `
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_type ENUM('production', 'financial', 'quality', 'inventory', 'custom') NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            parameters JSON NULL,
            data JSON NULL,
            generated_by VARCHAR(36) NOT NULL,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            file_url VARCHAR(500) NULL,
            status ENUM('pending', 'generating', 'completed', 'failed') DEFAULT 'pending',
            INDEX idx_type (report_type),
            INDEX idx_generated_by (generated_by),
            INDEX idx_status (status),
            INDEX idx_generated_at (generated_at),
            FOREIGN KEY (generated_by) REFERENCES admin_users(id)
        )`;
        
        await connection.execute(reportsSQL);
        console.log('✅ Tabla reports creada');
        
        console.log('\n🎉 Todas las tablas faltantes han sido creadas exitosamente!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

createMissingTables();