// Tipos para el sistema de gestión de fincas

import type { BaseFilters, DateRange } from './index.js';

// Tipos básicos
export type FarmStatus = 'active' | 'inactive' | 'maintenance' | 'abandoned';
export type SoilType = 'arcilloso' | 'arenoso' | 'limoso' | 'franco' | 'volcanico' | 'otro';
export type ClimateType = 'tropical' | 'subtropical' | 'templado' | 'frio' | 'paramo';
export type IrrigationType = 'riego' | 'secano' | 'mixto';
export type CoffeeVariety = 'arabica' | 'robusta' | 'caturra' | 'colombia' | 'castillo' | 'geisha' | 'bourbon' | 'typica' | 'otro';
export type ProcessingType = 'lavado' | 'natural' | 'honey' | 'semi_lavado' | 'experimental';
export type CertificationStatus = 'certificada' | 'en_proceso' | 'no_certificada';

// Coordenadas geográficas
export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

// Información de producción
export interface ProductionData {
  harvest_year: number;
  total_production: number; // kg
  quality_score?: number; // 1-100
  price_per_kg?: number;
  total_revenue?: number;
  production_costs?: number;
  net_profit?: number;
  notes?: string;
}

// Información climática
export interface ClimateData {
  average_temperature: number; // °C
  min_temperature?: number;
  max_temperature?: number;
  annual_rainfall: number; // mm
  humidity_percentage?: number;
  altitude: number; // msnm
  climate_type: ClimateType;
}

// Información del suelo
export interface SoilData {
  soil_type: SoilType;
  ph_level?: number;
  organic_matter_percentage?: number;
  nitrogen_level?: string;
  phosphorus_level?: string;
  potassium_level?: string;
  drainage_quality?: 'excelente' | 'bueno' | 'regular' | 'malo';
  erosion_risk?: 'bajo' | 'medio' | 'alto';
}

// Interfaz principal de la finca
export interface Farm {
  id: number;
  coffee_grower_id: number;
  name: string;
  code?: string; // Código único de la finca
  description?: string;
  
  // Ubicación
  address: string;
  department: string;
  municipality: string;
  rural_zone?: string;
  coordinates?: Coordinates;
  
  // Información básica
  total_area: number; // hectáreas
  coffee_area: number; // hectáreas
  other_crops_area?: number; // hectáreas
  forest_area?: number; // hectáreas
  infrastructure_area?: number; // hectáreas
  
  // Información técnica
  soil_data?: SoilData;
  climate_data?: ClimateData;
  irrigation_type: IrrigationType;
  coffee_varieties: CoffeeVariety[];
  planting_density?: number; // plantas por hectárea
  tree_age_years?: number;
  processing_method: ProcessingType;
  
  // Certificaciones
  certification_status: CertificationStatus;
  certifications?: string[]; // Array de certificaciones
  certification_expiry?: Date;
  
  // Producción
  annual_production?: number; // kg/año
  production_history?: ProductionData[];
  last_harvest_date?: Date;
  next_harvest_date?: Date;
  
  // Infraestructura
  has_processing_facility: boolean;
  has_storage_facility: boolean;
  has_drying_facility: boolean;
  has_water_source: boolean;
  has_electricity: boolean;
  access_road_condition?: 'excelente' | 'bueno' | 'regular' | 'malo';
  
  // Prácticas agrícolas
  farming_practices?: string[];
  pest_control_methods?: string[];
  fertilization_program?: string;
  pruning_schedule?: string;
  
  // Metadatos
  status: FarmStatus;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  created_by: number;
  updated_by?: number;
  deleted_by?: number;
  
  // Relaciones (joins)
  coffee_grower?: {
    id: number;
    full_name: string;
    identification_number: string;
  };
}

// Solicitudes de API
export interface FarmCreateRequest {
  coffee_grower_id: number;
  name: string;
  code?: string;
  description?: string;
  address: string;
  department: string;
  municipality: string;
  rural_zone?: string;
  coordinates?: Coordinates;
  total_area: number;
  coffee_area: number;
  other_crops_area?: number;
  forest_area?: number;
  infrastructure_area?: number;
  soil_data?: SoilData;
  climate_data?: ClimateData;
  irrigation_type: IrrigationType;
  coffee_varieties: CoffeeVariety[];
  planting_density?: number;
  tree_age_years?: number;
  processing_method: ProcessingType;
  certification_status: CertificationStatus;
  certifications?: string[];
  certification_expiry?: Date;
  annual_production?: number;
  last_harvest_date?: Date;
  next_harvest_date?: Date;
  has_processing_facility: boolean;
  has_storage_facility: boolean;
  has_drying_facility: boolean;
  has_water_source: boolean;
  has_electricity: boolean;
  access_road_condition?: 'excelente' | 'bueno' | 'regular' | 'malo';
  farming_practices?: string[];
  pest_control_methods?: string[];
  fertilization_program?: string;
  pruning_schedule?: string;
  notes?: string;
}

