import {
  FertilizerOptimizationData,
  FertilizerRecommendation,
  SoilAnalysis,
  PlantNutritionStatus,
  FertilizerApplication,
  FertilizerCostAnalysis,
  FertilizerOptimizationSettings,
  NutrientDeficiency,
  FertilizerSplit
} from '../types/resourceOptimization';

class FertilizerOptimizationService {
  private settings: FertilizerOptimizationSettings = {
    approach: 'integrated',
    soilTestFrequency: 6,
    splitApplications: true,
    micronutrientFocus: true,
    costPriority: 60,
    yieldPriority: 85,
    environmentalPriority: 70
  };

  // Algoritmo principal de optimización de fertilizantes
  async optimizeFertilizerUsage(data: Partial<FertilizerOptimizationData>): Promise<FertilizerOptimizationData> {
    const currentDate = new Date();
    
    const optimizationData: FertilizerOptimizationData = {
      id: `fertilizer_opt_${Date.now()}`,
      timestamp: currentDate,
      soilAnalysis: data.soilAnalysis || this.generateMockSoilAnalysis(),
      plantNutritionStatus: data.plantNutritionStatus || this.generateMockNutritionStatus(),
      fertilizerHistory: data.fertilizerHistory || this.generateMockFertilizerHistory(),
      recommendations: [],
      costAnalysis: data.costAnalysis || this.generateMockCostAnalysis()
    };

    // Generar recomendaciones basadas en análisis de suelo y estado nutricional
    optimizationData.recommendations = await this.generateFertilizerRecommendations(optimizationData);

    return optimizationData;
  }

  // Generar recomendaciones inteligentes de fertilización
  private async generateFertilizerRecommendations(data: FertilizerOptimizationData): Promise<FertilizerRecommendation[]> {
    const recommendations: FertilizerRecommendation[] = [];
    const currentDate = new Date();

    // Análisis de deficiencias nutricionales
    const deficiencyAnalysis = this.analyzeNutrientDeficiencies(data.plantNutritionStatus);
    
    // Análisis de pH del suelo
    const pHAnalysis = this.analyzeSoilPH(data.soilAnalysis);
    
    // Análisis de eficiencia histórica
    const efficiencyAnalysis = this.analyzeFertilizerEfficiency(data.fertilizerHistory);

    // Recomendaciones inmediatas para deficiencias críticas
    for (const deficiency of deficiencyAnalysis.critical) {
      const immediateRecommendation = this.generateImmediateRecommendation(
        deficiency, 
        data.soilAnalysis, 
        currentDate
      );
      if (immediateRecommendation) {
        recommendations.push(immediateRecommendation);
      }
    }

    // Programa de fertilización estacional
    const seasonalProgram = this.generateSeasonalFertilizationProgram(
      data.soilAnalysis,
      data.plantNutritionStatus,
      efficiencyAnalysis
    );
    recommendations.push(...seasonalProgram);

    // Recomendaciones de micronutrientes
    if (this.settings.micronutrientFocus) {
      const micronutrientRecommendations = this.generateMicronutrientRecommendations(
        data.soilAnalysis,
        data.plantNutritionStatus
      );
      recommendations.push(...micronutrientRecommendations);
    }

    // Recomendaciones de mejora del suelo
    const soilImprovementRecommendations = this.generateSoilImprovementRecommendations(
      data.soilAnalysis,
      pHAnalysis
    );
    recommendations.push(...soilImprovementRecommendations);

    return recommendations.sort((a, b) => {
      // Ordenar por fecha y luego por impacto esperado
      const dateComparison = a.date.getTime() - b.date.getTime();
      if (dateComparison !== 0) return dateComparison;
      return b.expectedYieldIncrease - a.expectedYieldIncrease;
    });
  }

