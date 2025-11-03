-- Migración 011: Autenticación para Caficultores
-- Fecha: 2024-01-20
-- Descripción: Agregar columnas de autenticación a la tabla coffee_growers

-- =============================================
-- AGREGAR COLUMNAS DE AUTENTICACIÓN
-- =============================================

-- Agregar columnas de autenticación a coffee_growers
ALTER TABLE coffee_growers 
ADD COLUMN password_hash VARCHAR(255) NULL COMMENT 'Hash de la contraseña',
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Usuario activo',
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Email verificado',
ADD COLUMN email_verification_token VARCHAR(255) NULL COMMENT 'Token de verificación de email',
ADD COLUMN email_verification_expires TIMESTAMP NULL COMMENT 'Expiración del token de verificación',
ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0 COMMENT 'Intentos fallidos de login',
ADD COLUMN locked_until TIMESTAMP NULL COMMENT 'Bloqueado hasta',
ADD COLUMN last_login TIMESTAMP NULL COMMENT 'Último login',
ADD COLUMN password_reset_token VARCHAR(255) NULL COMMENT 'Token de reset de contraseña',
ADD COLUMN password_reset_expires TIMESTAMP NULL COMMENT 'Expiración del token de reset',
ADD COLUMN first_name VARCHAR(100) NULL COMMENT 'Primer nombre',
ADD COLUMN last_name VARCHAR(100) NULL COMMENT 'Apellido';

-- Agregar índices para las nuevas columnas
ALTER TABLE coffee_growers 
ADD INDEX idx_email (email),
ADD INDEX idx_is_active (is_active),
ADD INDEX idx_email_verified (email_verified),
ADD INDEX idx_email_verification_token (email_verification_token),
ADD INDEX idx_password_reset_token (password_reset_token);

-- =============================================
-- ACTUALIZAR DATOS EXISTENTES
-- =============================================

-- Extraer first_name y last_name del full_name existente
UPDATE coffee_growers 
SET 
    first_name = TRIM(SUBSTRING_INDEX(full_name, ' ', 1)),
    last_name = TRIM(SUBSTRING(full_name, LOCATE(' ', full_name) + 1))
WHERE full_name IS NOT NULL AND full_name != '';

-- Activar y verificar email para usuarios existentes que tengan email
UPDATE coffee_growers 
SET 
    is_active = TRUE,
    email_verified = TRUE
WHERE email IS NOT NULL AND email != '';

-- =============================================
-- CREAR CONTRASEÑAS DE PRUEBA
-- =============================================

-- Crear contraseñas hasheadas para usuarios de prueba
-- Contraseña: "password123" (hash bcrypt con salt 12)
UPDATE coffee_growers 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG.JOOdS8u'
WHERE email IN (
    'juan.perez@email.com',
    'carlos.mendoza@email.com', 
    'maria.gonzalez@email.com',
    'carlos.mendez@cafecolombia.com',
    'jose.ramirez@cafecolombia.com'
);

-- =============================================
-- COMENTARIOS
-- =============================================

-- La contraseña de prueba para todos los caficultores es: password123
-- En producción, cada usuario debe establecer su propia contraseña durante el registro