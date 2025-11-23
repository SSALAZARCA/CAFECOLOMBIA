-- CAFECOLOMBIAAPP - Script Completo de Base de Datos
-- Fecha: 2024-01-08
-- Propósito: Resolver error 500 en registro de usuarios
-- Base de datos: MySQL/Supabase

-- =====================================================
-- TABLA: coffee_growers (Caficultores)
-- =====================================================
CREATE TABLE IF NOT EXISTS coffee_growers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL DEFAULT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para optimización de consultas
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: farms (Fincas)
-- =====================================================
CREATE TABLE IF NOT EXISTS farms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coffee_grower_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    location TEXT,
    size_hectares DECIMAL(10,2),
    coffee_varieties TEXT,
    certifications TEXT,
    experience_years INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para optimización
    INDEX idx_coffee_grower_id (coffee_grower_id),
    INDEX idx_status (status),
    INDEX idx_name (name)
    
    -- Nota: Foreign key deshabilitada para compatibilidad con Supabase
    -- CONSTRAINT fk_coffee_grower FOREIGN KEY (coffee_grower_id) REFERENCES coffee_growers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: admin_users (Administradores)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_email (email),
    INDEX idx_is_active (is_active),
    INDEX idx_is_super_admin (is_super_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: password_resets (Recuperación de contraseña)
-- =====================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: user_sessions (Sesiones de usuario)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('coffee_grower', 'admin') NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PERMISOS PARA SUPABASE (Ejecutar después de crear tablas)
-- =====================================================

-- Permisos para coffee_growers
GRANT SELECT ON coffee_growers TO anon;
GRANT ALL PRIVILEGES ON coffee_growers TO authenticated;

-- Permisos para farms
GRANT SELECT ON farms TO anon;
GRANT ALL PRIVILEGES ON farms TO authenticated;

-- Permisos para admin_users
GRANT SELECT ON admin_users TO anon;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;

-- Permisos para password_resets
GRANT SELECT, INSERT, UPDATE ON password_resets TO anon;
GRANT ALL PRIVILEGES ON password_resets TO authenticated;

-- Permisos para user_sessions
GRANT SELECT, INSERT, UPDATE ON user_sessions TO anon;
GRANT ALL PRIVILEGES ON user_sessions TO authenticated;

-- =====================================================
-- DATOS DE PRUEBA INICIALES
-- =====================================================

-- Administrador principal (contraseña: Admin123!)
INSERT IGNORE INTO admin_users (email, password_hash, name, is_super_admin, is_active) VALUES 
('admin@cafecolombia.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Principal', TRUE, TRUE);

-- Caficultor de prueba (contraseña: password)
INSERT IGNORE INTO coffee_growers (email, password_hash, full_name, phone, status) VALUES 
('test@coffee.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Caficultor de Prueba', '+573001234567', 'active');

-- Finca de prueba asociada
INSERT IGNORE INTO farms (coffee_grower_id, name, location, size_hectares, coffee_varieties, certifications, experience_years, status) VALUES 
(1, 'Finca La Prueba', 'Vereda El Test, Municipio Demo', 15.50, 'Caturra, Castillo', 'Orgánico, Comercio Justo', 10, 'active');

-- =====================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT 
    'coffee_growers' as tabla,
    COUNT(*) as registros,
    'OK' as estado
FROM coffee_growers
UNION ALL
SELECT 
    'farms' as tabla,
    COUNT(*) as registros,
    'OK' as estado
FROM farms
UNION ALL
SELECT 
    'admin_users' as tabla,
    COUNT(*) as registros,
    'OK' as estado
FROM admin_users
UNION ALL
SELECT 
    'password_resets' as tabla,
    COUNT(*) as registros,
    'OK' as estado
FROM password_resets
UNION ALL
SELECT 
    'user_sessions' as tabla,
    COUNT(*) as registros,
    'OK' as estado
FROM user_sessions;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script es compatible con MySQL 5.7+ y Supabase
-- 2. Las foreign keys están comentadas para compatibilidad con Supabase
-- 3. Los índices mejoran el rendimiento en consultas frecuentes
-- 4. Los permisos de Supabase deben ejecutarse después de crear las tablas
-- 5. Los datos de prueba permiten verificar la instalación inmediatamente

-- =====================================================
-- COMANDOS ÚTILES POST-INSTALACIÓN
-- =====================================================

-- Verificar estructura de tablas
-- DESCRIBE coffee_growers;
-- DESCRIBE farms;
-- DESCRIBE admin_users;

-- Verificar índices
-- SHOW INDEX FROM coffee_growers;
-- SHOW INDEX FROM farms;

-- Verificar permisos (requiere privilegios de administrador)
-- SHOW GRANTS FOR 'u689528678_SSALAZARCA'@'%';