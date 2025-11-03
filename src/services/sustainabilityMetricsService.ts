import {
  SustainabilityMetrics,
  CarbonFootprint,
  EnvironmentalImpact,
  SustainabilityGoals,
  CertificationStatus,
  BiodiversityMetrics,
  WaterFootprint,
  SoilHealthMetrics,
  SustainabilityRecommendation,
  SustainabilitySettings
} from '../types/resourceOptimization';

class SustainabilityMetricsService {
  private settings: SustainabilitySettings = {
    carbonNeutralTarget: 2030,
    waterReductionTarget: 25, // 25% reducción
    biodiversityGoal: 'high',
    organicTransition: false,
    certificationTargets: ['rainforest_alliance', 'organic'],
    reportingFrequency: 'monthly'
  };

  // Algoritmo principal de cálculo de métricas de sostenibilidad
  async calculateSustainabilityMetrics(
    waterUsage: number,
    fertilizerUsage: number,
    pesticideUsage: number,
    energyConsumption: number,
    farmArea: number
  ): Promise<SustainabilityMetrics> {
    const currentDate = new Date();
    
    // Calcular huella de carbono
    const carbonFootprint = this.calculateCarbonFootprint(
      waterUsage,
      fertilizerUsage,
      pesticideUsage,
      energyConsumption,
      farmArea
    );

    // Calcular huella hídrica
    const waterFootprint = this.calculateWaterFootprint(waterUsage, farmArea);

    // Evaluar impacto ambiental
    const environmentalImpact = this.assessEnvironmentalImpact(
      fertilizerUsage,
      pesticideUsage,
      farmArea
    );

    // Métricas de biodiversidad
    const biodiversityMetrics = this.calculateBiodiversityMetrics(farmArea);

    // Salud del suelo
    const soilHealthMetrics = this.assessSoilHealth(fertilizerUsage, farmArea);

    // Estado de certificaciones
    const certificationStatus = this.evaluateCertificationStatus();

    // Objetivos de sostenibilidad
    const sustainabilityGoals = this.trackSustainabilityGoals(
      carbonFootprint,
      waterFootprint,
      environmentalImpact
    );

    // Puntuación general de sostenibilidad
    const overallScore = this.calculateOverallSustainabilityScore(
      carbonFootprint,
      waterFootprint,
      environmentalImpact,
      biodiversityMetrics,
      soilHealthMetrics
    );

    // Recomendaciones de mejora
    const recommendations = this.generateSustainabilityRecommendations(
      carbonFootprint,
      waterFootprint,
      environmentalImpact,
      overallScore
    );

    return {
      id: `sustainability_${Date.now()}`,
      timestamp: currentDate,
      carbonFootprint,
      waterFootprint,
      environmentalImpact,
      biodiversityMetrics,
      soilHealthMetrics,
      certificationStatus,
      sustainabilityGoals,
      overallScore,
      recommendations,
      trendAnalysis: this.generateTrendAnalysis(),
      benchmarkComparison: this.generateBenchmarkComparison(overallScore)
    };
  }

