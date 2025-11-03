-- CaféColombia App - Políticas de seguridad RLS
-- Migración 002: Row Level Security policies

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para farms
CREATE POLICY "Users can view farms they belong to" ON public.farms
    FOR SELECT USING (
        id IN (
            SELECT farm_id FROM public.profiles 
            WHERE id = auth.uid() AND farm_id IS NOT NULL
        )
    );

CREATE POLICY "Admins can manage farms" ON public.farms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador'
            AND farm_id = farms.id
        )
    );

-- Políticas para lots
CREATE POLICY "Users can view lots from their farm" ON public.lots
    FOR SELECT USING (
        farm_id IN (
            SELECT farm_id FROM public.profiles 
            WHERE id = auth.uid() AND farm_id IS NOT NULL
        )
    );

CREATE POLICY "Admins can manage lots" ON public.lots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador'
            AND farm_id = lots.farm_id
        )
    );

-- Políticas para inputs (catálogo global)
CREATE POLICY "All authenticated users can view inputs" ON public.inputs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage inputs" ON public.inputs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );

-- Políticas para inventory
CREATE POLICY "Users can view inventory from their farm" ON public.inventory
    FOR SELECT USING (
        farm_id IN (
            SELECT farm_id FROM public.profiles 
            WHERE id = auth.uid() AND farm_id IS NOT NULL
        )
    );

CREATE POLICY "Admins and workers can manage inventory" ON public.inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('administrador', 'trabajador')
            AND farm_id = inventory.farm_id
        )
    );

-- Políticas para agricultural_tasks
CREATE POLICY "Users can view tasks from their farm" ON public.agricultural_tasks
    FOR SELECT USING (
        farm_id IN (
            SELECT farm_id FROM public.profiles 
            WHERE id = auth.uid() AND farm_id IS NOT NULL
        )
    );

CREATE POLICY "Admins and workers can manage tasks" ON public.agricultural_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('administrador', 'trabajador')
            AND farm_id = agricultural_tasks.farm_id
        )
    );

-- Políticas para input_usage
CREATE POLICY "Users can view input usage from their farm tasks" ON public.input_usage
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM public.agricultural_tasks 
            WHERE farm_id IN (
                SELECT farm_id FROM public.profiles 
                WHERE id = auth.uid() AND farm_id IS NOT NULL
            )
        )
    );

CREATE POLICY "Admins and workers can manage input usage" ON public.input_usage
    FOR ALL USING (
        task_id IN (
            SELECT id FROM public.agricultural_tasks 
            WHERE farm_id IN (
                SELECT farm_id FROM public.profiles 
                WHERE id = auth.uid() 
                AND role IN ('administrador', 'trabajador')
                AND farm_id IS NOT NULL
            )
        )
    );

-- Políticas para pest_monitoring
CREATE POLICY "Users can view pest monitoring from their farm" ON public.pest_monitoring
    FOR SELECT USING (
        farm_id IN (
            SELECT farm_id FROM public.profiles 
            WHERE id = auth.uid() AND farm_id IS NOT NULL
        )
    );

CREATE POLICY "All farm users can manage pest monitoring" ON public.pest_monitoring
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND farm_id = pest_monitoring.farm_id
        )
    );

-- Políticas para expenses
CREATE POLICY "Users can view expenses from their farm" ON public.expenses
    FOR SELECT USING (
        farm_id IN (
            SELECT farm_id FROM public.profiles 
            WHERE id = auth.uid() AND farm_id IS NOT NULL
        )
    );

CREATE POLICY "Admins can manage all expenses" ON public.expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador'
            AND farm_id = expenses.farm_id
        )
    );

-- Políticas para harvests
CREATE POLICY "Users can view harvests from their farm" ON public.harvests
    FOR SELECT USING (
        farm_id IN (
            SELECT farm_id FROM public.profiles 
            WHERE id = auth.uid() AND farm_id IS NOT NULL
        )
    );

CREATE POLICY "Admins and workers can manage harvests" ON public.harvests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('administrador', 'trabajador')
            AND farm_id = harvests.farm_id
        )
    );

-- Políticas para processing
CREATE POLICY "Users can view processing from their farm harvests" ON public.processing
    FOR SELECT USING (
        harvest_id IN (
            SELECT id FROM public.harvests 
            WHERE farm_id IN (
                SELECT farm_id FROM public.profiles 
                WHERE id = auth.uid() AND farm_id IS NOT NULL
            )
        )
    );

CREATE POLICY "Admins and workers can manage processing" ON public.processing
    FOR ALL USING (
        harvest_id IN (
            SELECT id FROM public.harvests 
            WHERE farm_id IN (
                SELECT farm_id FROM public.profiles 
                WHERE id = auth.uid() 
                AND role IN ('administrador', 'trabajador')
                AND farm_id IS NOT NULL
            )
        )
    );

-- Políticas para microlots
CREATE POLICY "Users can view microlots from their farm" ON public.microlots
    FOR SELECT USING (
        farm_id IN (
            SELECT farm_id FROM public.profiles 
            WHERE id = auth.uid() AND farm_id IS NOT NULL
        )
    );

CREATE POLICY "Admins can manage microlots" ON public.microlots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador'
            AND farm_id = microlots.farm_id
        )
    );

CREATE POLICY "Certificadores can view all microlots" ON public.microlots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'certificador'
        )
    );

-- Otorgar permisos a los roles anon y authenticated
GRANT SELECT ON public.inputs TO anon;
GRANT ALL PRIVILEGES ON public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON public.farms TO authenticated;
GRANT ALL PRIVILEGES ON public.lots TO authenticated;
GRANT ALL PRIVILEGES ON public.inputs TO authenticated;
GRANT ALL PRIVILEGES ON public.inventory TO authenticated;
GRANT ALL PRIVILEGES ON public.agricultural_tasks TO authenticated;
GRANT ALL PRIVILEGES ON public.input_usage TO authenticated;
GRANT ALL PRIVILEGES ON public.pest_monitoring TO authenticated;
GRANT ALL PRIVILEGES ON public.expenses TO authenticated;
GRANT ALL PRIVILEGES ON public.harvests TO authenticated;
GRANT ALL PRIVILEGES ON public.processing TO authenticated;
GRANT ALL PRIVILEGES ON public.microlots TO authenticated;