-- Datos iniciales para el sistema Café Colombia

-- Configuración inicial del sistema
INSERT IGNORE INTO system_config (id, config_key, config_value, description, is_public) VALUES
('cfg-001', 'app_name', '"Café Colombia"', 'Nombre de la aplicación', true),
('cfg-002', 'app_version', '"1.0.0"', 'Versión de la aplicación', true),
('cfg-003', 'maintenance_mode', 'false', 'Modo de mantenimiento', false),
('cfg-004', 'max_login_attempts', '5', 'Máximo número de intentos de login', false),
('cfg-005', 'session_timeout', '3600', 'Tiempo de expiración de sesión en segundos', false);

-- Usuario administrador por defecto
-- Contraseña: admin123 (hash bcrypt)
INSERT IGNORE INTO admin_users (id, email, password_hash, name, is_super_admin, is_active) VALUES
('admin-001', 'admin@cafecolombia.com', '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq', 'Administrador Principal', true, true);