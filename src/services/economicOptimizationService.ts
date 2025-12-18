import {
  CostBenefitAnalysis,
  ResourceCostData,
  EconomicOptimizationSettings,
  ROICalculation,
  BudgetForecast,
  CostOptimizationRecommendation,
  ResourceAllocation,
  ProfitabilityAnalysis,
  EconomicAnalysis,
  EconomicRecommendation
} from '../types/resourceOptimization';
import { offlineDB } from '../utils/offlineDB';

// Interfaz interna para manejar datos extendidos
interface ExtendedResourceCost extends ResourceCostData {
  unitCost: number;
  efficiency: number;
  lastUpdate: Date;
}

class EconomicOptimizationService {
  private settings: EconomicOptimizationSettings = {
    timeHorizon: 5,
    discountRate: 8,
    riskTolerance: 'medium',
    profitabilityThreshold: 15,
    investmentBudget: 50000,
    marketPriceVolatility: true
  };

  // Obtener costos reales desde la base de datos
  private async fetchRealResourceCosts(): Promise<{
    water: ExtendedResourceCost;
    fertilizer: ExtendedResourceCost;
    pesticide: ExtendedResourceCost;
    hasData: boolean;
  }> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const limitDateStr = sixMonthsAgo.toISOString().split('T')[0];

      const expenses = await offlineDB.expenses
        .where('date')
        .above(limitDateStr)
        .toArray();

      const costs = {
        water: { total: 0, count: 0 },
        fertilizer: { total: 0, count: 0 },
        pesticide: { total: 0, count: 0 }
      };

      expenses.forEach(exp => {
        const cat = exp.category.toLowerCase();
        const desc = exp.description.toLowerCase();

        if (cat.includes('riego') || cat.includes('agua') || desc.includes('riego')) {
          costs.water.total += exp.amount;
          costs.water.count++;
        } else if (cat.includes('fertiliz') || cat.includes('abono') || desc.includes('urea')) {
          costs.fertilizer.total += exp.amount;
          costs.fertilizer.count++;
        } else if (cat.includes('pesticida') || cat.includes('plaguicida') || cat.includes('veneno') || desc.includes('broca')) {
          costs.pesticide.total += exp.amount;
          costs.pesticide.count++;
        }
      });

      const hasData = (costs.water.total + costs.fertilizer.total + costs.pesticide.total) > 0;

      const processCostData = (total: number, count: number): ExtendedResourceCost => ({
        fixedCosts: Math.round(total * 0.3) || 0,
        variableCosts: Math.round(total * 0.7) || 0,
        maintenanceCosts: 0,
        operationalCosts: total,
        total: total,
        unitCost: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
        efficiency: 0,
        lastUpdate: new Date()
      });

