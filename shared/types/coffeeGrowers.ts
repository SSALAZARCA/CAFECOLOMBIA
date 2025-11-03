// Tipos para el sistema de gestión de caficultores

import type { BaseFilters, DateRange } from './index.js';

// Tipos básicos
export type IdentificationType = 'cedula' | 'cedula_extranjeria' | 'pasaporte' | 'nit';
export type Gender = 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
export type CoffeeGrowerStatus = 'active' | 'inactive' | 'suspended';
export type CertificationType = 'organico' | 'rainforest' | 'utz' | 'fairtrade' | 'cafe_especial' | 'ninguna';
export type FarmingPractice = 'tradicional' | 'organico' | 'sostenible' | 'agroecologico' | 'convencional';
export type ProcessingMethod = 'lavado' | 'natural' | 'honey' | 'semi_lavado' | 'experimental';

// Interfaz principal del caficultor
export interface CoffeeGrower {
  id: number;
  identification_number: string;
  identification_type: IdentificationType;
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: Date;
  gender?: Gender;
  address?: string;
  department: string;
  municipality: string;
  rural_zone?: string;
  
  // Información de experiencia
  farm_experience_years?: number;
  coffee_experience_years?: number;
  
  // Certificaciones
  certification_type?: CertificationType;
  certification_number?: string;
  certification_expiry?: Date;
  
  // Información de producción
  total_farm_area?: number; // hectáreas
  coffee_area?: number; // hectáreas
  other_crops?: string;
  farming_practices?: FarmingPractice;
  processing_method?: ProcessingMethod;
  annual_production?: number; // kg/año
  quality_score?: number; // 1-100
  preferred_varieties?: string;
  
  // Metadatos
  notes?: string;
  status: CoffeeGrowerStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  created_by: number;
  updated_by?: number;
  deleted_by?: number;
  
  // Campos calculados (joins)
  farms_count?: number;
  total_area?: number;
}

// Solicitudes de API
export interface CoffeeGrowerCreateRequest {
  identification_number: string;
  identification_type: IdentificationType;
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: Date;
  gender?: Gender;
  address?: string;
  department: string;
  municipality: string;
  rural_zone?: string;
  farm_experience_years?: number;
  coffee_experience_years?: number;
  certification_type?: CertificationType;
  certification_number?: string;
  certification_expiry?: Date;
  total_farm_area?: number;
  coffee_area?: number;
  other_crops?: string;
  farming_practices?: FarmingPractice;
  processing_method?: ProcessingMethod;
  annual_production?: number;
  quality_score?: number;
  preferred_varieties?: string;
  notes?: string;
}

export interface CoffeeGrowerUpdateRequest {
  identification_number?: string;
  identification_type?: IdentificationType;
  full_name?: string;
  email?: string;
  phone?: string;
  birth_date?: Date;
  gender?: Gender;
  address?: string;
  department?: string;
  municipality?: string;
  rural_zone?: string;
  farm_experience_years?: number;
  coffee_experience_years?: number;
  certification_type?: CertificationType;
  certification_number?: string;
  certification_expiry?: Date;
  total_farm_area?: number;
  coffee_area?: number;
  other_crops?: string;
  farming_practices?: FarmingPractice;
  processing_method?: ProcessingMethod;
  annual_production?: number;
  quality_score?: number;
  preferred_varieties?: string;
  notes?: string;
  status?: CoffeeGrowerStatus;
}

// Filtros para listado
export interface CoffeeGrowerListFilters extends BaseFilters {
  status?: CoffeeGrowerStatus;
  department?: string;
  municipality?: string;
  certification_type?: CertificationType;
  farming_practices?: FarmingPractice;
  processing_method?: ProcessingMethod;
  date_range?: DateRange;
  min_experience?: number;
  max_experience?: number;
  min_area?: number;
  max_area?: number;
  min_production?: number;
  max_production?: number;
}

// Respuesta de listado
export interface CoffeeGrowerListResponse {
  data: CoffeeGrower[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Estadísticas de caficultores
export interface CoffeeGrowerStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  new_this_month: number;
  by_department: Array<{
    department: string;
    count: number;
  }>;
  by_certification: Array<{
    certification_type: string;
    count: number;
  }>;
  averages: {
    farm_experience_years: number;
    coffee_experience_years: number;
    total_farm_area: number;
    coffee_area: number;
    annual_production: number;
  };
  monthly_growth: Array<{
    month: string;
    count: number;
  }>;
}

// Métricas de caficultores
export interface CoffeeGrowerMetrics {
  total_registered: number;
  active_growers: number;
  total_production: number;
  average_farm_size: number;
  certification_rate: number;
  geographic_distribution: Array<{
    department: string;
    municipality: string;
    count: number;
    percentage: number;
  }>;
  production_trends: Array<{
    period: string;
    production: number;
    growers_count: number;
  }>;
  quality_distribution: Array<{
    score_range: string;
    count: number;
    percentage: number;
  }>;
}

// Reporte de caficultores
export interface CoffeeGrowerReport {
  id: number;
  title: string;
  description: string;
  filters: CoffeeGrowerListFilters;
  generated_at: Date;
  generated_by: number;
  file_url?: string;
  status: 'pending' | 'completed' | 'failed';
  total_records: number;
  file_size?: number;
}

export interface CoffeeGrowerReportRequest {
  title: string;
  description?: string;
  filters: CoffeeGrowerListFilters;
  format: 'pdf' | 'excel' | 'csv';
  include_farms?: boolean;
  include_production_data?: boolean;
}