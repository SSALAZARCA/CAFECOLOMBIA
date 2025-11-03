// Tipos base para agentes de IA
export type EstadoProcesamiento = 'pendiente' | 'procesando' | 'completado' | 'error';
export type TipoAgente = 'fitosanitario' | 'predictivo' | 'rag' | 'optimizacion';
export type NivelConfianza = 'bajo' | 'medio' | 'alto';
export type SeveridadRiesgo = 'bajo' | 'medio' | 'alto' | 'critico';

// 👁️ Agente Fitosanitario (Diagnóstico por Imagen)
export interface DiagnosticoIA {
  id: string;
  imagenId: string;
  loteId: string;
  timestamp: Date;
  estadoProcesamiento: EstadoProcesamiento;
  diagnosticos: DiagnosticoDetalle[];
  confianzaGeneral: number;
  recomendaciones: RecomendacionTratamiento[];
  metadatos: MetadatosImagen;
}

export interface DiagnosticoDetalle {
  enfermedad: string;
  tipoProblema: 'plaga' | 'enfermedad' | 'deficiencia' | 'estres';
  confianza: number;
  descripcion: string;
  severidad: SeveridadRiesgo;
  areaAfectada: number; // porcentaje estimado
  tratamientoRecomendado: string;
  insumosRelacionados: string[];
  urgencia: 'inmediata' | '24h' | '48h' | 'semanal';
}

export interface RecomendacionTratamiento {
  accion: string;
  prioridad: number;
  costoEstimado: number;
  tiempoEjecucion: string;
  materialesNecesarios: string[];
  enlaceModulo?: 'insumos' | 'mip' | 'labores';
}

export interface MetadatosImagen {
  resolucion: { width: number; height: number };
  ubicacionGPS?: { lat: number; lng: number };
  condicionesLuz: 'optima' | 'buena' | 'regular' | 'mala';
  calidadImagen: number; // 0-100
  partePlanta: 'hoja' | 'fruto' | 'tallo' | 'raiz' | 'general';
  distanciaCaptura: 'macro' | 'cercana' | 'media' | 'lejana';
}

// 🌦️ Agente de Alerta Temprana (Predictivo)
export interface DatosPrediccion {
  id: string;
  fincaId: string;
  timestamp: Date;
  tipoPrediccion: 'roya' | 'broca' | 'mancha_hierro' | 'antracnosis' | 'general';
  probabilidadRiesgo: number; // 0-1
  nivelRiesgo: SeveridadRiesgo;
  fechaRiesgoEstimada: Date;
  factoresRiesgo: FactorRiesgo[];
  recomendacionesPreventivas: AccionPreventiva[];
  validez: number; // días de validez de la predicción
}

export interface FactorRiesgo {
  factor: string;
  tipo: 'climatico' | 'biologico' | 'agricola' | 'regional';
  valor: number;
  impacto: number; // contribución al riesgo total
  descripcion: string;
  tendencia: 'aumentando' | 'estable' | 'disminuyendo';
}

export interface AccionPreventiva {
  accion: string;
  ventanaTiempo: string; // "próximos 2-3 días"
  efectividad: number; // 0-100
  costo: number;
  complejidad: 'baja' | 'media' | 'alta';
  recursos: string[];
}

export interface DatosAmbientales {
  fecha: Date;
  temperatura: {
    min: number;
    max: number;
    promedio: number;
  };
  humedad: {
    relativa: number;
    absoluta?: number;
  };
  precipitacion: {
    cantidad: number; // mm
    intensidad: 'leve' | 'moderada' | 'fuerte';
    duracion: number; // horas
  };
  viento: {
    velocidad: number; // km/h
    direccion: string;
  };
  presionAtmosferica: number;
  radiacionSolar: number;
  fuenteDatos: 'sensor' | 'api' | 'manual' | 'estimado';
  confiabilidad: number; // 0-100
}

