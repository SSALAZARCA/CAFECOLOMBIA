-- CaféColombia App - Esquema inicial de base de datos
-- Migración 001: Estructura base para gestión de fincas cafeteras

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Tabla de usuarios (perfiles extendidos de auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('administrador', 'trabajador', 'certificador')) DEFAULT 'trabajador',
    phone TEXT,
    avatar_url TEXT,
    farm_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de fincas
CREATE TABLE public.farms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    location TEXT,
    total_area DECIMAL(10,2), -- en hectáreas
    altitude INTEGER, -- metros sobre el nivel del mar
    coordinates GEOMETRY(POINT, 4326), -- ubicación central de la finca
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de lotes
CREATE TABLE public.lots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    variety TEXT NOT NULL, -- Castillo, Caturra, etc.
    planting_date DATE,
    trees_planted INTEGER,
    area DECIMAL(8,2), -- área en hectáreas
    polygon GEOMETRY(POLYGON, 4326), -- polígono del lote
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'renovation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de insumos
CREATE TABLE public.inputs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fertilizante', 'pesticida', 'herbicida', 'fungicida', 'otro')),
    ica_registration TEXT, -- número de registro ICA
    active_ingredient TEXT,
    grace_period_days INTEGER DEFAULT 0, -- período de carencia en días
    unit TEXT NOT NULL, -- kg, litros, bultos, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de inventario de bodega
CREATE TABLE public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    input_id UUID REFERENCES public.inputs(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2),
    purchase_date DATE,
    expiration_date DATE,
    batch_number TEXT,
    supplier TEXT,
    invoice_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(farm_id, input_id, batch_number)
);

-- Tabla de labores agrícolas
CREATE TABLE public.agricultural_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('fertilizacion', 'fumigacion', 'poda', 'guadana', 'cosecha', 'otro')),
    description TEXT,
    worker_name TEXT,
    date_performed DATE NOT NULL,
    labor_cost DECIMAL(10,2),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de uso de insumos en labores
CREATE TABLE public.input_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.agricultural_tasks(id) ON DELETE CASCADE NOT NULL,
    input_id UUID REFERENCES public.inputs(id) ON DELETE CASCADE NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    application_date DATE NOT NULL,
    grace_period_end DATE, -- calculado automáticamente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de monitoreo MIP (Manejo Integrado de Plagas)
CREATE TABLE public.pest_monitoring (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE NOT NULL,
    pest_type TEXT NOT NULL CHECK (pest_type IN ('broca', 'roya', 'minador', 'cochinilla', 'otro')),
    monitoring_date DATE NOT NULL,
    total_sample INTEGER NOT NULL, -- frutos o plantas muestreadas
    affected_sample INTEGER NOT NULL, -- frutos o plantas afectadas
    infestation_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_sample > 0 THEN (affected_sample::DECIMAL / total_sample::DECIMAL) * 100 ELSE 0 END
    ) STORED,
    action_threshold DECIMAL(5,2) DEFAULT 2.0, -- umbral de acción (%)
    requires_action BOOLEAN GENERATED ALWAYS AS (
        CASE WHEN total_sample > 0 THEN 
            (affected_sample::DECIMAL / total_sample::DECIMAL) * 100 >= action_threshold 
        ELSE false END
    ) STORED,
    notes TEXT,
    monitored_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de gastos
CREATE TABLE public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL, -- puede ser gasto general de finca
    expense_type TEXT NOT NULL CHECK (expense_type IN ('mano_obra', 'insumos', 'combustible', 'mantenimiento', 'servicios', 'otro')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    worker_name TEXT,
    receipt_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cosechas
CREATE TABLE public.harvests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE NOT NULL,
    harvest_date DATE NOT NULL,
    cherry_weight DECIMAL(8,2) NOT NULL, -- peso en kg de cereza
    picker_name TEXT,
    quality_grade TEXT CHECK (quality_grade IN ('supremo', 'excelso', 'UGQ', 'pasilla')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de procesamiento (beneficio húmedo)
CREATE TABLE public.processing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    harvest_id UUID REFERENCES public.harvests(id) ON DELETE CASCADE NOT NULL,
    process_type TEXT NOT NULL CHECK (process_type IN ('despulpado', 'fermentacion', 'lavado', 'secado')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    temperature DECIMAL(4,1), -- para fermentación
    humidity_percentage DECIMAL(4,1), -- para secado
    notes TEXT,
    operator_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de microlotes (para trazabilidad)
CREATE TABLE public.microlots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL, -- código único del microlote
    harvest_date DATE NOT NULL,
    total_cherry_weight DECIMAL(8,2) NOT NULL,
    final_parchment_weight DECIMAL(8,2),
    quality_score DECIMAL(4,2), -- puntaje de calidad
    cupping_notes TEXT,
    status TEXT DEFAULT 'in_process' CHECK (status IN ('in_process', 'dried', 'ready_for_export', 'exported')),
    qr_code TEXT, -- código QR para trazabilidad
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_lots_farm_id ON public.lots(farm_id);
CREATE INDEX idx_inventory_farm_id ON public.inventory(farm_id);
CREATE INDEX idx_agricultural_tasks_farm_id ON public.agricultural_tasks(farm_id);
CREATE INDEX idx_agricultural_tasks_lot_id ON public.agricultural_tasks(lot_id);
CREATE INDEX idx_pest_monitoring_farm_id ON public.pest_monitoring(farm_id);
CREATE INDEX idx_pest_monitoring_date ON public.pest_monitoring(monitoring_date);
CREATE INDEX idx_expenses_farm_id ON public.expenses(farm_id);
CREATE INDEX idx_harvests_farm_id ON public.harvests(farm_id);
CREATE INDEX idx_harvests_date ON public.harvests(harvest_date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agricultural_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.input_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pest_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microlots ENABLE ROW LEVEL SECURITY;