export interface FarmUpdateRequest {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  department?: string;
  municipality?: string;
  rural_zone?: string;
  coordinates?: Coordinates;
  total_area?: number;
  coffee_area?: number;
  other_crops_area?: number;
  forest_area?: number;
  infrastructure_area?: number;
  soil_data?: SoilData;
  climate_data?: ClimateData;
  irrigation_type?: IrrigationType;
  coffee_varieties?: CoffeeVariety[];
  planting_density?: number;
  tree_age_years?: number;
  processing_method?: ProcessingType;
  certification_status?: CertificationStatus;
  certifications?: string[];
  certification_expiry?: Date;
  annual_production?: number;
  last_harvest_date?: Date;
  next_harvest_date?: Date;
  has_processing_facility?: boolean;
  has_storage_facility?: boolean;
  has_drying_facility?: boolean;
  has_water_source?: boolean;
  has_electricity?: boolean;
  access_road_condition?: 'excelente' | 'bueno' | 'regular' | 'malo';
  farming_practices?: string[];
  pest_control_methods?: string[];
  fertilization_program?: string;
  pruning_schedule?: string;
  notes?: string;
  status?: FarmStatus;
}

// Filtros para listado
export interface FarmListFilters extends BaseFilters {
  coffee_grower_id?: number;
  status?: FarmStatus;
  department?: string;
  municipality?: string;
  certification_status?: CertificationStatus;
  irrigation_type?: IrrigationType;
  coffee_varieties?: CoffeeVariety[];
  processing_method?: ProcessingType;
  date_range?: DateRange;
  min_area?: number;
  max_area?: number;
  min_production?: number;
  max_production?: number;
  min_altitude?: number;
  max_altitude?: number;
  has_certifications?: boolean;
  has_processing_facility?: boolean;
  has_water_source?: boolean;
}

// Respuesta de listado
export interface FarmListResponse {
  data: Farm[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Estadísticas de fincas
export interface FarmStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  abandoned: number;
  new_this_month: number;
  total_area: number;
  total_coffee_area: number;
  average_farm_size: number;
  average_coffee_area: number;
  by_department: Array<{
    department: string;
    count: number;
    total_area: number;
  }>;
  by_certification: Array<{
    certification_status: string;
    count: number;
    percentage: number;
  }>;
  by_variety: Array<{
    variety: string;
    count: number;
    area: number;
  }>;
  production_summary: {
    total_annual_production: number;
    average_production_per_hectare: number;
    farms_with_production_data: number;
  };
  infrastructure_summary: {
    with_processing_facility: number;
    with_storage_facility: number;
    with_drying_facility: number;
    with_water_source: number;
    with_electricity: number;
  };
}

// Métricas de fincas
export interface FarmMetrics {
  productivity_metrics: {
    average_yield_per_hectare: number;
    top_performing_farms: Array<{
      farm_id: number;
      farm_name: string;
      yield_per_hectare: number;
      quality_score: number;
    }>;
    yield_trends: Array<{
      period: string;
      average_yield: number;
      farms_count: number;
    }>;
  };
  geographic_distribution: Array<{
    department: string;
    municipality: string;
    farms_count: number;
    total_area: number;
    average_altitude: number;
  }>;
  certification_trends: Array<{
    period: string;
    certified_farms: number;
    certification_rate: number;
  }>;
  infrastructure_adoption: Array<{
    infrastructure_type: string;
    farms_with_infrastructure: number;
    adoption_rate: number;
  }>;
}

// Reporte de fincas
export interface FarmReport {
  id: number;
  title: string;
  description: string;
  filters: FarmListFilters;
  generated_at: Date;
  generated_by: number;
  file_url?: string;
  status: 'pending' | 'completed' | 'failed';
  total_records: number;
  file_size?: number;
}

export interface FarmReportRequest {
  title: string;
  description?: string;
  filters: FarmListFilters;
  format: 'pdf' | 'excel' | 'csv';
  include_production_data?: boolean;
  include_coordinates?: boolean;
  include_soil_data?: boolean;
  include_climate_data?: boolean;
}

// Datos para mapas
export interface FarmMapData {
  id: number;
  name: string;
  coordinates: Coordinates;
  coffee_grower_name: string;
  total_area: number;
  coffee_area: number;
  status: FarmStatus;
  annual_production?: number;
  certification_status: CertificationStatus;
}

// Análisis de proximidad
export interface FarmProximityAnalysis {
  farm_id: number;
  nearby_farms: Array<{
    farm_id: number;
    farm_name: string;
    distance_km: number;
    coffee_grower_name: string;
  }>;
  processing_facilities_nearby: Array<{
    facility_name: string;
    distance_km: number;
    capacity: string;
  }>;
  market_access: {
    nearest_town: string;
    distance_to_town_km: number;
    road_condition: string;
    transportation_options: string[];
  };
}