  // Calcular huella de carbono
  private calculateCarbonFootprint(
    waterUsage: number,
    fertilizerUsage: number,
    pesticideUsage: number,
    energyConsumption: number,
    farmArea: number
  ): CarbonFootprint {
    // Factores de emisión (kg CO2 equivalente)
    const emissionFactors = {
      water: 0.0003, // kg CO2/L
      nitrogen: 5.87, // kg CO2/kg N
      phosphorus: 1.2, // kg CO2/kg P2O5
      potassium: 0.65, // kg CO2/kg K2O
      pesticides: 16.5, // kg CO2/kg ingrediente activo
      electricity: 0.45, // kg CO2/kWh
      diesel: 2.68 // kg CO2/L
    };

    // Cálculos de emisiones por categoría
    const waterEmissions = waterUsage * emissionFactors.water;
    
    // Estimación de NPK en fertilizantes (simplificado)
    const nitrogenContent = fertilizerUsage * 0.2; // 20% N promedio
    const phosphorusContent = fertilizerUsage * 0.1; // 10% P2O5 promedio
    const potassiumContent = fertilizerUsage * 0.15; // 15% K2O promedio
    
    const fertilizerEmissions = (nitrogenContent * emissionFactors.nitrogen) +
                               (phosphorusContent * emissionFactors.phosphorus) +
                               (potassiumContent * emissionFactors.potassium);

    const pesticideEmissions = pesticideUsage * emissionFactors.pesticides;
    const energyEmissions = energyConsumption * emissionFactors.electricity;

    // Emisiones de maquinaria (estimado)
    const machineryEmissions = farmArea * 25; // 25 kg CO2/ha promedio

    const totalEmissions = waterEmissions + fertilizerEmissions + 
                          pesticideEmissions + energyEmissions + machineryEmissions;

    // Secuestro de carbono por café (estimado)
    const carbonSequestration = farmArea * 2.5 * 1000; // 2.5 ton CO2/ha/año

    const netEmissions = Math.max(0, totalEmissions - carbonSequestration);
    const emissionsPerHectare = totalEmissions / farmArea;
    const emissionsPerKgCoffee = totalEmissions / (farmArea * 1200); // 1200 kg/ha promedio

    return {
      totalEmissions: Math.round(totalEmissions),
      netEmissions: Math.round(netEmissions),
      emissionsPerHectare: Math.round(emissionsPerHectare),
      emissionsPerKgCoffee: Math.round(emissionsPerKgCoffee * 1000) / 1000,
      carbonSequestration: Math.round(carbonSequestration),
      breakdown: {
        water: Math.round(waterEmissions),
        fertilizers: Math.round(fertilizerEmissions),
        pesticides: Math.round(pesticideEmissions),
        energy: Math.round(energyEmissions),
        machinery: Math.round(machineryEmissions)
      },
      reductionTarget: this.calculateCarbonReductionTarget(totalEmissions),
      offsetOpportunities: this.identifyOffsetOpportunities(farmArea)
    };
  }

  // Calcular huella hídrica
  private calculateWaterFootprint(waterUsage: number, farmArea: number): WaterFootprint {
    const waterPerHectare = waterUsage / farmArea;
    const waterPerKgCoffee = waterUsage / (farmArea * 1200); // 1200 kg/ha promedio

    // Clasificación de eficiencia hídrica
    let efficiency = 'high';
    if (waterPerKgCoffee > 20) efficiency = 'low';
    else if (waterPerKgCoffee > 15) efficiency = 'medium';

    // Agua virtual (agua incorporada en insumos)
    const virtualWater = this.calculateVirtualWater(farmArea);
    
    const totalWaterFootprint = waterUsage + virtualWater;

    return {
      directWaterUse: waterUsage,
      virtualWater,
      totalWaterFootprint,
      waterPerHectare: Math.round(waterPerHectare),
      waterPerKgCoffee: Math.round(waterPerKgCoffee * 10) / 10,
      efficiency,
      rainwaterHarvesting: this.assessRainwaterHarvesting(farmArea),
      conservationPotential: this.calculateWaterConservationPotential(waterUsage),
      qualityImpact: this.assessWaterQualityImpact()
    };
  }

  // Evaluar impacto ambiental
  private assessEnvironmentalImpact(
    fertilizerUsage: number,
    pesticideUsage: number,
    farmArea: number
  ): EnvironmentalImpact {
    // Índice de toxicidad (simplificado)
    const fertilizerToxicity = this.calculateFertilizerToxicity(fertilizerUsage);
    const pesticideToxicity = this.calculatePesticideToxicity(pesticideUsage);
    
    const overallToxicity = (fertilizerToxicity + pesticideToxicity) / 2;

    // Riesgo de eutrofización
    const eutrophicationRisk = this.calculateEutrophicationRisk(fertilizerUsage, farmArea);

    // Impacto en polinizadores
    const pollinatorImpact = this.assessPollinatorImpact(pesticideUsage);

    // Contaminación del suelo
    const soilContamination = this.assessSoilContamination(fertilizerUsage, pesticideUsage);

    // Puntuación general (0-100, menor es mejor)
    const overallImpact = Math.round(
      (overallToxicity * 0.3) +
      (eutrophicationRisk * 0.25) +
      (pollinatorImpact * 0.25) +
      (soilContamination * 0.2)
    );

    return {
      overallImpact,
      toxicityIndex: overallToxicity,
      eutrophicationRisk,
      pollinatorImpact,
      soilContamination,
      airQualityImpact: this.assessAirQualityImpact(pesticideUsage),
      waterQualityImpact: this.assessWaterQualityImpact(),
      mitigationMeasures: this.suggestMitigationMeasures(overallImpact)
    };
  }