// 💬 Asistente Virtual Cafetero (LLM-RAG)
export interface ConsultaRAG {
  id: string;
  usuarioId: string;
  timestamp: Date;
  pregunta: string;
  contextoFinca: ContextoFinca;
  respuesta?: RespuestaRAG;
  estadoProcesamiento: EstadoProcesamiento;
  categoria: CategoriaConsulta;
  satisfaccion?: number; // 1-5
  seguimiento?: string[];
}

export interface RespuestaRAG {
  contenido: string;
  fuentes: FuenteDocumento[];
  confianza: number;
  accionesRecomendadas: AccionRecomendada[];
  enlacesRelevantes: EnlaceModulo[];
  tiempoRespuesta: number; // ms
  tokensUtilizados: number;
}

export interface FuenteDocumento {
  id: string;
  tipo: 'FNC' | 'ICA' | 'BPA' | 'NORMATIVA' | 'TECNICO';
  titulo: string;
  seccion?: string;
  relevancia: number; // 0-1
  fechaPublicacion: Date;
  url?: string;
}

export interface AccionRecomendada {
  accion: string;
  modulo: 'insumos' | 'mip' | 'finca' | 'traceability' | 'externo';
  parametros?: Record<string, any>;
  prioridad: 'baja' | 'media' | 'alta';
  descripcion: string;
}

export interface EnlaceModulo {
  modulo: string;
  ruta: string;
  descripcion: string;
  parametros?: Record<string, any>;
}

export type CategoriaConsulta = 
  | 'plagas_enfermedades'
  | 'fertilizacion'
  | 'normativas'
  | 'buenas_practicas'
  | 'costos'
  | 'calidad'
  | 'procesamiento'
  | 'comercializacion'
  | 'general';

export interface ContextoFinca {
  fincaId: string;
  ubicacion: {
    departamento: string;
    municipio: string;
    altitud: number;
    coordenadas?: { lat: number; lng: number };
  };
  caracteristicas: {
    areaTotal: number;
    variedadesCafe: string[];
    edadPromedio: number;
    sistemaProduccion: 'tradicional' | 'tecnificado' | 'organico';
  };
  estadoActual: {
    lotes: number;
    problemasRecientes: string[];
    tratamientosActivos: string[];
    proximasCosechas: Date[];
  };
  historial: {
    produccionAnterior: number;
    problemasComunes: string[];
    tratamientosExitosos: string[];
  };
}

// 📈 Agente de Optimización (Calidad y Costos)
export interface MetricasOptimizacion {
  id: string;
  fincaId: string;
  periodo: {
    inicio: Date;
    fin: Date;
    tipo: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  };
  timestamp: Date;
  costos: AnalisisCostos;
  produccion: AnalisisProduccion;
  calidad: AnalisisCalidad;
  eficiencia: AnalisisEficiencia;
  correlaciones: CorrelacionesDetectadas;
  recomendaciones: RecomendacionOptimizacion[];
  benchmarking?: ComparacionBenchmark;
}

export interface AnalisisCostos {
  total: number;
  porCategoria: {
    fertilizantes: number;
    pesticidas: number;
    manoObra: number;
    maquinaria: number;
    otros: number;
  };
  costoPorKg: number;
  tendencia: 'aumentando' | 'estable' | 'disminuyendo';
  eficienciaGasto: number; // 0-100
  oportunidadesAhorro: OportunidadAhorro[];
}

export interface AnalisisProduccion {
  totalKg: number;
  kgPorHectarea: number;
  distribucionPorLote: Record<string, number>;
  tendenciaProduccion: 'aumentando' | 'estable' | 'disminuyendo';
  factoresInfluyentes: FactorProduccion[];
  proyeccionProximaCosecha: number;
}

export interface AnalisisCalidad {
  puntajeTazaPromedio: number;
  distribucionCalidad: Record<string, number>; // excelente, buena, regular
  factoresCalidad: FactorCalidad[];
  correlacionProcesos: CorrelacionProceso[];
  oportunidadesMejora: string[];
}