      return {
        water: { ...processCostData(costs.water.total, costs.water.count), efficiency: 75 },
        fertilizer: { ...processCostData(costs.fertilizer.total, costs.fertilizer.count), efficiency: 80 },
        pesticide: { ...processCostData(costs.pesticide.total, costs.pesticide.count), efficiency: 70 },
        hasData
      };

    } catch (error) {
      console.error("Error fetching real costs:", error);
      const emptyCost = {
        fixedCosts: 0, variableCosts: 0, maintenanceCosts: 0, operationalCosts: 0, total: 0,
        unitCost: 0, efficiency: 0, lastUpdate: new Date()
      };
      return {
        water: { ...emptyCost },
        fertilizer: { ...emptyCost },
        pesticide: { ...emptyCost },
        hasData: false
      };
    }
  }

  // Algoritmo principal de optimización
  async optimizeResourceAllocation(
    waterCosts: ExtendedResourceCost,
    fertilizerCosts: ExtendedResourceCost,
    pesticideCosts: ExtendedResourceCost,
    currentYield: number,
    targetYield: number
  ): Promise<ResourceAllocation> {
    const yieldIncrease = targetYield - currentYield;
    // const yieldIncreasePercentage = (yieldIncrease / currentYield) * 100; // Not used currently

    // Calcular asignaciones usando métodos auxiliares
    const waterOpt = this.calculateOptimalInvestment(waterCosts.total, targetYield, waterCosts.efficiency, 'water');
    const fertOpt = this.calculateOptimalInvestment(fertilizerCosts.total, targetYield, fertilizerCosts.efficiency, 'fertilizer');
    const pestOpt = this.calculateOptimalInvestment(pesticideCosts.total, targetYield, pesticideCosts.efficiency, 'pesticide');

    return {
      water: {
        currentInvestment: waterCosts.total,
        recommendedInvestment: waterOpt,
        expectedSavings: Math.round(waterOpt * 0.25),
        yieldContribution: Math.round((waterOpt / 1000) * 2.5),
        recommendations: this.generateWaterRecommendations(waterOpt)
      },
      fertilizer: {
        currentInvestment: fertilizerCosts.total,
        recommendedInvestment: fertOpt,
        expectedSavings: Math.round(fertOpt * 0.20),
        yieldContribution: Math.round((fertOpt / 1000) * 4),
        recommendations: this.generateFertilizerRecommendations(fertOpt)
      },
      pesticide: {
        currentInvestment: pesticideCosts.total,
        recommendedInvestment: pestOpt,
        expectedSavings: Math.round(pestOpt * 0.30),
        yieldContribution: Math.round((pestOpt / 1000) * 1.5),
        recommendations: this.generatePesticideRecommendations(pestOpt)
      },
      totalInvestment: waterOpt + fertOpt + pestOpt,
      totalSavings: Math.round(waterOpt * 0.25 + fertOpt * 0.20 + pestOpt * 0.30),
      totalYieldIncrease: yieldIncrease,
      efficiencyScore: Math.round((waterCosts.efficiency + fertilizerCosts.efficiency + pesticideCosts.efficiency) / 3),
      riskLevel: 'medium'
    };
  }

  private calculateOptimalInvestment(currentCost: number, yieldTarget: number, efficiency: number, type: string): number {
    const baseInvestment = currentCost * 0.15;
    const yieldFactor = Math.min(yieldTarget / 1000, 2); // Normalizado
    return Math.round(baseInvestment * yieldFactor * (efficiency / 100));
  }

  // Generadores de recomendaciones (simplificados para el ejemplo)
  private generateWaterRecommendations(investment: number): string[] {
    return investment > 1000 ? ['Instalar riego por goteo', 'Monitoreo de humedad'] : ['Mejorar programación de riego'];
  }

  private generateFertilizerRecommendations(investment: number): string[] {
    return investment > 1000 ? ['Fertirrigación', 'Análisis de suelo'] : ['Aplicación fraccionada'];
  }

  private generatePesticideRecommendations(investment: number): string[] {
    return investment > 1000 ? ['Manejo Integrado de Plagas (MIP)', 'Control biológico'] : ['Monitoreo constante'];
  }

  // Obtener rendimiento real de cosechas
  private async fetchRealYield(): Promise<number> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const harvests = await offlineDB.harvests
        .where('date')
        .above(oneYearAgo.toISOString())
        .toArray();

      // Sumar recolecciones
      const totalYield = harvests.reduce((sum, h) => sum + h.quantity, 0);
      return totalYield > 0 ? totalYield : 0;
    } catch (error) {
      console.error('Error fetching real yield:', error);
      return 0;
    }
  }

  // Obtener análisis económico completo para la UI
  async getEconomicAnalysis(resourceData: any, farmArea: number): Promise<EconomicAnalysis> {
    try {
      const [realCosts, currentYield] = await Promise.all([
        this.fetchRealResourceCosts(),
        this.fetchRealYield()
      ]);

      if (!realCosts.hasData) {
        console.warn("Datos insuficientes para análisis económico real.");
      }

      // Definir meta de rendimiento (por ejemplo +20% o 1500kg/ha si area > 0)
      // Si el rendimiento actual es 0 (no hay datos), asumimos una meta base estándar
      const targetYield = currentYield > 0 ? Math.round(currentYield * 1.2) : (farmArea * 1500);

      const allocation = await this.optimizeResourceAllocation(
        realCosts.water,
        realCosts.fertilizer,
        realCosts.pesticide,
        currentYield,
        targetYield > 0 ? targetYield : 1000 // Fallback seguro
      );

      const totalCurrent = realCosts.water.total + realCosts.fertilizer.total + realCosts.pesticide.total;
      const totalProjected = totalCurrent + allocation.totalInvestment - allocation.totalSavings;


      const totalSavings = allocation.totalSavings;
      const netSavings = totalSavings - allocation.totalInvestment;
      const roi = allocation.totalInvestment > 0 ? (netSavings / allocation.totalInvestment) * 100 : 0;
      const paybackPeriod = netSavings > 0 ? (allocation.totalInvestment / netSavings) * 12 : 0;

      // Unificar recomendaciones. Si no hay datos, devolver vacío para activar "Empty State" en UI.
      const allRecommendations: EconomicRecommendation[] = realCosts.hasData ? [
        ...allocation.water.recommendations.map(req => ({
          category: 'cost-reduction' as const,
          action: req,
          investment: 0,
          expectedReturn: 0,
          timeframe: 'short-term',
          priority: 'medium' as const,
          confidence: 0.8,
          risks: ['Disponibilidad variable'],
          benefits: ['Mejor uso del agua']
        })),
        ...allocation.fertilizer.recommendations.map(req => ({
          category: 'yield-increase' as const,
          action: req,
          investment: 0,
          expectedReturn: 0,
          timeframe: 'medium-term',
          priority: 'high' as const,
          confidence: 0.85,
          risks: ['Costo inicial'],
          benefits: ['Aumento de rendimiento']
        })),
        ...allocation.pesticide.recommendations.map(req => ({
          category: 'risk-mitigation' as const,
          action: req,
          investment: 0,
          expectedReturn: 0,
          timeframe: 'short-term',
          priority: 'medium' as const,
          confidence: 0.9,
          risks: ['Resistencia de plagas'],
          benefits: ['Control efectivo']
        }))
      ] : [];

      return {
        id: `econ_${Date.now()}`,
        timestamp: new Date(),
        currentCosts: {
          water: realCosts.water.total,
          fertilizer: realCosts.fertilizer.total,
          pesticide: realCosts.pesticide.total,
          labor: 0,
          equipment: 0,
          total: totalCurrent
        },
        optimizedCosts: {
          water: Math.max(0, realCosts.water.total + allocation.water.recommendedInvestment - allocation.water.expectedSavings),
          fertilizer: Math.max(0, realCosts.fertilizer.total + allocation.fertilizer.recommendedInvestment - allocation.fertilizer.expectedSavings),
          pesticide: Math.max(0, realCosts.pesticide.total + allocation.pesticide.recommendedInvestment - allocation.pesticide.expectedSavings),
          labor: 0,
          equipment: 0,
          total: Math.max(0, totalProjected)
        },
        roiAnalysis: {
          roi: roi,
          paybackPeriod: paybackPeriod,
          netPresentValue: netSavings * 5, // Simplified NPV
          profitabilityIndex: 1.2,
          riskLevel: allocation.riskLevel
        },
        recommendations: allRecommendations,
        profitabilityAnalysis: {
          grossMargin: 0,
          netMargin: 0,
          costPerKg: currentYield > 0 ? totalCurrent / currentYield : 0,
          revenuePerKg: 0, // Se podría integrar con SalesService
          breakEvenPoint: 0,
          profitProjection: 0
        }
      };
    } catch (error) {
      console.error('Error generating economic analysis:', error);
      // Retorno de fallback en caso de error
      return {
        id: 'error_fallback',
        timestamp: new Date(),
        currentCosts: { water: 0, fertilizer: 0, pesticide: 0, labor: 0, equipment: 0, total: 0 },
        optimizedCosts: { water: 0, fertilizer: 0, pesticide: 0, labor: 0, equipment: 0, total: 0 },
        roiAnalysis: { roi: 0, paybackPeriod: 0, netPresentValue: 0, profitabilityIndex: 0, riskLevel: 'low' },
        recommendations: [],
        profitabilityAnalysis: { grossMargin: 0, netMargin: 0, costPerKg: 0, revenuePerKg: 0, breakEvenPoint: 0, profitProjection: 0 }
      };
    }
  }
}

export const economicOptimizationService = new EconomicOptimizationService();