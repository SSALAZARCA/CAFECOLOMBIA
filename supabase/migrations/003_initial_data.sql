-- CaféColombia App - Datos iniciales
-- Migración 003: Datos de ejemplo y funciones auxiliares

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON public.lots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inputs_updated_at BEFORE UPDATE ON public.inputs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agricultural_tasks_updated_at BEFORE UPDATE ON public.agricultural_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_microlots_updated_at BEFORE UPDATE ON public.microlots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular período de carencia
CREATE OR REPLACE FUNCTION calculate_grace_period_end(
    application_date DATE,
    input_id UUID
)
RETURNS DATE AS $$
DECLARE
    grace_days INTEGER;
BEGIN
    SELECT grace_period_days INTO grace_days
    FROM public.inputs
    WHERE id = input_id;
    
    RETURN application_date + INTERVAL '1 day' * COALESCE(grace_days, 0);
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular automáticamente el período de carencia
CREATE OR REPLACE FUNCTION set_grace_period_end()
RETURNS TRIGGER AS $$
BEGIN
    NEW.grace_period_end = calculate_grace_period_end(NEW.application_date, NEW.input_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_grace_period_trigger
    BEFORE INSERT OR UPDATE ON public.input_usage
    FOR EACH ROW EXECUTE FUNCTION set_grace_period_end();

-- Función para generar código QR único para microlotes
CREATE OR REPLACE FUNCTION generate_microlot_code(
    farm_id UUID,
    lot_id UUID,
    harvest_date DATE
)
RETURNS TEXT AS $$
DECLARE
    farm_code TEXT;
    lot_code TEXT;
    date_code TEXT;
    sequence_num INTEGER;
BEGIN
    -- Obtener código de finca (primeras 3 letras del nombre)
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3))
    INTO farm_code
    FROM public.farms
    WHERE id = farm_id;
    
    -- Obtener código de lote (primeras 3 letras del nombre)
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3))
    INTO lot_code
    FROM public.lots
    WHERE id = lot_id;
    
    -- Código de fecha (YYMMDD)
    date_code = TO_CHAR(harvest_date, 'YYMMDD');
    
    -- Obtener número secuencial para el día
    SELECT COALESCE(MAX(CAST(RIGHT(code, 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.microlots
    WHERE farm_id = farm_id
    AND harvest_date = harvest_date;
    
    RETURN farm_code || lot_code || date_code || LPAD(sequence_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar código automáticamente
CREATE OR REPLACE FUNCTION set_microlot_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code = generate_microlot_code(NEW.farm_id, NEW.lot_id, NEW.harvest_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_microlot_code_trigger
    BEFORE INSERT ON public.microlots
    FOR EACH ROW EXECUTE FUNCTION set_microlot_code();

-- Datos iniciales de insumos comunes
INSERT INTO public.inputs (name, type, ica_registration, active_ingredient, grace_period_days, unit) VALUES
('Urea Grado Agrícola', 'fertilizante', 'ICA-001', 'Nitrógeno 46%', 0, 'kg'),
('Triple 15 (15-15-15)', 'fertilizante', 'ICA-002', 'NPK 15-15-15', 0, 'kg'),
('Sulfato de Potasio', 'fertilizante', 'ICA-003', 'K2SO4', 0, 'kg'),
('Beauveria Bassiana', 'pesticida', 'ICA-BIO-001', 'Beauveria bassiana', 0, 'kg'),
('Cobre Oxicloruro', 'fungicida', 'ICA-004', 'Oxicloruro de cobre', 21, 'kg'),
('Glifosato 48%', 'herbicida', 'ICA-005', 'Glifosato', 30, 'litros'),
('Abono Orgánico Compost', 'fertilizante', '', 'Materia orgánica', 0, 'kg'),
('Cal Dolomítica', 'fertilizante', 'ICA-006', 'CaMg(CO3)2', 0, 'kg'),
('Adherente Agrícola', 'otro', 'ICA-007', 'Coadyuvante', 0, 'litros'),
('Azufre Elemental', 'fungicida', 'ICA-008', 'Azufre 80%', 7, 'kg');

-- Vista para consultas de trazabilidad
CREATE OR REPLACE VIEW microlot_traceability AS
SELECT 
    m.id,
    m.code,
    m.harvest_date,
    m.total_cherry_weight,
    m.final_parchment_weight,
    m.quality_score,
    m.status,
    f.name as farm_name,
    f.owner_name,
    l.name as lot_name,
    l.variety,
    l.area as lot_area,
    -- Últimas aplicaciones de insumos (período de carencia)
    (
        SELECT json_agg(
            json_build_object(
                'input_name', i.name,
                'application_date', iu.application_date,
                'grace_period_end', iu.grace_period_end,
                'quantity_used', iu.quantity_used,
                'is_within_grace_period', iu.grace_period_end > m.harvest_date
            )
        )
        FROM public.input_usage iu
        JOIN public.agricultural_tasks at ON iu.task_id = at.id
        JOIN public.inputs i ON iu.input_id = i.id
        WHERE at.lot_id = m.lot_id
        AND iu.application_date <= m.harvest_date
        AND iu.grace_period_end > (m.harvest_date - INTERVAL '90 days')
        ORDER BY iu.application_date DESC
    ) as recent_input_applications,
    -- Procesos de beneficio
    (
        SELECT json_agg(
            json_build_object(
                'process_type', p.process_type,
                'start_time', p.start_time,
                'end_time', p.end_time,
                'temperature', p.temperature,
                'humidity_percentage', p.humidity_percentage,
                'operator_name', p.operator_name
            ) ORDER BY p.start_time
        )
        FROM public.processing p
        JOIN public.harvests h ON p.harvest_id = h.id
        WHERE h.lot_id = m.lot_id
        AND h.harvest_date = m.harvest_date
    ) as processing_steps
FROM public.microlots m
JOIN public.farms f ON m.farm_id = f.id
JOIN public.lots l ON m.lot_id = l.id;

-- Función para verificar períodos de carencia antes de cosecha
CREATE OR REPLACE FUNCTION check_grace_periods_for_harvest(
    lot_id UUID,
    harvest_date DATE
)
RETURNS TABLE (
    input_name TEXT,
    application_date DATE,
    grace_period_end DATE,
    days_remaining INTEGER,
    is_safe BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.name,
        iu.application_date,
        iu.grace_period_end,
        (iu.grace_period_end - harvest_date)::INTEGER as days_remaining,
        (iu.grace_period_end <= harvest_date) as is_safe
    FROM public.input_usage iu
    JOIN public.agricultural_tasks at ON iu.task_id = at.id
    JOIN public.inputs i ON iu.input_id = i.id
    WHERE at.lot_id = check_grace_periods_for_harvest.lot_id
    AND iu.grace_period_end > harvest_date
    ORDER BY iu.grace_period_end DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular costos de producción por lote
CREATE OR REPLACE FUNCTION calculate_lot_production_cost(
    lot_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2),
    input_cost DECIMAL(10,2),
    other_cost DECIMAL(10,2)
) AS $$
DECLARE
    _start_date DATE := COALESCE(start_date, CURRENT_DATE - INTERVAL '1 year');
    _end_date DATE := COALESCE(end_date, CURRENT_DATE);
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(e.amount), 0) as total_cost,
        COALESCE(SUM(CASE WHEN e.expense_type = 'mano_obra' THEN e.amount ELSE 0 END), 0) as labor_cost,
        COALESCE(SUM(CASE WHEN e.expense_type = 'insumos' THEN e.amount ELSE 0 END), 0) as input_cost,
        COALESCE(SUM(CASE WHEN e.expense_type NOT IN ('mano_obra', 'insumos') THEN e.amount ELSE 0 END), 0) as other_cost
    FROM public.expenses e
    WHERE e.lot_id = calculate_lot_production_cost.lot_id
    AND e.date BETWEEN _start_date AND _end_date;
END;
$$ LANGUAGE plpgsql;