import {
  PesticideOptimizationData,
  PesticideRecommendation,
  PestThreatLevel,
  PesticideApplication,
  PesticideResistanceData,
  PesticideOptimizationSettings,
  IPMStrategy,
  PesticideAlternative
} from '../types/resourceOptimization';

class PesticideOptimizationService {
  private settings: PesticideOptimizationSettings = {
    ipmApproach: true,
    resistanceManagement: true,
    organicPreference: 70,
    economicThreshold: 15, // % de daño económico
    environmentalPriority: 80,
    beneficialInsectProtection: true,
    rotationStrategy: 'mode_of_action'
  };

  // Algoritmo principal de optimización de pesticidas
  async optimizePesticideUsage(data: Partial<PesticideOptimizationData>): Promise<PesticideOptimizationData> {
    const currentDate = new Date();
    
    const optimizationData: PesticideOptimizationData = {
      id: `pesticide_opt_${Date.now()}`,
      timestamp: currentDate,
      currentThreats: data.currentThreats || this.generateMockCurrentThreats(),
      applicationHistory: data.applicationHistory || this.generateMockApplicationHistory(),
      resistanceData: data.resistanceData || this.generateMockResistanceData(),
      recommendations: [],
      ipmStrategy: data.ipmStrategy || this.generateMockIPMStrategy()
    };

    // Generar recomendaciones basadas en análisis integrado
    optimizationData.recommendations = await this.generatePesticideRecommendations(optimizationData);

    return optimizationData;
  }

  // Generar recomendaciones inteligentes de pesticidas
  private async generatePesticideRecommendations(data: PesticideOptimizationData): Promise<PesticideRecommendation[]> {
    const recommendations: PesticideRecommendation[] = [];
    const currentDate = new Date();

    // Análisis de amenazas críticas
    const criticalThreats = this.analyzeCriticalThreats(data.currentThreats);
    
    // Análisis de resistencia
    const resistanceAnalysis = this.analyzeResistanceRisk(data.resistanceData, data.applicationHistory);
    
    // Análisis de eficacia histórica
    const efficacyAnalysis = this.analyzeHistoricalEfficacy(data.applicationHistory);

    // Recomendaciones para amenazas inmediatas
    for (const threat of criticalThreats.immediate) {
      const immediateRecommendation = await this.generateImmediateTreatmentRecommendation(
        threat,
        resistanceAnalysis,
        efficacyAnalysis,
        currentDate
      );
      if (immediateRecommendation) {
        recommendations.push(immediateRecommendation);
      }
    }

    // Estrategia IPM preventiva
    if (this.settings.ipmApproach) {
      const preventiveRecommendations = await this.generateIPMPreventiveRecommendations(
        data.currentThreats,
        data.ipmStrategy,
        currentDate
      );
      recommendations.push(...preventiveRecommendations);
    }

    // Programa de rotación de pesticidas
    if (this.settings.resistanceManagement) {
      const rotationRecommendations = await this.generateRotationRecommendations(
        data.applicationHistory,
        resistanceAnalysis,
        currentDate
      );
      recommendations.push(...rotationRecommendations);
    }

    // Recomendaciones de monitoreo
    const monitoringRecommendations = this.generateMonitoringRecommendations(
      data.currentThreats,
      currentDate
    );
    recommendations.push(...monitoringRecommendations);

    return recommendations.sort((a, b) => {
      // Ordenar por urgencia y luego por efectividad
      const urgencyComparison = b.urgency.localeCompare(a.urgency);
      if (urgencyComparison !== 0) return urgencyComparison;
      return b.expectedEfficacy - a.expectedEfficacy;
    });
  }

  // Analizar amenazas críticas
  private analyzeCriticalThreats(threats: PestThreatLevel[]) {
    const immediate = threats.filter(t => t.severity === 'critical' && t.actionRequired);
    const upcoming = threats.filter(t => t.severity === 'high' && t.riskIncrease > 20);
    const monitoring = threats.filter(t => t.severity === 'medium' || t.severity === 'low');

    return {
      immediate,
      upcoming,
      monitoring,
      totalThreats: threats.length,
      criticalCount: immediate.length
    };
  }

