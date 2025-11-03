-- =====================================================
-- MIGRACIÓN 005: POLÍTICAS RLS PARA SISTEMA ADMIN
-- Row Level Security para Panel de Superadministrador
-- =====================================================

-- Habilitar RLS en todas las tablas del sistema admin
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA ADMIN_USERS
-- =====================================================

-- Los administradores pueden ver su propio perfil
CREATE POLICY "admin_users_select_own" ON admin_users
    FOR SELECT USING (
        auth.jwt() ->> 'email' = email AND 
        auth.jwt() ->> 'role' = 'admin'
    );

-- Solo superadministradores pueden ver todos los administradores
CREATE POLICY "admin_users_select_super_admin" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.is_super_admin = true
        )
    );

-- Solo superadministradores pueden crear nuevos administradores
CREATE POLICY "admin_users_insert_super_admin" ON admin_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.is_super_admin = true
        )
    );

-- Los administradores pueden actualizar su propio perfil
CREATE POLICY "admin_users_update_own" ON admin_users
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = email AND 
        auth.jwt() ->> 'role' = 'admin'
    );

-- Solo superadministradores pueden actualizar otros administradores
CREATE POLICY "admin_users_update_super_admin" ON admin_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.is_super_admin = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA ADMIN_SESSIONS
-- =====================================================

-- Los administradores pueden ver sus propias sesiones
CREATE POLICY "admin_sessions_select_own" ON admin_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.id = admin_user_id 
            AND au.email = auth.jwt() ->> 'email'
        )
    );

-- Los administradores pueden crear sus propias sesiones
CREATE POLICY "admin_sessions_insert_own" ON admin_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.id = admin_user_id 
            AND au.email = auth.jwt() ->> 'email'
        )
    );

-- Los administradores pueden eliminar sus propias sesiones
CREATE POLICY "admin_sessions_delete_own" ON admin_sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.id = admin_user_id 
            AND au.email = auth.jwt() ->> 'email'
        )
    );

-- =====================================================
-- POLÍTICAS PARA SUBSCRIPTION_PLANS
-- =====================================================

-- Todos los usuarios autenticados pueden ver los planes activos
CREATE POLICY "subscription_plans_select_active" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- Solo administradores pueden ver todos los planes
CREATE POLICY "subscription_plans_select_admin" ON subscription_plans
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- Solo superadministradores pueden modificar planes
CREATE POLICY "subscription_plans_modify_super_admin" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.is_super_admin = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA SUBSCRIPTIONS
-- =====================================================

-- Los usuarios pueden ver sus propias suscripciones
CREATE POLICY "subscriptions_select_own" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- Los administradores pueden ver todas las suscripciones
CREATE POLICY "subscriptions_select_admin" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- Los usuarios pueden crear sus propias suscripciones
CREATE POLICY "subscriptions_insert_own" ON subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Los administradores pueden crear suscripciones para cualquier usuario
CREATE POLICY "subscriptions_insert_admin" ON subscriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- Los usuarios pueden actualizar sus propias suscripciones
CREATE POLICY "subscriptions_update_own" ON subscriptions
    FOR UPDATE USING (user_id = auth.uid());

-- Los administradores pueden actualizar cualquier suscripción
CREATE POLICY "subscriptions_update_admin" ON subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- =====================================================
-- POLÍTICAS PARA PAYMENTS
-- =====================================================

-- Los usuarios pueden ver sus propios pagos
CREATE POLICY "payments_select_own" ON payments
    FOR SELECT USING (user_id = auth.uid());

-- Los administradores pueden ver todos los pagos
CREATE POLICY "payments_select_admin" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- Los usuarios pueden crear sus propios pagos
CREATE POLICY "payments_insert_own" ON payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Los administradores pueden crear pagos para cualquier usuario
CREATE POLICY "payments_insert_admin" ON payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- Solo administradores pueden actualizar pagos
CREATE POLICY "payments_update_admin" ON payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- =====================================================
-- POLÍTICAS PARA PAYMENT_WEBHOOKS
-- =====================================================

-- Solo administradores pueden acceder a webhooks
CREATE POLICY "payment_webhooks_admin_only" ON payment_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- =====================================================
-- POLÍTICAS PARA AUDIT_LOGS
-- =====================================================

-- Solo administradores pueden ver logs de auditoría
CREATE POLICY "audit_logs_select_admin" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- Solo el sistema puede insertar logs de auditoría
CREATE POLICY "audit_logs_insert_system" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Nadie puede actualizar o eliminar logs de auditoría
-- (Los logs son inmutables para mantener la integridad)

-- =====================================================
-- POLÍTICAS PARA SYSTEM_CONFIG
-- =====================================================

-- Todos pueden ver configuraciones públicas
CREATE POLICY "system_config_select_public" ON system_config
    FOR SELECT USING (is_public = true);

-- Solo administradores pueden ver configuraciones privadas
CREATE POLICY "system_config_select_admin" ON system_config
    FOR SELECT USING (
        is_public = false AND
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- Solo superadministradores pueden modificar configuraciones
CREATE POLICY "system_config_modify_super_admin" ON system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.is_super_admin = true
        )
    );

-- =====================================================
-- PERMISOS PARA ROLES ANON Y AUTHENTICATED
-- =====================================================

-- Permisos para usuarios anónimos (solo lectura de planes activos)
GRANT SELECT ON subscription_plans TO anon;
GRANT SELECT ON system_config TO anon;

-- Permisos para usuarios autenticados
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
GRANT SELECT ON system_config TO authenticated;

-- Permisos especiales para el rol de servicio (para webhooks y operaciones del sistema)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- =====================================================
-- FUNCIONES DE UTILIDAD PARA ADMINISTRACIÓN
-- =====================================================

-- Función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es superadministrador
CREATE OR REPLACE FUNCTION is_super_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = user_email AND is_super_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener la suscripción activa de un usuario
CREATE OR REPLACE FUNCTION get_active_subscription(user_uuid UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    status TEXT,
    ends_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        sp.name,
        s.status,
        s.ends_at
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    AND s.ends_at > NOW()
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON FUNCTION is_admin(TEXT) IS 'Verifica si un email corresponde a un usuario administrador';
COMMENT ON FUNCTION is_super_admin(TEXT) IS 'Verifica si un email corresponde a un superadministrador';
COMMENT ON FUNCTION get_active_subscription(UUID) IS 'Obtiene la suscripción activa de un usuario';