  // Analizar deficiencias nutricionales
  private analyzeNutrientDeficiencies(nutritionStatus: PlantNutritionStatus) {
    const critical = nutritionStatus.deficiencies.filter(d => d.severity === 'severe');
    const moderate = nutritionStatus.deficiencies.filter(d => d.severity === 'moderate');
    const mild = nutritionStatus.deficiencies.filter(d => d.severity === 'mild');

    return {
      critical,
      moderate,
      mild,
      overallSeverity: this.calculateOverallSeverity(nutritionStatus.deficiencies)
    };
  }

  private calculateOverallSeverity(deficiencies: NutrientDeficiency[]): number {
    if (deficiencies.length === 0) return 0;
    
    const severityScores = { 'mild': 1, 'moderate': 2, 'severe': 3 };
    const totalScore = deficiencies.reduce((sum, def) => sum + severityScores[def.severity], 0);
    return totalScore / deficiencies.length;
  }

  // Analizar pH del suelo
  private analyzeSoilPH(soilAnalysis: SoilAnalysis) {
    const optimalPH = { min: 6.0, max: 6.8 }; // Rango óptimo para café
    
    return {
      current: soilAnalysis.pH,
      optimal: optimalPH,
      status: soilAnalysis.pH < optimalPH.min ? 'acidic' : 
              soilAnalysis.pH > optimalPH.max ? 'alkaline' : 'optimal',
      adjustmentNeeded: Math.abs(soilAnalysis.pH - 6.4), // 6.4 es el pH ideal
      limeRequirement: soilAnalysis.pH < 6.0 ? this.calculateLimeRequirement(soilAnalysis) : 0
    };
  }

  private calculateLimeRequirement(soilAnalysis: SoilAnalysis): number {
    // Cálculo simplificado de requerimiento de cal
    const pHDifference = 6.4 - soilAnalysis.pH;
    const baseRequirement = pHDifference * 500; // kg/ha por unidad de pH
    
    // Ajustar según capacidad de intercambio catiónico
    const cecAdjustment = soilAnalysis.cationExchangeCapacity / 20;
    
    return Math.round(baseRequirement * cecAdjustment);
  }