  // Calcular métricas de biodiversidad
  private calculateBiodiversityMetrics(farmArea: number): BiodiversityMetrics {
    // Simulación de métricas de biodiversidad
    const shadeTreeCoverage = Math.round(Math.random() * 40 + 30); // 30-70%
    const nativeSpeciesCount = Math.round(Math.random() * 50 + 25); // 25-75 especies
    const habitatConnectivity = Math.round(Math.random() * 30 + 60); // 60-90%
    
    // Índice de biodiversidad (0-100)
    const biodiversityIndex = Math.round(
      (shadeTreeCoverage * 0.4) +
      (Math.min(nativeSpeciesCount, 50) * 0.4 * 2) +
      (habitatConnectivity * 0.2)
    );

    return {
      biodiversityIndex,
      shadeTreeCoverage,
      nativeSpeciesCount,
      habitatConnectivity,
      corridorLength: Math.round(farmArea * 0.1 * 1000), // metros de corredores
      conservationAreas: Math.round(farmArea * 0.15), // 15% áreas de conservación
      threatLevel: biodiversityIndex > 70 ? 'low' : biodiversityIndex > 50 ? 'medium' : 'high',
      improvementOpportunities: this.identifyBiodiversityImprovements(biodiversityIndex)
    };
  }

  // Evaluar salud del suelo
  private assessSoilHealth(fertilizerUsage: number, farmArea: number): SoilHealthMetrics {
    const fertilizerIntensity = fertilizerUsage / farmArea;
    
    // Métricas simuladas basadas en intensidad de fertilización
    const organicMatter = Math.max(2, 5 - (fertilizerIntensity / 100)); // 2-5%
    const pHLevel = Math.round((6.0 + Math.random() * 1.5) * 10) / 10; // 6.0-7.5
    const erosionRisk = fertilizerIntensity > 200 ? 'high' : 
                       fertilizerIntensity > 100 ? 'medium' : 'low';
    
    // Índice de salud del suelo (0-100)
    const soilHealthIndex = Math.round(
      (Math.min(organicMatter, 5) * 20) +
      (Math.abs(6.5 - pHLevel) < 0.5 ? 30 : 20) +
      (erosionRisk === 'low' ? 30 : erosionRisk === 'medium' ? 20 : 10) +
      (20) // Factores adicionales
    );

    return {
      soilHealthIndex,
      organicMatter,
      pHLevel,
      erosionRisk,
      compactionLevel: fertilizerIntensity > 150 ? 'medium' : 'low',
      microbialActivity: soilHealthIndex > 70 ? 'high' : soilHealthIndex > 50 ? 'medium' : 'low',
      nutrientBalance: this.assessNutrientBalance(fertilizerIntensity),
      improvementActions: this.suggestSoilImprovements(soilHealthIndex)
    };
  }

  // Evaluar estado de certificaciones
  private evaluateCertificationStatus(): CertificationStatus {
    return {
      currentCertifications: ['utz'], // Simulado
      inProgress: ['rainforest_alliance'],
      eligible: ['organic', 'fair_trade'],
      requirements: {
        rainforest_alliance: {
          progress: 65,
          missingRequirements: [
            'Reducir uso de pesticidas en 20%',
            'Implementar plan de biodiversidad',
            'Capacitación en sostenibilidad'
          ],
          estimatedCompletion: '8 meses'
        },
        organic: {
          progress: 30,
          missingRequirements: [
            'Eliminar pesticidas sintéticos',
            'Período de transición de 3 años',
            'Plan de manejo orgánico',
            'Certificación de insumos'
          ],
          estimatedCompletion: '36 meses'
        }
      },
      benefits: {
        premiumPrice: 15, // 15% precio premium promedio
        marketAccess: ['Europa', 'Estados Unidos', 'Japón'],
        brandValue: 'Alto'
      }
    };
  }

