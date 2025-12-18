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
import { offlineDB } from '../utils/offlineDB';

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

    // 1. Obtener datos reales de inventario e historial de gastos
    const realData = await this.fetchRealFertilizerData();

    // 2. Usar análisis de suelo proporcionado o valores por defecto (No inventar)
    const soilAnalysis = data.soilAnalysis || this.getEmptySoilAnalysis();

    // 3. Usar estado nutricional proporcionado o valores por defecto
    const plantNutritionStatus = data.plantNutritionStatus || this.getEmptyNutritionStatus();

    // 4. Usar historial real si no se provee uno específico
    const fertilizerHistory = data.fertilizerHistory || realData.history;

    const optimizationData: FertilizerOptimizationData = {
      id: `fertilizer_opt_${Date.now()}`,
      timestamp: currentDate,
      soilAnalysis,
      plantNutritionStatus,
      fertilizerHistory,
      recommendations: [],
      costAnalysis: this.calculateRealCostAnalysis(fertilizerHistory, realData.inventory)
    };

    // 5. Generar recomendaciones solo si hay datos mínimos (ej. pH o inventario activo)
    // Si estamos en "modo ciego" (sin análisis de suelo), basar recomendaciones en inventario próximo a vencer o plan genérico
    optimizationData.recommendations = await this.generateSmartRecommendations(
      optimizationData,
      realData.inventory
    );

    return optimizationData;
  }

  // Obtener datos reales de la base de datos
  private async fetchRealFertilizerData() {
    try {
      // Inventario: Filtrar por tipo 'fertilizante' o inferir por nombre
      const allInventory = await offlineDB.inventory.toArray();
      const fertilizerInventory = allInventory.filter(item => {
        const name = (item.inputId || '').toLowerCase();
        // Detectar si es fertilizante por palabras clave o campo tipo si existiera mapeado
        return name.includes('fertil') || name.includes('urea') || name.includes('npk') || name.includes('abono') || name.includes('kcl') || name.includes('dap');
      }).map(item => ({
        id: item.id,
        name: item.inputId,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost || 0,
        expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
        daysToExpire: item.expirationDate ? Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999
      }));

      // Historial: Gastos categorizados como 'Fertilizantes'
      const expenses = await offlineDB.expenses
        .where('category')
        .equals('Fertilizantes') // Asumiendo que la categoría se guarda así tal cual
        .reverse()
        .limit(20) // Últimos 20 registros
        .toArray();

      const history: FertilizerApplication[] = expenses.map(exp => ({
        date: new Date(exp.date),
        type: exp.description, // Usamos la descripción como tipo de fertilizante
        composition: { nitrogen: 0, phosphorus: 0, potassium: 0 }, // No tenemos composición real en gastos, se asume genérico
        amount: 0, // No tenemos cantidad exacta en gastos (solo monto $$$), se deja 0 o estimar
        method: 'broadcast',
        cost: exp.amount,
        efficiency: 80 // Valor base
      }));

      return { inventory: fertilizerInventory, history };

    } catch (error) {
      console.error("Error fetching real fertilizer data:", error);
      return { inventory: [], history: [] };
    }
  }

  // Generar recomendaciones inteligentes (híbrido: datos reales + mejores prácticas)
  private async generateSmartRecommendations(
    data: FertilizerOptimizationData,
    inventory: any[]
  ): Promise<FertilizerRecommendation[]> {
    const recommendations: FertilizerRecommendation[] = [];
    const currentDate = new Date();

    // A. Prioridad: Inventario por vencer
    const expiringItems = inventory.filter(i => i.daysToExpire > 0 && i.daysToExpire < 60).sort((a, b) => a.daysToExpire - b.daysToExpire);

    for (const item of expiringItems) {
      recommendations.push({
        date: new Date(Date.now() + 86400000), // Mañana
        type: item.name,
        composition: { nitrogen: 0, phosphorus: 0, potassium: 0 },
        amount: Math.min(item.quantity, 50), // Sugerir uso razonable
        method: 'broadcast', // Método genérico
        timing: 'Inmediato (Riesgo de vencimiento)',
        expectedYieldIncrease: 5,
        costBenefit: 2.0, // Beneficio de no perder el insumo
        environmentalImpact: 10,
        confidence: 95,
        reasoning: `El insumo ${item.name} vence en ${item.daysToExpire} días. Se recomienda su uso prioritario para evitar pérdidas.`
      });
    }

    // B. Recomendaciones basadas en Análisis de Suelo (Solo si hay datos reales)
    if (data.soilAnalysis.pH > 0) { // Asumimos que pH > 0 indica que hay datos reales (getEmpty devuelve 0)
      const pHAnalysis = this.analyzeSoilPH(data.soilAnalysis);
      if (pHAnalysis.limeRequirement > 0) {
        recommendations.push({
          date: new Date(Date.now() + 7 * 86400000),
          type: 'Cal Agrícola (Corrección pH)',
          composition: { nitrogen: 0, phosphorus: 0, potassium: 0 },
          amount: pHAnalysis.limeRequirement,
          method: 'broadcast',
          timing: 'Pre-abonada',
          expectedYieldIncrease: 10,
          costBenefit: 3.0,
          environmentalImpact: 5,
          confidence: 90,
          reasoning: `pH ácido (${data.soilAnalysis.pH}) detectado. Corrección necesaria para mejorar absorción de nutrientes.`
        });
      }
    } else if (inventory.length === 0 && expiringItems.length === 0) {
      // C. Estado "Sin Datos": Recomendación Genérica de Compra
      recommendations.push({
        date: new Date(),
        type: 'Adquisición de Insumos',
        composition: { nitrogen: 0, phosphorus: 0, potassium: 0 },
        amount: 0,
        method: 'logistics',
        timing: 'ASAP',
        expectedYieldIncrease: 0,
        costBenefit: 0,
        environmentalImpact: 0,
        confidence: 100,
        reasoning: 'No se detectó inventario de fertilizantes. Registre sus compras en "Insumos" o realice un análisis de suelo para recibir recomendaciones precisas.'
      });
    }

    return recommendations;
  }

  // Analizar pH del suelo
  private analyzeSoilPH(soilAnalysis: SoilAnalysis) {
    const optimalPH = { min: 6.0, max: 6.8 };
    return {
      current: soilAnalysis.pH,
      optimal: optimalPH,
      status: soilAnalysis.pH < optimalPH.min ? 'acidic' :
        soilAnalysis.pH > optimalPH.max ? 'alkaline' : 'optimal',
      adjustmentNeeded: Math.abs(soilAnalysis.pH - 6.4),
      limeRequirement: soilAnalysis.pH < 6.0 && soilAnalysis.pH > 0 ? this.calculateLimeRequirement(soilAnalysis) : 0
    };
  }

  private calculateLimeRequirement(soilAnalysis: SoilAnalysis): number {
    const pHDifference = 6.4 - soilAnalysis.pH;
    return Math.round(pHDifference * 500); // 500kg por punto de pH (simplificado)
  }

  private calculateRealCostAnalysis(history: FertilizerApplication[], inventory: any[]): FertilizerCostAnalysis {
    const totalSpent = history.reduce((sum, item) => sum + item.cost, 0);
    const inventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    return {
      totalCost: totalSpent,
      costPerHectare: 0, // Requiere área del lote (no disponible aquí directo)
      costPerKgYield: 0, // Requiere producción
      roi: 0,
      paybackPeriod: 0,
      alternatives: []
    };
  }

  // Estructuras Vacías para evitar Mock Data
  private getEmptySoilAnalysis(): SoilAnalysis {
    return {
      pH: 0, organicMatter: 0, nitrogen: 0, phosphorus: 0, potassium: 0,
      calcium: 0, magnesium: 0, sulfur: 0,
      micronutrients: { iron: 0, manganese: 0, zinc: 0, copper: 0, boron: 0 },
      cationExchangeCapacity: 0, testDate: new Date()
    };
  }

  private getEmptyNutritionStatus(): PlantNutritionStatus {
    return {
      stage: { stage: 'vegetative', daysInStage: 0, waterRequirement: 0, criticalPeriod: false },
      deficiencies: [], excesses: [], overallHealth: 100, yieldPotential: 100
    };
  }

  // Métodos de configuración
  updateSettings(newSettings: Partial<FertilizerOptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): FertilizerOptimizationSettings {
    return { ...this.settings };
  }

  // Calcular métricas de rendimiento reales
  async calculateFertilizerEfficiencyMetrics(history: FertilizerApplication[]): Promise<{
    totalUsage: number;
    averageEfficiency: number;
    costPerKg: number;
    nutrientBalance: string;
  }> {
    if (history.length === 0) {
      return { totalUsage: 0, averageEfficiency: 0, costPerKg: 0, nutrientBalance: 'Sin Historial' };
    }

    const totalUsage = history.reduce((sum, app) => sum + app.amount, 0); // Ojo: amount suele ser 0 en gastos
    const totalCost = history.reduce((sum, app) => sum + app.cost, 0);

    return {
      totalUsage: Math.round(totalUsage),
      averageEfficiency: 80, // Valor base
      costPerKg: totalUsage > 0 ? Math.round((totalCost / totalUsage) * 100) / 100 : 0,
      nutrientBalance: 'Pendiente de Análisis Foliar'
    };
  }
}

export const fertilizerOptimizationService = new FertilizerOptimizationService();