export interface AnalisisEficiencia {
  eficienciaGeneral: number; // 0-100
  eficienciaPorProceso: Record<string, number>;
  tiemposOptimos: Record<string, number>;
  recursosOptimos: Record<string, number>;
  desperdicioDetectado: number;
}

export interface CorrelacionesDetectadas {
  costoVsProduccion: number; // -1 a 1
  tratamientoVsCalidad: number;
  climaVsRendimiento: number;
  fertilizacionVsProduccion: number;
  tiempoFermentacionVsCalidad: number;
  correlacionesSignificativas: CorrelacionSignificativa[];
}

export interface CorrelacionSignificativa {
  variables: [string, string];
  coeficiente: number;
  significancia: number;
  interpretacion: string;
  recomendacion: string;
}

export interface RecomendacionOptimizacion {
  tipo: 'costo' | 'produccion' | 'calidad' | 'eficiencia';
  titulo: string;
  descripcion: string;
  impactoEstimado: {
    ahorro?: number;
    incrementoProduccion?: number;
    mejoraCalidad?: number;
  };
  complejidadImplementacion: 'baja' | 'media' | 'alta';
  tiempoImplementacion: string;
  recursosNecesarios: string[];
  prioridad: number; // 1-10
  confianza: number; // 0-100
}

export interface OportunidadAhorro {
  categoria: string;
  descripcion: string;
  ahorroEstimado: number;
  porcentajeAhorro: number;
  facilidadImplementacion: 'facil' | 'moderada' | 'dificil';
  riesgo: 'bajo' | 'medio' | 'alto';
}

export interface FactorProduccion {
  factor: string;
  impacto: number; // -100 a 100
  controlable: boolean;
  recomendacion?: string;
}

export interface FactorCalidad {
  factor: string;
  correlacion: number; // -1 a 1
  importancia: number; // 0-100
  optimizable: boolean;
  valorOptimo?: number | string;
}

export interface CorrelacionProceso {
  proceso: string;
  parametro: string;
  correlacionCalidad: number;
  rangoOptimo: [number, number];
  unidad: string;
}

export interface ComparacionBenchmark {
  posicionPercentil: number; // 0-100
  metricasComparacion: Record<string, {
    valor: number;
    promedio: number;
    mejores10: number;
  }>;
  areasFortaleza: string[];
  areasMejora: string[];
  recomendacionesBenchmark: string[];
}

// Tipos para cola de procesamiento y sincronización
export interface TareaIA {
  id: string;
  tipo: TipoAgente;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  datos: any;
  timestamp: Date;
  intentos: number;
  maxIntentos: number;
  estado: EstadoProcesamiento;
  resultado?: any;
  error?: string;
  tiempoEstimado?: number; // segundos
}

export interface ResultadoIA {
  tareaId: string;
  tipo: TipoAgente;
  exito: boolean;
  datos?: any;
  error?: string;
  tiempoProcesamiento: number;
  timestamp: Date;
  metadatos?: Record<string, any>;
}

// Configuración y estado de agentes
export interface ConfiguracionAgente {
  tipo: TipoAgente;
  activo: boolean;
  configuracion: Record<string, any>;
  ultimaActualizacion: Date;
  version: string;
  limites: {
    requestsPorDia: number;
    requestsPorHora: number;
    tamanoMaximoImagen: number; // MB
  };
}

export interface EstadoSistemaIA {
  agentesActivos: TipoAgente[];
  tareasEnCola: number;
  tareasProcesando: number;
  ultimaSincronizacion: Date;
  conectividadCloud: boolean;
  estadoServicios: Record<string, 'activo' | 'inactivo' | 'error'>;
  estadisticasUso: EstadisticasUso;
}

export interface EstadisticasUso {
  totalConsultas: number;
  consultasExitosas: number;
  tiempoPromedioRespuesta: number;
  usoPorAgente: Record<TipoAgente, number>;
  satisfaccionPromedio: number;
  ultimoReset: Date;
}