  // Seguimiento de objetivos de sostenibilidad
  private trackSustainabilityGoals(
    carbonFootprint: CarbonFootprint,
    waterFootprint: WaterFootprint,
    environmentalImpact: EnvironmentalImpact
  ): SustainabilityGoals {
    const currentYear = new Date().getFullYear();
    const yearsToTarget = this.settings.carbonNeutralTarget - currentYear;
    
    // Progreso hacia neutralidad de carbono
    const carbonNeutralProgress = Math.max(0, 
      100 - (carbonFootprint.netEmissions / (carbonFootprint.totalEmissions * 0.1))
    );

    // Progreso en reducción de agua
    const waterReductionProgress = Math.min(100,
      (20000 - waterFootprint.directWaterUse) / 20000 * 100 // Baseline 20,000L
    );

    return {
      carbonNeutralTarget: {
        targetYear: this.settings.carbonNeutralTarget,
        currentProgress: Math.round(carbonNeutralProgress),
        annualReductionNeeded: Math.round(carbonFootprint.netEmissions / yearsToTarget),
        onTrack: carbonNeutralProgress > (100 - yearsToTarget * 10)
      },
      waterReduction: {
        targetReduction: this.settings.waterReductionTarget,
        currentProgress: Math.round(Math.max(0, waterReductionProgress)),
        onTrack: waterReductionProgress >= this.settings.waterReductionTarget * 0.8
      },
      biodiversityGoal: {
        target: this.settings.biodiversityGoal,
        currentStatus: 'medium', // Basado en métricas calculadas
        actions: [
          'Aumentar cobertura arbórea',
          'Crear corredores biológicos',
          'Reducir pesticidas'
        ]
      },
      certificationTargets: this.settings.certificationTargets.map(cert => ({
        certification: cert,
        progress: cert === 'rainforest_alliance' ? 65 : 30,
        timeline: cert === 'rainforest_alliance' ? '8 meses' : '36 meses'
      }))
    };
  }

  // Calcular puntuación general de sostenibilidad
  private calculateOverallSustainabilityScore(
    carbonFootprint: CarbonFootprint,
    waterFootprint: WaterFootprint,
    environmentalImpact: EnvironmentalImpact,
    biodiversityMetrics: BiodiversityMetrics,
    soilHealthMetrics: SoilHealthMetrics
  ): number {
    // Normalizar métricas a escala 0-100 (mayor es mejor)
    const carbonScore = Math.max(0, 100 - (carbonFootprint.emissionsPerKgCoffee * 10));
    const waterScore = waterFootprint.efficiency === 'high' ? 85 : 
                      waterFootprint.efficiency === 'medium' ? 65 : 45;
    const environmentalScore = Math.max(0, 100 - environmentalImpact.overallImpact);
    const biodiversityScore = biodiversityMetrics.biodiversityIndex;
    const soilScore = soilHealthMetrics.soilHealthIndex;

    // Pesos para cada categoría
    const weights = {
      carbon: 0.25,
      water: 0.20,
      environmental: 0.25,
      biodiversity: 0.15,
      soil: 0.15
    };

    const overallScore = (carbonScore * weights.carbon) +
                        (waterScore * weights.water) +
                        (environmentalScore * weights.environmental) +
                        (biodiversityScore * weights.biodiversity) +
                        (soilScore * weights.soil);

    return Math.round(overallScore);
  }