  // Analizar riesgo de resistencia
  private analyzeResistanceRisk(resistanceData: PesticideResistanceData, history: PesticideApplication[]) {
    const recentApplications = history.filter(app => {
      const daysSince = (Date.now() - app.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 90; // Últimos 3 meses
    });

    // Contar aplicaciones por modo de acción
    const modeOfActionCount = recentApplications.reduce((acc, app) => {
      const mode = app.modeOfAction || 'unknown';
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Identificar modos de acción sobrecargados
    const overusedModes = Object.entries(modeOfActionCount)
      .filter(([_, count]) => count >= 3)
      .map(([mode, count]) => ({ mode, count }));

    return {
      overallRisk: this.calculateOverallResistanceRisk(resistanceData, overusedModes),
      overusedModes,
      resistantPests: resistanceData.resistantPests,
      recommendedAlternatives: this.getAlternativeModes(overusedModes.map(m => m.mode))
    };
  }

  private calculateOverallResistanceRisk(resistanceData: PesticideResistanceData, overusedModes: any[]): number {
    let riskScore = 0;
    
    // Riesgo por pestes resistentes
    riskScore += resistanceData.resistantPests.length * 20;
    
    // Riesgo por sobreuso de modos de acción
    riskScore += overusedModes.length * 15;
    
    // Riesgo por nivel de resistencia general
    riskScore += resistanceData.resistanceLevel * 10;
    
    return Math.min(100, riskScore);
  }

  private getAlternativeModes(overusedModes: string[]): string[] {
    const alternatives = {
      'acetylcholinesterase_inhibitor': ['sodium_channel_modulator', 'growth_regulator'],
      'sodium_channel_modulator': ['acetylcholinesterase_inhibitor', 'chitin_synthesis_inhibitor'],
      'growth_regulator': ['biological_control', 'pheromone_trap'],
      'chitin_synthesis_inhibitor': ['biological_control', 'growth_regulator']
    };

    const recommendedAlternatives = new Set<string>();
    
    for (const mode of overusedModes) {
      const alts = alternatives[mode as keyof typeof alternatives] || [];
      alts.forEach(alt => recommendedAlternatives.add(alt));
    }

    return Array.from(recommendedAlternatives);
  }

  // Analizar eficacia histórica
  private analyzeHistoricalEfficacy(history: PesticideApplication[]) {
    if (history.length === 0) {
      return { avgEfficacy: 75, bestProducts: [], worstProducts: [] };
    }

    const productEfficacy = history.reduce((acc, app) => {
      if (!acc[app.product]) {
        acc[app.product] = { total: 0, count: 0, applications: [] };
      }
      acc[app.product].total += app.efficacy;
      acc[app.product].count += 1;
      acc[app.product].applications.push(app);
      return acc;
    }, {} as Record<string, { total: number; count: number; applications: PesticideApplication[] }>);

    const productAverages = Object.entries(productEfficacy)
      .map(([product, data]) => ({
        product,
        avgEfficacy: data.total / data.count,
        applications: data.count
      }))
      .sort((a, b) => b.avgEfficacy - a.avgEfficacy);

    const avgEfficacy = history.reduce((sum, app) => sum + app.efficacy, 0) / history.length;

    return {
      avgEfficacy: Math.round(avgEfficacy),
      bestProducts: productAverages.slice(0, 3),
      worstProducts: productAverages.slice(-3).reverse()
    };
  }

  // Generar recomendación de tratamiento inmediato
  private async generateImmediateTreatmentRecommendation(
    threat: PestThreatLevel,
    resistanceAnalysis: any,
    efficacyAnalysis: any,
    date: Date
  ): Promise<PesticideRecommendation | null> {
    // Verificar si está por encima del umbral económico
    if (threat.populationLevel < this.settings.economicThreshold) {
      return null;
    }

    const applicationDate = new Date(date);
    applicationDate.setDate(date.getDate() + 1); // Aplicación al día siguiente

    // Seleccionar producto basado en eficacia y resistencia
    const recommendedProduct = this.selectOptimalProduct(
      threat,
      resistanceAnalysis,
      efficacyAnalysis
    );

    if (!recommendedProduct) return null;

    return {
      date: applicationDate,
      targetPest: threat.pestName,
      product: recommendedProduct.name,
      activeIngredient: recommendedProduct.activeIngredient,
      modeOfAction: recommendedProduct.modeOfAction,
      dosage: this.calculateOptimalDosage(threat, recommendedProduct),
      applicationMethod: this.selectApplicationMethod(threat, recommendedProduct),
      timing: this.getOptimalApplicationTiming(threat),
      weatherConditions: this.getOptimalWeatherConditions(recommendedProduct),
      expectedEfficacy: recommendedProduct.expectedEfficacy,
      costPerHectare: recommendedProduct.cost,
      environmentalImpact: recommendedProduct.environmentalScore,
      beneficialImpact: recommendedProduct.beneficialImpact,
      preharvest: recommendedProduct.preharvest,
      urgency: 'high',
      alternatives: this.getProductAlternatives(recommendedProduct),
      reasoning: `${threat.pestName} ha superado el umbral económico (${threat.populationLevel}% vs ${this.settings.economicThreshold}%). ${threat.symptoms.join(', ')}. Tratamiento inmediato requerido.`
    };
  }

  // Seleccionar producto óptimo
  private selectOptimalProduct(threat: PestThreatLevel, resistanceAnalysis: any, efficacyAnalysis: any) {
    const availableProducts = this.getAvailableProducts(threat.pestName);
    
    // Filtrar productos con resistencia conocida
    const viableProducts = availableProducts.filter(product => {
      return !resistanceAnalysis.resistantPests.some((pest: any) => 
        pest.pestName === threat.pestName && 
        pest.resistantTo.includes(product.modeOfAction)
      );
    });

    if (viableProducts.length === 0) return null;

    // Calcular puntuación para cada producto
    const scoredProducts = viableProducts.map(product => {
      let score = 0;
      
      // Eficacia histórica
      const historicalEfficacy = efficacyAnalysis.bestProducts.find((p: any) => p.product === product.name);
      if (historicalEfficacy) {
        score += historicalEfficacy.avgEfficacy * 0.3;
      } else {
        score += product.expectedEfficacy * 0.3;
      }
      
      // Preferencia orgánica
      if (product.organic && this.settings.organicPreference > 50) {
        score += this.settings.organicPreference * 0.2;
      }
      
      // Impacto ambiental (menor es mejor)
      score += (100 - product.environmentalScore) * 0.2;
      
      // Impacto en benéficos (menor es mejor)
      score += (100 - product.beneficialImpact) * 0.15;
      
      // Costo (menor es mejor, normalizado)
      const maxCost = Math.max(...viableProducts.map(p => p.cost));
      score += ((maxCost - product.cost) / maxCost) * 100 * 0.15;
      
      return { ...product, score };
    });

    // Retornar el producto con mayor puntuación
    return scoredProducts.sort((a, b) => b.score - a.score)[0];
  }

  // Obtener productos disponibles para una plaga específica
  private getAvailableProducts(pestName: string) {
    const productDatabase = {
      'Broca del café': [
        {
          name: 'Beauveria bassiana',
          activeIngredient: 'Beauveria bassiana',
          modeOfAction: 'biological_control',
          expectedEfficacy: 85,
          cost: 45,
          environmentalScore: 10,
          beneficialImpact: 5,
          preharvest: 0,
          organic: true
        },
        {
          name: 'Imidacloprid',
          activeIngredient: 'Imidacloprid',
          modeOfAction: 'acetylcholinesterase_inhibitor',
          expectedEfficacy: 90,
          cost: 35,
          environmentalScore: 70,
          beneficialImpact: 80,
          preharvest: 21,
          organic: false
        }
      ],
      'Roya del café': [
        {
          name: 'Cobre oxicloruro',
          activeIngredient: 'Cobre oxicloruro',
          modeOfAction: 'multi_site_contact',
          expectedEfficacy: 80,
          cost: 25,
          environmentalScore: 40,
          beneficialImpact: 20,
          preharvest: 14,
          organic: true
        },
        {
          name: 'Triazol',
          activeIngredient: 'Propiconazol',
          modeOfAction: 'sterol_biosynthesis_inhibitor',
          expectedEfficacy: 95,
          cost: 55,
          environmentalScore: 60,
          beneficialImpact: 40,
          preharvest: 28,
          organic: false
        }
      ],
      'Minador de la hoja': [
        {
          name: 'Aceite de neem',
          activeIngredient: 'Azadiractina',
          modeOfAction: 'growth_regulator',
          expectedEfficacy: 75,
          cost: 30,
          environmentalScore: 15,
          beneficialImpact: 10,
          preharvest: 3,
          organic: true
        },
        {
          name: 'Abamectina',
          activeIngredient: 'Abamectina',
          modeOfAction: 'sodium_channel_modulator',
          expectedEfficacy: 88,
          cost: 40,
          environmentalScore: 55,
          beneficialImpact: 60,
          preharvest: 14,
          organic: false
        }
      ]
    };

    return productDatabase[pestName as keyof typeof productDatabase] || [];
  }

  // Calcular dosis óptima
  private calculateOptimalDosage(threat: PestThreatLevel, product: any): string {
    const baseDosage = {
      'biological_control': '2-3 kg/ha',
      'acetylcholinesterase_inhibitor': '200-300 ml/ha',
      'multi_site_contact': '2-3 kg/ha',
      'sterol_biosynthesis_inhibitor': '300-400 ml/ha',
      'growth_regulator': '1-2 L/ha',
      'sodium_channel_modulator': '150-200 ml/ha'
    };

    let dosage = baseDosage[product.modeOfAction as keyof typeof baseDosage] || '200-300 ml/ha';

    // Ajustar según severidad
    if (threat.severity === 'critical') {
      dosage = dosage.replace(/(\d+)-(\d+)/, (match, min, max) => {
        const unit = match.split(/\d+/)[2];
        return `${max}${unit}`;
      });
    }

    return dosage;
  }

  // Seleccionar método de aplicación
  private selectApplicationMethod(threat: PestThreatLevel, product: any): string {
    const methodsByPest = {
      'Broca del café': 'Aspersión dirigida al fruto',
      'Roya del café': 'Aspersión foliar completa',
      'Minador de la hoja': 'Aspersión foliar dirigida'
    };

    const methodByMode = {
      'biological_control': 'Aspersión con boquillas de gota gruesa',
      'multi_site_contact': 'Aspersión foliar con buen cubrimiento',
      'sterol_biosynthesis_inhibitor': 'Aspersión sistémica',
      'growth_regulator': 'Aspersión foliar suave'
    };

    return methodsByPest[threat.pestName as keyof typeof methodsByPest] || 
           methodByMode[product.modeOfAction as keyof typeof methodByMode] || 
           'Aspersión foliar';
  }

  // Obtener timing óptimo de aplicación
  private getOptimalApplicationTiming(threat: PestThreatLevel): string {
    const timingByPest = {
      'Broca del café': 'Mañana temprano (6:00-8:00 AM) cuando los adultos están activos',
      'Roya del café': 'Tarde (4:00-6:00 PM) para mejor absorción foliar',
      'Minador de la hoja': 'Mañana (7:00-9:00 AM) antes del calor del día'
    };

    return timingByPest[threat.pestName as keyof typeof timingByPest] || 
           'Mañana temprano o tarde, evitando horas de calor intenso';
  }

  // Obtener condiciones climáticas óptimas
  private getOptimalWeatherConditions(product: any): string {
    const conditionsByMode = {
      'biological_control': 'Humedad relativa >60%, temperatura 20-28°C, sin lluvia por 6 horas',
      'multi_site_contact': 'Sin lluvia por 4 horas, viento <10 km/h',
      'sterol_biosynthesis_inhibitor': 'Sin lluvia por 8 horas, temperatura <30°C',
      'growth_regulator': 'Humedad relativa >50%, sin lluvia por 6 horas'
    };

    return conditionsByMode[product.modeOfAction as keyof typeof conditionsByMode] || 
           'Sin lluvia por 6 horas, viento moderado, evitar aplicación en horas de calor intenso';
  }

  // Obtener alternativas de producto
  private getProductAlternatives(product: any): PesticideAlternative[] {
    // Generar alternativas basadas en diferentes modos de acción
    const alternatives: PesticideAlternative[] = [];
    
    if (product.modeOfAction !== 'biological_control') {
      alternatives.push({
        name: 'Control biológico',
        reason: 'Menor impacto ambiental',
        efficacyDifference: -10,
        costDifference: 15,
        environmentalBenefit: 60
      });
    }

    if (!product.organic) {
      alternatives.push({
        name: 'Alternativa orgánica',
        reason: 'Certificación orgánica',
        efficacyDifference: -5,
        costDifference: 20,
        environmentalBenefit: 40
      });
    }

    return alternatives;
  }

  // Generar recomendaciones IPM preventivas
  private async generateIPMPreventiveRecommendations(
    threats: PestThreatLevel[],
    ipmStrategy: IPMStrategy,
    date: Date
  ): Promise<PesticideRecommendation[]> {
    const recommendations: PesticideRecommendation[] = [];
    const futureDate = new Date(date);
    futureDate.setDate(date.getDate() + 7);

    // Recomendaciones de monitoreo
    if (threats.some(t => t.severity === 'medium' || t.severity === 'high')) {
      recommendations.push({
        date: futureDate,
        targetPest: 'Múltiples plagas',
        product: 'Trampas de feromonas',
        activeIngredient: 'Feromonas específicas',
        modeOfAction: 'pheromone_trap',
        dosage: '2-4 trampas/ha',
        applicationMethod: 'Instalación de trampas',
        timing: 'Instalación permanente, revisión semanal',
        weatherConditions: 'Cualquier condición climática',
        expectedEfficacy: 70,
        costPerHectare: 20,
        environmentalImpact: 5,
        beneficialImpact: 0,
        preharvest: 0,
        urgency: 'medium',
        alternatives: [],
        reasoning: 'Monitoreo preventivo para detección temprana y reducción de poblaciones'
      });
    }

    // Recomendaciones de control biológico preventivo
    if (ipmStrategy.biologicalControl.length > 0) {
      const bioDate = new Date(futureDate);
      bioDate.setDate(futureDate.getDate() + 14);

      recommendations.push({
        date: bioDate,
        targetPest: 'Prevención general',
        product: 'Liberación de enemigos naturales',
        activeIngredient: 'Organismos benéficos',
        modeOfAction: 'biological_control',
        dosage: 'Según protocolo de liberación',
        applicationMethod: 'Liberación dirigida',
        timing: 'Inicio de temporada de riesgo',
        weatherConditions: 'Condiciones favorables para establecimiento',
        expectedEfficacy: 60,
        costPerHectare: 35,
        environmentalImpact: 0,
        beneficialImpact: -20, // Beneficio positivo
        preharvest: 0,
        urgency: 'low',
        alternatives: [],
        reasoning: 'Control biológico preventivo para mantener poblaciones de plagas bajo control natural'
      });
    }

    return recommendations;
  }

  // Generar recomendaciones de rotación
  private async generateRotationRecommendations(
    history: PesticideApplication[],
    resistanceAnalysis: any,
    date: Date
  ): Promise<PesticideRecommendation[]> {
    const recommendations: PesticideRecommendation[] = [];
    
    if (resistanceAnalysis.overusedModes.length > 0) {
      const rotationDate = new Date(date);
      rotationDate.setMonth(date.getMonth() + 1);

      for (const alternative of resistanceAnalysis.recommendedAlternatives) {
        recommendations.push({
          date: rotationDate,
          targetPest: 'Manejo de resistencia',
          product: `Producto con modo de acción: ${alternative}`,
          activeIngredient: 'Variable según producto',
          modeOfAction: alternative,
          dosage: 'Según etiqueta del producto',
          applicationMethod: 'Según recomendación específica',
          timing: 'Próximo ciclo de aplicación',
          weatherConditions: 'Según producto específico',
          expectedEfficacy: 80,
          costPerHectare: 40,
          environmentalImpact: 50,
          beneficialImpact: 40,
          preharvest: 14,
          urgency: 'medium',
          alternatives: [],
          reasoning: `Rotación necesaria para prevenir resistencia. Modos de acción sobreutilizados: ${resistanceAnalysis.overusedModes.map((m: any) => m.mode).join(', ')}`
        });
      }
    }

    return recommendations;
  }

  // Generar recomendaciones de monitoreo
  private generateMonitoringRecommendations(
    threats: PestThreatLevel[],
    date: Date
  ): PesticideRecommendation[] {
    const recommendations: PesticideRecommendation[] = [];
    const monitoringDate = new Date(date);
    monitoringDate.setDate(date.getDate() + 3);

    const lowThreats = threats.filter(t => t.severity === 'low' || t.severity === 'medium');
    
    if (lowThreats.length > 0) {
      recommendations.push({
        date: monitoringDate,
        targetPest: 'Monitoreo preventivo',
        product: 'Inspección visual y trampas',
        activeIngredient: 'No aplica',
        modeOfAction: 'monitoring',
        dosage: 'Inspección semanal',
        applicationMethod: 'Monitoreo visual y conteo',
        timing: 'Mañana temprano, 2 veces por semana',
        weatherConditions: 'Cualquier condición',
        expectedEfficacy: 90,
        costPerHectare: 5,
        environmentalImpact: 0,
        beneficialImpact: 0,
        preharvest: 0,
        urgency: 'low',
        alternatives: [],
        reasoning: `Monitoreo preventivo para ${lowThreats.map(t => t.pestName).join(', ')}. Detección temprana permite intervención oportuna.`
      });
    }

    return recommendations;
  }

  // Métodos para generar datos mock
  private generateMockCurrentThreats(): PestThreatLevel[] {
    const pests = ['Broca del café', 'Roya del café', 'Minador de la hoja', 'Cochinilla', 'Nematodos'];
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    const threats: PestThreatLevel[] = [];

    for (let i = 0; i < Math.floor(Math.random() * 4) + 2; i++) {
      const pest = pests[Math.floor(Math.random() * pests.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      threats.push({
        pestName: pest,
        severity,
        populationLevel: Math.round(Math.random() * 40 + 5), // 5-45%
        riskIncrease: Math.round(Math.random() * 50), // 0-50%
        actionRequired: severity === 'critical' || severity === 'high',
        symptoms: this.getPestSymptoms(pest),
        economicImpact: Math.round(Math.random() * 30 + 10), // 10-40%
        lastDetection: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Últimos 14 días
      });
    }

    return threats;
  }

  private getPestSymptoms(pest: string): string[] {
    const symptoms = {
      'Broca del café': ['Perforaciones en frutos', 'Caída prematura de frutos', 'Galerías en granos'],
      'Roya del café': ['Manchas amarillas en hojas', 'Pústulas naranjas', 'Defoliación'],
      'Minador de la hoja': ['Galerías serpenteantes', 'Hojas amarillentas', 'Reducción fotosíntesis'],
      'Cochinilla': ['Sustancia algodonosa', 'Hojas amarillas', 'Melaza en hojas'],
      'Nematodos': ['Raíces hinchadas', 'Crecimiento lento', 'Amarillamiento general']
    };

    return symptoms[pest as keyof typeof symptoms] || ['Síntomas generales'];
  }

  private generateMockApplicationHistory(): PesticideApplication[] {
    const history: PesticideApplication[] = [];
    const products = ['Imidacloprid', 'Beauveria bassiana', 'Cobre oxicloruro', 'Aceite de neem'];
    const pests = ['Broca del café', 'Roya del café', 'Minador de la hoja'];
    const modes = ['acetylcholinesterase_inhibitor', 'biological_control', 'multi_site_contact', 'growth_regulator'];

    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      history.push({
        date,
        product: products[Math.floor(Math.random() * products.length)],
        targetPest: pests[Math.floor(Math.random() * pests.length)],
        dosage: `${Math.round(Math.random() * 300 + 100)} ml/ha`,
        method: 'foliar',
        cost: Math.round(Math.random() * 50 + 25), // $25-75/ha
        efficacy: Math.round(Math.random() * 30 + 60), // 60-90%
        modeOfAction: modes[Math.floor(Math.random() * modes.length)],
        weatherConditions: 'Favorable',
        preharvest: Math.round(Math.random() * 30) // 0-30 días
      });
    }

    return history;
  }

  private generateMockResistanceData(): PesticideResistanceData {
    return {
      resistanceLevel: Math.round(Math.random() * 40 + 10), // 10-50%
      resistantPests: [
        {
          pestName: 'Broca del café',
          resistantTo: ['acetylcholinesterase_inhibitor'],
          resistanceLevel: Math.round(Math.random() * 30 + 20), // 20-50%
          detectionDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
        }
      ],
      lastAssessment: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      riskFactors: [
        'Uso repetido del mismo modo de acción',
        'Aplicaciones subdosificadas',
        'Falta de rotación de productos'
      ]
    };
  }

  private generateMockIPMStrategy(): IPMStrategy {
    return {
      culturalControl: [
        'Poda sanitaria regular',
        'Manejo de sombra',
        'Control de malezas',
        'Fertilización balanceada'
      ],
      biologicalControl: [
        'Beauveria bassiana',
        'Metarhizium anisopliae',
        'Chrysoperla externa',
        'Coccophagus sp.'
      ],
      mechanicalControl: [
        'Trampas de feromonas',
        'Trampas cromáticas',
        'Recolección manual',
        'Barreras físicas'
      ],
      chemicalControl: [
        'Aplicaciones dirigidas',
        'Rotación de modos de acción',
        'Uso de umbrales económicos',
        'Productos selectivos'
      ],
      monitoring: [
        'Inspección semanal',
        'Conteo de poblaciones',
        'Evaluación de daños',
        'Registro de aplicaciones'
      ]
    };
  }

  // Métodos de configuración
  updateSettings(newSettings: Partial<PesticideOptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): PesticideOptimizationSettings {
    return { ...this.settings };
  }

  // Calcular métricas de eficiencia
  async calculatePesticideEfficiencyMetrics(history: PesticideApplication[]): Promise<{
    totalApplications: number;
    averageEfficacy: number;
    costPerApplication: number;
    resistanceRisk: string;
    organicPercentage: number;
  }> {
    if (history.length === 0) {
      return {
        totalApplications: 0,
        averageEfficacy: 0,
        costPerApplication: 0,
        resistanceRisk: 'Sin datos',
        organicPercentage: 0
      };
    }

    const totalApplications = history.length;
    const averageEfficacy = history.reduce((sum, app) => sum + app.efficacy, 0) / history.length;
    const totalCost = history.reduce((sum, app) => sum + app.cost, 0);
    const costPerApplication = totalCost / totalApplications;

    // Análisis de riesgo de resistencia
    const recentApplications = history.filter(app => {
      const daysSince = (Date.now() - app.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 90;
    });

    const modeCount = recentApplications.reduce((acc, app) => {
      const mode = app.modeOfAction || 'unknown';
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxModeCount = Math.max(...Object.values(modeCount));
    let resistanceRisk = 'Bajo';
    if (maxModeCount >= 4) resistanceRisk = 'Alto';
    else if (maxModeCount >= 3) resistanceRisk = 'Medio';

    // Calcular porcentaje orgánico (simulado)
    const organicProducts = ['Beauveria bassiana', 'Aceite de neem', 'Cobre oxicloruro'];
    const organicApplications = history.filter(app => 
      organicProducts.some(organic => app.product.includes(organic))
    ).length;
    const organicPercentage = (organicApplications / totalApplications) * 100;

    return {
      totalApplications,
      averageEfficacy: Math.round(averageEfficacy),
      costPerApplication: Math.round(costPerApplication * 100) / 100,
      resistanceRisk,
      organicPercentage: Math.round(organicPercentage)
    };
  }
}

export const pesticideOptimizationService = new PesticideOptimizationService();