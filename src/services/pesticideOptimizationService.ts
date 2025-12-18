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
import { offlineDB } from '../utils/offlineDB';

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

    // 1. Obtener datos reales de la BD
    const realData = await this.fetchRealPesticideData();

    // 2. Usar datos reales o fallbacks vacíos (NO inventados)
    const currentThreats = data.currentThreats || realData.threats;
    const applicationHistory = data.applicationHistory || realData.history;

    // 3. Crear estructura de datos vacía o parcial si falta información
    const optimizationData: PesticideOptimizationData = {
      id: `pesticide_opt_${Date.now()}`,
      timestamp: currentDate,
      currentThreats,
      applicationHistory,
      resistanceData: data.resistanceData || this.getEmptyResistanceData(),
      recommendations: [],
      ipmStrategy: data.ipmStrategy || this.getEmptyIPMStrategy()
    };

    // 4. Generar recomendaciones solo si hay amenazas reales
    optimizationData.recommendations = await this.generatePesticideRecommendations(
      optimizationData,
      realData.inventory
    );

    return optimizationData;
  }

  // Obtener datos reales: Monitoreos recientes, Inventario de pesticidas, Historial de gastos
  private async fetchRealPesticideData() {
    try {
      // A. Amenazas Reales (Monitoreos últimos 14 días)
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const recentMonitors = await offlineDB.pestMonitoring
        .where('observationDate')
        .above(fourteenDaysAgo)
        .toArray();

      // Mapear monitoreos a PestThreatLevel
      const threats: PestThreatLevel[] = recentMonitors.map(m => ({
        pestName: m.pestType,
        severity: (m.severity as 'low' | 'medium' | 'high' | 'critical') || 'low',
        populationLevel: m.affectedArea || 0, // Usamos área afectada como proxy de población
        riskIncrease: 0, // Difícil de calcular sin histórico granular
        actionRequired: ['high', 'critical'].includes(m.severity),
        symptoms: m.symptoms ? [m.symptoms] : ['Detectado en monitoreo'],
        economicImpact: 0, // Requiere cálculo complejo
        lastDetection: new Date(m.observationDate)
      }));

      // B. Inventario Real (Filtrar pesticidas)
      const allInventory = await offlineDB.inventory.toArray();
      const pesticideInventory = allInventory.filter(item => {
        const type = (item as any).tipo || ''; // Si existe el campo tipo
        const name = (item.inputId || '').toLowerCase();
        // Filtrar por tipo o palabras clave
        return ['insecticida', 'fungicida', 'herbicida', 'acaricida'].includes(type) ||
          name.includes('insecticida') || name.includes('fungicida') || name.includes('herbicida') ||
          name.includes('control') || name.includes('broca') || name.includes('roya');
      }).map(item => ({
        id: item.id,
        name: item.inputId,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost || 0,
        expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
        daysToExpire: item.expirationDate ? Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999
      }));

      // C. Historial Real (Gastos cat. 'Pesticidas')
      const expenses = await offlineDB.expenses
        .where('category')
        .equals('Pesticidas') // Asume consistencia en categoría
        .reverse()
        .limit(20)
        .toArray();

      const history: PesticideApplication[] = expenses.map(exp => ({
        date: new Date(exp.date),
        product: exp.description,
        targetPest: 'General/Desconocido', // No guardamos esto en gastos
        dosage: '0',
        method: 'aspersión', // Asumido
        cost: exp.amount,
        efficacy: 0, // Desconocido en gastos
        modeOfAction: 'unknown',
        weatherConditions: 'N/A',
        preharvest: 0
      }));

      return { threats, inventory: pesticideInventory, history };

    } catch (error) {
      console.error("Error fetching real pesticide data:", error);
      return { threats: [], inventory: [], history: [] };
    }
  }

  // Generar recomendaciones inteligentes
  private async generatePesticideRecommendations(
    data: PesticideOptimizationData,
    inventory: any[]
  ): Promise<PesticideRecommendation[]> {
    const recommendations: PesticideRecommendation[] = [];
    const currentDate = new Date();

    // 1. Recomendaciones para Amenazas Activas (Detectadas en Monitoreo)
    const criticalThreats = data.currentThreats.filter(t => ['high', 'critical'].includes(t.severity));

    for (const threat of criticalThreats) {
      // Buscar producto en inventario que sirva (coincidencia de nombre simple por ahora)
      // En un sistema real, habría una BD de "Qué producto mata qué plaga"
      // Aquí haremos una búsqueda heurística simple en el inventario real
      const usefulProduct = inventory.find(i =>
        (threat.pestName.toLowerCase().includes('broca') && (i.name.toLowerCase().includes('broca') || i.name.toLowerCase().includes('insecticida'))) ||
        (threat.pestName.toLowerCase().includes('roya') && (i.name.toLowerCase().includes('roya') || i.name.toLowerCase().includes('fungicida'))) ||
        (threat.pestName.toLowerCase().includes('minador') && (i.name.toLowerCase().includes('minador') || i.name.toLowerCase().includes('abamectina')))
      );

      if (usefulProduct) {
        recommendations.push({
          date: new Date(Date.now() + 86400000), // Mañana
          targetPest: threat.pestName,
          product: usefulProduct.name, // Usar producto REAL
          activeIngredient: 'Ver etiqueta',
          modeOfAction: 'chemical_control',
          dosage: `Usar stock disponible (${usefulProduct.quantity} ${usefulProduct.unit})`,
          applicationMethod: 'Aspersión Focalizada',
          timing: 'Temprano en la mañana',
          weatherConditions: 'Sin lluvia pronosticada',
          expectedEfficacy: 85,
          costPerHectare: 0, // Ya comprado
          environmentalImpact: 50,
          beneficialImpact: 0,
          preharvest: 15,
          urgency: 'high',
          alternatives: [],
          reasoning: `Amenaza crítica detectada: ${threat.pestName}. Se recomienda usar producto en inventario: ${usefulProduct.name}.`
        });
      } else {
        // Si no hay producto en stock, recomendar compra
        recommendations.push({
          date: new Date(),
          targetPest: threat.pestName,
          product: `Adquisición Control para ${threat.pestName}`,
          activeIngredient: 'Consultar Agrónomo',
          modeOfAction: 'N/A',
          dosage: 'N/A',
          applicationMethod: 'Compra',
          timing: 'Inmediato',
          weatherConditions: 'N/A',
          expectedEfficacy: 0,
          costPerHectare: 0,
          environmentalImpact: 0,
          beneficialImpact: 0,
          preharvest: 0,
          urgency: 'critical',
          alternatives: [],
          reasoning: `Amenaza crítica: ${threat.pestName} y SIN inventario adecuado. Adquiera un producto específico urgentemente.`
        });
      }
    }

    // 2. Si no hay amenazas detectadas (Monitoreo vacío o limpio)
    if (data.currentThreats.length === 0) {
      // Recomendar Monitoreo Preventivo
      recommendations.push({
        date: new Date(Date.now() + 3 * 86400000),
        targetPest: 'Monitoreo Preventivo',
        product: 'Inspección de Campo',
        activeIngredient: 'N/A',
        modeOfAction: 'monitoring',
        dosage: '1 hora/ha',
        applicationMethod: 'Recorrido en Zig-Zag',
        timing: 'Mañana',
        weatherConditions: 'Sin lluvia',
        expectedEfficacy: 100, // La inspección es 100% eficaz para saber la verdad
        costPerHectare: 0,
        environmentalImpact: 0,
        beneficialImpact: 0,
        preharvest: 0,
        urgency: 'low',
        alternatives: [],
        reasoning: 'No se han registrado monitoreos de plagas recientes (o no hay amenazas). Realice una inspección para actualizar el estado sanitario.'
      });
    }

    return recommendations;
  }

  // Estructuras vacías/seguras
  private getEmptyResistanceData(): PesticideResistanceData {
    return {
      resistanceLevel: 0,
      resistantPests: [],
      lastAssessment: new Date(),
      riskFactors: []
    };
  }

  private getEmptyIPMStrategy(): IPMStrategy {
    return {
      culturalControl: [],
      biologicalControl: [],
      mechanicalControl: [],
      chemicalControl: [],
      monitoring: []
    };
  }

  // Métodos de configuración
  updateSettings(newSettings: Partial<PesticideOptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): PesticideOptimizationSettings {
    return { ...this.settings };
  }

  // Calcular métricas de eficiencia (Real)
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
        resistanceRisk: 'Sin Historial',
        organicPercentage: 0
      };
    }

    const totalApplications = history.length;
    // En gastos reales no tenemos eficacia (% de muerte de plaga), así que no podemos calcularlo
    const averageEfficacy = 0;
    const totalCost = history.reduce((sum, app) => sum + app.cost, 0);
    const costPerApplication = totalCost / totalApplications;

    return {
      totalApplications,
      averageEfficacy,
      costPerApplication: Math.round(costPerApplication * 100) / 100,
      resistanceRisk: 'Datos insuficientes', // Requiere saber modos de acción detallados
      organicPercentage: 0 // Difícil saber solo por nombre en gastos
    };
  }

  // Métodos auxiliares conservados pero simplificados o no usados si no hay data real para alimentarlos
  // Se mantienen si son utilidad pura, se eliminan si eran generadores de mock.
  // ... (Limpieza de métodos mock y auxiliares no usados)
}

export const pesticideOptimizationService = new PesticideOptimizationService();