  // Analizar eficiencia histórica de fertilizantes
  private analyzeFertilizerEfficiency(history: FertilizerApplication[]) {
    if (history.length === 0) {
      return { avgEfficiency: 75, costPerKg: 2.5, bestMethod: 'fertigation' };
    }

    const avgEfficiency = history.reduce((sum, app) => sum + app.efficiency, 0) / history.length;
    const totalCost = history.reduce((sum, app) => sum + app.cost, 0);
    const totalAmount = history.reduce((sum, app) => sum + app.amount, 0);
    const costPerKg = totalAmount > 0 ? totalCost / totalAmount : 2.5;

    // Determinar mejor método basado en eficiencia
    const methodEfficiency = history.reduce((acc, app) => {
      if (!acc[app.method]) {
        acc[app.method] = { total: 0, count: 0 };
      }
      acc[app.method].total += app.efficiency;
      acc[app.method].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const bestMethod = Object.entries(methodEfficiency)
      .map(([method, data]) => ({ method, avgEfficiency: data.total / data.count }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)[0]?.method || 'fertigation';

    return {
      avgEfficiency: Math.round(avgEfficiency),
      costPerKg: Math.round(costPerKg * 100) / 100,
      bestMethod
    };
  }

  // Generar recomendación inmediata para deficiencias críticas
  private generateImmediateRecommendation(
    deficiency: NutrientDeficiency,
    soilAnalysis: SoilAnalysis,
    date: Date
  ): FertilizerRecommendation | null {
    const nutrientFormulations = this.getNutrientFormulations();
    const formulation = nutrientFormulations[deficiency.nutrient];
    
    if (!formulation) return null;

    const amount = this.calculateApplicationAmount(deficiency, soilAnalysis);
    
    return {
      date,
      type: formulation.name,
      composition: formulation.composition,
      amount,
      method: 'foliar', // Aplicación foliar para corrección rápida
      timing: 'Inmediato - mañana temprano',
      expectedYieldIncrease: deficiency.impact * 0.8, // 80% de recuperación del impacto
      costBenefit: this.calculateCostBenefit(amount, formulation.cost, deficiency.impact),
      environmentalImpact: formulation.environmentalScore,
      confidence: 90,
      reasoning: `Deficiencia severa de ${deficiency.nutrient} detectada. ${deficiency.symptoms.join(', ')}. Aplicación foliar para corrección rápida.`
    };
  }

  // Generar programa de fertilización estacional
  private generateSeasonalFertilizationProgram(
    soilAnalysis: SoilAnalysis,
    nutritionStatus: PlantNutritionStatus,
    efficiency: any
  ): FertilizerRecommendation[] {
    const program: FertilizerRecommendation[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    // Programa base según etapa fenológica del café
    const seasonalSchedule = this.getCoffeeSeasonalSchedule();
    
    for (const phase of seasonalSchedule) {
      if (this.isPhaseApplicable(phase, currentMonth)) {
        const recommendation = this.generatePhaseRecommendation(
          phase,
          soilAnalysis,
          nutritionStatus,
          efficiency,
          currentDate
        );
        
        if (recommendation) {
          program.push(recommendation);
        }
      }
    }

    return program;
  }

  private getCoffeeSeasonalSchedule() {
    return [
      {
        name: 'Pre-floración',
        months: [1, 2], // Enero-Febrero
        focus: ['nitrogen', 'potassium'],
        priority: 'high',
        description: 'Preparación para floración'
      },
      {
        name: 'Floración',
        months: [3, 4], // Marzo-Abril
        focus: ['phosphorus', 'calcium'],
        priority: 'critical',
        description: 'Soporte durante floración'
      },
      {
        name: 'Desarrollo del fruto',
        months: [5, 6, 7], // Mayo-Julio
        focus: ['potassium', 'magnesium'],
        priority: 'high',
        description: 'Desarrollo y llenado del grano'
      },
      {
        name: 'Maduración',
        months: [8, 9], // Agosto-Septiembre
        focus: ['potassium'],
        priority: 'medium',
        description: 'Maduración del fruto'
      },
      {
        name: 'Post-cosecha',
        months: [10, 11, 12], // Octubre-Diciembre
        focus: ['nitrogen', 'phosphorus'],
        priority: 'medium',
        description: 'Recuperación y preparación'
      }
    ];
  }

  private isPhaseApplicable(phase: any, currentMonth: number): boolean {
    return phase.months.includes(currentMonth + 1); // +1 porque los meses van de 0-11
  }

  private generatePhaseRecommendation(
    phase: any,
    soilAnalysis: SoilAnalysis,
    nutritionStatus: PlantNutritionStatus,
    efficiency: any,
    baseDate: Date
  ): FertilizerRecommendation | null {
    const applicationDate = new Date(baseDate);
    applicationDate.setDate(baseDate.getDate() + Math.random() * 14); // Dentro de 2 semanas

    // Determinar composición basada en el enfoque de la fase
    const composition = this.calculatePhaseComposition(phase, soilAnalysis);
    const amount = this.calculatePhaseAmount(phase, nutritionStatus);

    // Determinar si usar aplicaciones divididas
    const splitApplications = this.settings.splitApplications && amount > 50 
      ? this.generateSplitApplications(applicationDate, amount) 
      : undefined;

    return {
      date: applicationDate,
      type: `Fertilizante ${phase.name}`,
      composition,
      amount,
      method: efficiency.bestMethod,
      timing: this.getOptimalApplicationTiming(phase),
      splitApplications,
      expectedYieldIncrease: this.calculateExpectedYieldIncrease(phase, amount),
      costBenefit: this.calculateCostBenefit(amount, 3.0, 15), // Costo promedio $3/kg
      environmentalImpact: this.calculateEnvironmentalImpact(composition, amount),
      confidence: 85,
      reasoning: `${phase.description}. Enfoque en ${phase.focus.join(' y ')} para optimizar ${phase.name.toLowerCase()}.`
    };
  }

  // Generar recomendaciones de micronutrientes
  private generateMicronutrientRecommendations(
    soilAnalysis: SoilAnalysis,
    nutritionStatus: PlantNutritionStatus
  ): FertilizerRecommendation[] {
    const recommendations: FertilizerRecommendation[] = [];
    const micronutrients = soilAnalysis.micronutrients;
    const deficientMicronutrients = [];

    // Verificar niveles de micronutrientes
    if (micronutrients.iron < 10) deficientMicronutrients.push('iron');
    if (micronutrients.manganese < 5) deficientMicronutrients.push('manganese');
    if (micronutrients.zinc < 3) deficientMicronutrients.push('zinc');
    if (micronutrients.copper < 2) deficientMicronutrients.push('copper');
    if (micronutrients.boron < 1) deficientMicronutrients.push('boron');

    if (deficientMicronutrients.length > 0) {
      const applicationDate = new Date();
      applicationDate.setDate(applicationDate.getDate() + 7);

      recommendations.push({
        date: applicationDate,
        type: 'Mezcla de micronutrientes',
        composition: this.generateMicronutrientComposition(deficientMicronutrients),
        amount: 5, // kg/ha
        method: 'foliar',
        timing: 'Mañana temprano (6:00-8:00 AM)',
        expectedYieldIncrease: 8,
        costBenefit: 4.5,
        environmentalImpact: 20,
        confidence: 80,
        reasoning: `Deficiencias detectadas en: ${deficientMicronutrients.join(', ')}. Aplicación foliar para corrección rápida.`
      });
    }

    return recommendations;
  }

  // Generar recomendaciones de mejora del suelo
  private generateSoilImprovementRecommendations(
    soilAnalysis: SoilAnalysis,
    pHAnalysis: any
  ): FertilizerRecommendation[] {
    const recommendations: FertilizerRecommendation[] = [];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    // Recomendación de cal si el pH es muy bajo
    if (pHAnalysis.limeRequirement > 0) {
      recommendations.push({
        date: futureDate,
        type: 'Cal agrícola',
        composition: { nitrogen: 0, phosphorus: 0, potassium: 0 },
        amount: pHAnalysis.limeRequirement,
        method: 'broadcast',
        timing: 'Inicio de temporada seca',
        expectedYieldIncrease: 12,
        costBenefit: 3.8,
        environmentalImpact: 15,
        confidence: 90,
        reasoning: `pH del suelo (${soilAnalysis.pH}) por debajo del rango óptimo. Cal necesaria para mejorar disponibilidad de nutrientes.`
      });
    }

    // Recomendación de materia orgánica si está baja
    if (soilAnalysis.organicMatter < 3) {
      const organicDate = new Date(futureDate);
      organicDate.setMonth(organicDate.getMonth() + 1);

      recommendations.push({
        date: organicDate,
        type: 'Compost orgánico',
        composition: { nitrogen: 2, phosphorus: 1, potassium: 1 },
        amount: 2000, // kg/ha
        method: 'broadcast',
        timing: 'Antes de la temporada de lluvias',
        expectedYieldIncrease: 15,
        costBenefit: 2.5,
        environmentalImpact: 5, // Impacto positivo
        confidence: 85,
        reasoning: `Materia orgánica baja (${soilAnalysis.organicMatter}%). Compost mejorará estructura del suelo y retención de nutrientes.`
      });
    }

    return recommendations;
  }

  // Métodos auxiliares
  private getNutrientFormulations() {
    return {
      nitrogen: {
        name: 'Urea',
        composition: { nitrogen: 46, phosphorus: 0, potassium: 0 },
        cost: 2.8,
        environmentalScore: 60
      },
      phosphorus: {
        name: 'Superfosfato triple',
        composition: { nitrogen: 0, phosphorus: 46, potassium: 0 },
        cost: 3.2,
        environmentalScore: 70
      },
      potassium: {
        name: 'Cloruro de potasio',
        composition: { nitrogen: 0, phosphorus: 0, potassium: 60 },
        cost: 2.5,
        environmentalScore: 75
      }
    };
  }

  private calculateApplicationAmount(deficiency: NutrientDeficiency, soilAnalysis: SoilAnalysis): number {
    const baseAmount = 20; // kg/ha base
    const severityMultiplier = { 'mild': 0.5, 'moderate': 1.0, 'severe': 1.5 };
    const impactMultiplier = deficiency.impact / 100;
    
    return Math.round(baseAmount * severityMultiplier[deficiency.severity] * impactMultiplier);
  }

  private calculateCostBenefit(amount: number, costPerKg: number, yieldImpact: number): number {
    const totalCost = amount * costPerKg;
    const yieldValue = yieldImpact * 50; // $50 por punto de rendimiento
    return Math.round((yieldValue / totalCost) * 100) / 100;
  }

  private calculatePhaseComposition(phase: any, soilAnalysis: SoilAnalysis) {
    const baseComposition = { nitrogen: 15, phosphorus: 10, potassium: 15 };
    
    // Ajustar según el enfoque de la fase
    if (phase.focus.includes('nitrogen')) baseComposition.nitrogen = 20;
    if (phase.focus.includes('phosphorus')) baseComposition.phosphorus = 15;
    if (phase.focus.includes('potassium')) baseComposition.potassium = 20;
    
    return baseComposition;
  }

  private calculatePhaseAmount(phase: any, nutritionStatus: PlantNutritionStatus): number {
    const baseAmount = 40; // kg/ha
    const priorityMultiplier = { 'low': 0.7, 'medium': 1.0, 'high': 1.3, 'critical': 1.5 };
    const healthMultiplier = (100 - nutritionStatus.overallHealth) / 100 + 0.5;
    
    return Math.round(baseAmount * priorityMultiplier[phase.priority] * healthMultiplier);
  }

  private generateSplitApplications(baseDate: Date, totalAmount: number): FertilizerSplit[] {
    const splits: FertilizerSplit[] = [];
    const splitCount = totalAmount > 100 ? 3 : 2;
    const percentages = splitCount === 3 ? [40, 35, 25] : [60, 40];
    
    for (let i = 0; i < splitCount; i++) {
      const splitDate = new Date(baseDate);
      splitDate.setDate(baseDate.getDate() + (i * 21)); // Cada 3 semanas
      
      splits.push({
        date: splitDate,
        percentage: percentages[i],
        reasoning: `Aplicación ${i + 1} de ${splitCount} para optimizar absorción`
      });
    }
    
    return splits;
  }

  private getOptimalApplicationTiming(phase: any): string {
    const timings = {
      'Pre-floración': 'Mañana temprano, antes del riego',
      'Floración': 'Tarde, después de la polinización',
      'Desarrollo del fruto': 'Mañana, con humedad del suelo adecuada',
      'Maduración': 'Evitar aplicaciones foliares',
      'Post-cosecha': 'Después de la poda, antes de lluvias'
    };
    
    return timings[phase.name] || 'Mañana temprano';
  }

  private calculateExpectedYieldIncrease(phase: any, amount: number): number {
    const baseIncrease = 10;
    const phaseMultiplier = { 'low': 0.8, 'medium': 1.0, 'high': 1.2, 'critical': 1.4 };
    const amountFactor = Math.min(amount / 50, 1.5); // Máximo 1.5x por cantidad
    
    return Math.round(baseIncrease * phaseMultiplier[phase.priority] * amountFactor);
  }

  private calculateEnvironmentalImpact(composition: any, amount: number): number {
    // Impacto base según composición (menor es mejor)
    const nitrogenImpact = composition.nitrogen * 0.8;
    const phosphorusImpact = composition.phosphorus * 0.6;
    const potassiumImpact = composition.potassium * 0.4;
    
    const totalImpact = (nitrogenImpact + phosphorusImpact + potassiumImpact) * (amount / 100);
    
    return Math.min(100, Math.round(totalImpact));
  }

  private generateMicronutrientComposition(deficientNutrients: string[]) {
    const composition: any = { nitrogen: 0, phosphorus: 0, potassium: 0, micronutrients: {} };
    
    for (const nutrient of deficientNutrients) {
      composition.micronutrients[nutrient] = this.getMicronutrientRecommendedLevel(nutrient);
    }
    
    return composition;
  }

  private getMicronutrientRecommendedLevel(nutrient: string): number {
    const levels = {
      iron: 2.0,
      manganese: 1.5,
      zinc: 1.0,
      copper: 0.5,
      boron: 0.3
    };
    
    return levels[nutrient as keyof typeof levels] || 1.0;
  }

  // Métodos para generar datos mock
  private generateMockSoilAnalysis(): SoilAnalysis {
    return {
      pH: Math.round((Math.random() * 2 + 5.5) * 10) / 10, // 5.5-7.5
      organicMatter: Math.round((Math.random() * 3 + 2) * 10) / 10, // 2-5%
      nitrogen: Math.round(Math.random() * 30 + 20), // 20-50 ppm
      phosphorus: Math.round(Math.random() * 20 + 10), // 10-30 ppm
      potassium: Math.round(Math.random() * 100 + 150), // 150-250 ppm
      calcium: Math.round(Math.random() * 500 + 1000), // 1000-1500 ppm
      magnesium: Math.round(Math.random() * 100 + 200), // 200-300 ppm
      sulfur: Math.round(Math.random() * 10 + 15), // 15-25 ppm
      micronutrients: {
        iron: Math.round((Math.random() * 15 + 5) * 10) / 10, // 5-20 ppm
        manganese: Math.round((Math.random() * 8 + 2) * 10) / 10, // 2-10 ppm
        zinc: Math.round((Math.random() * 4 + 1) * 10) / 10, // 1-5 ppm
        copper: Math.round((Math.random() * 2 + 1) * 10) / 10, // 1-3 ppm
        boron: Math.round((Math.random() * 1.5 + 0.5) * 10) / 10 // 0.5-2 ppm
      },
      cationExchangeCapacity: Math.round(Math.random() * 10 + 15), // 15-25 meq/100g
      testDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Últimos 90 días
    };
  }

  private generateMockNutritionStatus(): PlantNutritionStatus {
    const deficiencies: NutrientDeficiency[] = [];
    const nutrients = ['nitrogen', 'phosphorus', 'potassium', 'calcium', 'magnesium'];
    const severities = ['mild', 'moderate', 'severe'] as const;
    
    // Generar algunas deficiencias aleatorias
    for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
      const nutrient = nutrients[Math.floor(Math.random() * nutrients.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      deficiencies.push({
        nutrient,
        severity,
        symptoms: this.getNutrientDeficiencySymptoms(nutrient),
        impact: Math.round(Math.random() * 30 + 10) // 10-40% impacto
      });
    }

    return {
      stage: {
        stage: 'flowering',
        daysInStage: 30,
        waterRequirement: 25,
        criticalPeriod: true
      },
      deficiencies,
      excesses: [],
      overallHealth: Math.round(Math.random() * 30 + 70), // 70-100%
      yieldPotential: Math.round(Math.random() * 20 + 80) // 80-100%
    };
  }

  private getNutrientDeficiencySymptoms(nutrient: string): string[] {
    const symptoms = {
      nitrogen: ['Hojas amarillentas', 'Crecimiento lento', 'Hojas pequeñas'],
      phosphorus: ['Hojas púrpuras', 'Floración tardía', 'Raíces débiles'],
      potassium: ['Bordes de hojas quemados', 'Frutos pequeños', 'Resistencia baja'],
      calcium: ['Necrosis apical', 'Hojas deformadas', 'Frutos agrietados'],
      magnesium: ['Clorosis intervenal', 'Hojas rojizas', 'Caída prematura']
    };
    
    return symptoms[nutrient as keyof typeof symptoms] || ['Síntomas generales'];
  }

  private generateMockFertilizerHistory(): FertilizerApplication[] {
    const history: FertilizerApplication[] = [];
    const types = ['NPK 15-15-15', 'Urea', 'Superfosfato', 'Cloruro de potasio'];
    const methods = ['broadcast', 'banding', 'foliar', 'fertigation'] as const;
    
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      history.push({
        date,
        type: types[Math.floor(Math.random() * types.length)],
        composition: {
          nitrogen: Math.round(Math.random() * 20 + 10),
          phosphorus: Math.round(Math.random() * 15 + 5),
          potassium: Math.round(Math.random() * 20 + 10)
        },
        amount: Math.round(Math.random() * 50 + 25), // 25-75 kg/ha
        method: methods[Math.floor(Math.random() * methods.length)],
        cost: Math.round((Math.random() * 100 + 50) * 100) / 100, // $50-150
        efficiency: Math.round(Math.random() * 25 + 65) // 65-90%
      });
    }
    
    return history;
  }

  private generateMockCostAnalysis(): FertilizerCostAnalysis {
    return {
      totalCost: Math.round(Math.random() * 500 + 300), // $300-800
      costPerHectare: Math.round(Math.random() * 200 + 150), // $150-350/ha
      costPerKgYield: Math.round((Math.random() * 0.5 + 0.3) * 100) / 100, // $0.3-0.8/kg
      roi: Math.round((Math.random() * 2 + 2) * 100) / 100, // 2-4x
      paybackPeriod: Math.round(Math.random() * 60 + 30), // 30-90 días
      alternatives: [
        {
          name: 'Fertilizante orgánico',
          cost: Math.round(Math.random() * 100 + 200),
          efficiency: Math.round(Math.random() * 15 + 70),
          environmentalScore: Math.round(Math.random() * 20 + 80),
          availability: true
        },
        {
          name: 'Fertilizante de liberación lenta',
          cost: Math.round(Math.random() * 150 + 400),
          efficiency: Math.round(Math.random() * 10 + 85),
          environmentalScore: Math.round(Math.random() * 15 + 75),
          availability: true
        }
      ]
    };
  }

  // Métodos de configuración
  updateSettings(newSettings: Partial<FertilizerOptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): FertilizerOptimizationSettings {
    return { ...this.settings };
  }

  // Calcular métricas de rendimiento
  async calculateFertilizerEfficiencyMetrics(history: FertilizerApplication[]): Promise<{
    totalUsage: number;
    averageEfficiency: number;
    costPerKg: number;
    nutrientBalance: string;
  }> {
    if (history.length === 0) {
      return {
        totalUsage: 0,
        averageEfficiency: 0,
        costPerKg: 0,
        nutrientBalance: 'Sin datos'
      };
    }

    const totalUsage = history.reduce((sum, app) => sum + app.amount, 0);
    const averageEfficiency = history.reduce((sum, app) => sum + app.efficiency, 0) / history.length;
    const totalCost = history.reduce((sum, app) => sum + app.cost, 0);
    const costPerKg = totalUsage > 0 ? totalCost / totalUsage : 0;

    // Análisis de balance nutricional
    const totalN = history.reduce((sum, app) => sum + (app.composition.nitrogen * app.amount / 100), 0);
    const totalP = history.reduce((sum, app) => sum + (app.composition.phosphorus * app.amount / 100), 0);
    const totalK = history.reduce((sum, app) => sum + (app.composition.potassium * app.amount / 100), 0);

    const nPRatio = totalP > 0 ? totalN / totalP : 0;
    const nKRatio = totalK > 0 ? totalN / totalK : 0;

    let nutrientBalance = 'Balanceado';
    if (nPRatio > 4 || nKRatio > 2) {
      nutrientBalance = 'Exceso de nitrógeno';
    } else if (nPRatio < 2 || nKRatio < 0.8) {
      nutrientBalance = 'Deficiencia de nitrógeno';
    }

    return {
      totalUsage: Math.round(totalUsage),
      averageEfficiency: Math.round(averageEfficiency),
      costPerKg: Math.round(costPerKg * 100) / 100,
      nutrientBalance
    };
  }
}

export const fertilizerOptimizationService = new FertilizerOptimizationService();