  // Generar recomendaciones de sostenibilidad
  private generateSustainabilityRecommendations(
    carbonFootprint: CarbonFootprint,
    waterFootprint: WaterFootprint,
    environmentalImpact: EnvironmentalImpact,
    overallScore: number
  ): SustainabilityRecommendation[] {
    const recommendations: SustainabilityRecommendation[] = [];

    // Recomendaciones de carbono
    if (carbonFootprint.emissionsPerKgCoffee > 2) {
      recommendations.push({
        category: 'carbon',
        priority: 'high',
        action: 'Reducir emisiones de fertilizantes',
        description: 'Implementar fertilización de precisión y usar fertilizantes de liberación lenta',
        expectedImpact: 'Reducción de 20-30% en emisiones de fertilizantes',
        implementationCost: 'Medio',
        timeframe: '3-6 meses',
        certificationBenefit: true
      });
    }

    // Recomendaciones de agua
    if (waterFootprint.efficiency === 'low') {
      recommendations.push({
        category: 'water',
        priority: 'high',
        action: 'Mejorar eficiencia hídrica',
        description: 'Instalar sistema de riego por goteo y sensores de humedad',
        expectedImpact: 'Reducción de 25-40% en consumo de agua',
        implementationCost: 'Alto',
        timeframe: '2-4 meses',
        certificationBenefit: true
      });
    }

    // Recomendaciones ambientales
    if (environmentalImpact.overallImpact > 60) {
      recommendations.push({
        category: 'environmental',
        priority: 'medium',
        action: 'Implementar manejo integrado de plagas',
        description: 'Reducir dependencia de pesticidas químicos mediante control biológico',
        expectedImpact: 'Reducción de 30-50% en impacto ambiental',
        implementationCost: 'Medio',
        timeframe: '4-8 meses',
        certificationBenefit: true
      });
    }

    // Recomendaciones generales de sostenibilidad
    if (overallScore < 70) {
      recommendations.push({
        category: 'general',
        priority: 'medium',
        action: 'Plan integral de sostenibilidad',
        description: 'Desarrollar estrategia holística que incluya todas las áreas de mejora',
        expectedImpact: 'Mejora general del 15-25% en puntuación de sostenibilidad',
        implementationCost: 'Alto',
        timeframe: '6-12 meses',
        certificationBenefit: true
      });
    }

    // Recomendaciones de certificación
    recommendations.push({
      category: 'certification',
      priority: 'low',
      action: 'Avanzar hacia certificación Rainforest Alliance',
      description: 'Completar requisitos pendientes para obtener certificación',
      expectedImpact: 'Acceso a mercados premium y precio 10-15% superior',
      implementationCost: 'Medio',
      timeframe: '8-12 meses',
      certificationBenefit: true
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Métodos auxiliares para cálculos específicos
  private calculateCarbonReductionTarget(totalEmissions: number): number {
    const currentYear = new Date().getFullYear();
    const yearsToTarget = this.settings.carbonNeutralTarget - currentYear;
    return Math.round(totalEmissions / yearsToTarget);
  }

  private identifyOffsetOpportunities(farmArea: number): string[] {
    return [
      'Reforestación de áreas degradadas',
      'Sistemas agroforestales',
      'Compostaje de residuos orgánicos',
      'Energía solar para procesamiento',
      'Conservación de bosques existentes'
    ];
  }

  private calculateVirtualWater(farmArea: number): number {
    // Agua virtual en fertilizantes y pesticidas (estimado)
    return farmArea * 500; // 500L/ha promedio
  }

  private assessRainwaterHarvesting(farmArea: number): {
    potential: number;
    currentCapture: number;
    recommendation: string;
  } {
    const potential = farmArea * 800; // 800mm precipitación promedio
    const currentCapture = potential * 0.1; // 10% captura actual
    
    return {
      potential,
      currentCapture,
      recommendation: 'Implementar sistemas de captación de agua lluvia'
    };
  }

  private calculateWaterConservationPotential(waterUsage: number): number {
    return Math.round(waterUsage * 0.3); // 30% potencial de ahorro
  }

  private calculateFertilizerToxicity(fertilizerUsage: number): number {
    // Índice simplificado de toxicidad (0-100)
    return Math.min(100, fertilizerUsage / 10);
  }

  private calculatePesticideToxicity(pesticideUsage: number): number {
    // Índice simplificado de toxicidad (0-100)
    return Math.min(100, pesticideUsage * 5);
  }

  private calculateEutrophicationRisk(fertilizerUsage: number, farmArea: number): number {
    const intensity = fertilizerUsage / farmArea;
    return Math.min(100, intensity / 2);
  }

  private assessPollinatorImpact(pesticideUsage: number): number {
    return Math.min(100, pesticideUsage * 3);
  }

  private assessSoilContamination(fertilizerUsage: number, pesticideUsage: number): number {
    return Math.min(100, (fertilizerUsage / 20) + (pesticideUsage * 2));
  }

  private assessAirQualityImpact(pesticideUsage: number): number {
    return Math.min(100, pesticideUsage * 2);
  }

  private assessWaterQualityImpact(): number {
    return Math.round(Math.random() * 30 + 20); // 20-50 simulado
  }

  private suggestMitigationMeasures(overallImpact: number): string[] {
    const measures = [];
    
    if (overallImpact > 70) {
      measures.push('Transición a agricultura orgánica');
      measures.push('Implementar zonas buffer');
    }
    if (overallImpact > 50) {
      measures.push('Reducir aplicaciones de pesticidas');
      measures.push('Usar productos menos tóxicos');
    }
    if (overallImpact > 30) {
      measures.push('Mejorar timing de aplicaciones');
      measures.push('Capacitación en buenas prácticas');
    }

    return measures.length > 0 ? measures : ['Mantener prácticas actuales'];
  }

  private identifyBiodiversityImprovements(biodiversityIndex: number): string[] {
    const improvements = [];
    
    if (biodiversityIndex < 70) {
      improvements.push('Aumentar cobertura de árboles de sombra');
      improvements.push('Crear corredores biológicos');
    }
    if (biodiversityIndex < 50) {
      improvements.push('Establecer áreas de conservación');
      improvements.push('Plantar especies nativas');
    }
    
    return improvements.length > 0 ? improvements : ['Mantener nivel actual'];
  }

  private assessNutrientBalance(fertilizerIntensity: number): string {
    if (fertilizerIntensity > 200) return 'Exceso';
    if (fertilizerIntensity > 100) return 'Balanceado';
    return 'Deficiente';
  }

  private suggestSoilImprovements(soilHealthIndex: number): string[] {
    const improvements = [];
    
    if (soilHealthIndex < 70) {
      improvements.push('Aumentar materia orgánica');
      improvements.push('Implementar cultivos de cobertura');
    }
    if (soilHealthIndex < 50) {
      improvements.push('Reducir labranza');
      improvements.push('Aplicar compost regularmente');
    }
    
    return improvements.length > 0 ? improvements : ['Mantener prácticas actuales'];
  }

  // Generar análisis de tendencias
  private generateTrendAnalysis() {
    // Simulación de tendencias históricas
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentDate);
      month.setMonth(currentDate.getMonth() - i);
      
      months.push({
        month: month.toISOString().slice(0, 7),
        sustainabilityScore: Math.round(Math.random() * 20 + 60 + (i * 2)), // Tendencia creciente
        carbonFootprint: Math.round(Math.random() * 500 + 2000 - (i * 50)), // Tendencia decreciente
        waterEfficiency: Math.round(Math.random() * 10 + 70 + (i * 1.5)) // Tendencia creciente
      });
    }

    return {
      months,
      trends: {
        sustainability: 'improving',
        carbon: 'decreasing',
        water: 'improving'
      }
    };
  }

  // Generar comparación con benchmarks
  private generateBenchmarkComparison(overallScore: number) {
    return {
      industryAverage: 65,
      topPerformers: 85,
      yourScore: overallScore,
      ranking: overallScore > 80 ? 'Top 20%' : 
               overallScore > 65 ? 'Above Average' : 
               'Below Average',
      improvementNeeded: Math.max(0, 75 - overallScore) // Para llegar a "good"
    };
  }

  // Métodos de configuración
  updateSettings(newSettings: Partial<SustainabilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): SustainabilitySettings {
    return { ...this.settings };
  }

  // Generar reporte de sostenibilidad
  async generateSustainabilityReport(metrics: SustainabilityMetrics): Promise<{
    summary: string;
    keyFindings: string[];
    priorityActions: string[];
    certificationReadiness: string;
  }> {
    const summary = `Puntuación general de sostenibilidad: ${metrics.overallScore}/100. ` +
                   `Huella de carbono: ${metrics.carbonFootprint.emissionsPerKgCoffee} kg CO2/kg café. ` +
                   `Eficiencia hídrica: ${metrics.waterFootprint.efficiency}.`;

    const keyFindings = [
      `Emisiones totales: ${metrics.carbonFootprint.totalEmissions} kg CO2`,
      `Consumo de agua: ${metrics.waterFootprint.waterPerKgCoffee} L/kg café`,
      `Índice de biodiversidad: ${metrics.biodiversityMetrics.biodiversityIndex}/100`,
      `Salud del suelo: ${metrics.soilHealthMetrics.soilHealthIndex}/100`
    ];

    const priorityActions = metrics.recommendations
      .filter(r => r.priority === 'high')
      .map(r => r.action);

    const certificationReadiness = metrics.certificationStatus.currentCertifications.length > 0 ?
      'Certificado en algunos estándares' :
      'En proceso de certificación';

    return {
      summary,
      keyFindings,
      priorityActions,
      certificationReadiness
    };
  }
}

export const sustainabilityMetricsService = new SustainabilityMetricsService();