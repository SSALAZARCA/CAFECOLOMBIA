import { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, BarChart3, Info } from 'lucide-react';

interface CostCalculatorProps {
  insumos: any[];
  usageRecords?: any[];
}

interface CostAnalysis {
  totalCostPerHectare: number;
  costByType: { [key: string]: number };
  costByMonth: { [key: string]: number };
  averageCostPerApplication: number;
  mostExpensiveInputs: Array<{
    name: string;
    cost: number;
    applications: number;
  }>;
  recommendations: string[];
}

// Mock data para registros de uso
const mockUsageRecords = [
  {
    id: '1',
    insumoId: '1',
    insumoName: 'Urea 46%',
    type: 'FERTILIZANTE',
    loteId: '1',
    loteName: 'Lote A - Caturra',
    loteArea: 2.5,
    quantityUsed: 50,
    unitCost: 2500,
    applicationDate: '2024-01-15',
    dosagePerHectare: 20,
    totalCost: 125000
  },
  {
    id: '2',
    insumoId: '2',
    insumoName: 'Roundup',
    type: 'HERBICIDA',
    loteId: '2',
    loteName: 'Lote B - Colombia',
    loteArea: 3.0,
    quantityUsed: 2,
    unitCost: 45000,
    applicationDate: '2024-01-20',
    dosagePerHectare: 0.67,
    totalCost: 90000
  },
  {
    id: '3',
    insumoId: '3',
    insumoName: 'Compost Orgánico',
    type: 'ABONO_ORGANICO',
    loteId: '1',
    loteName: 'Lote A - Caturra',
    loteArea: 2.5,
    quantityUsed: 200,
    unitCost: 800,
    applicationDate: '2024-02-01',
    dosagePerHectare: 80,
    totalCost: 160000
  },
  {
    id: '4',
    insumoId: '4',
    insumoName: 'Fungicida Sistémico',
    type: 'FUNGICIDA',
    loteId: '3',
    loteName: 'Lote C - Castillo',
    loteArea: 1.8,
    quantityUsed: 1,
    unitCost: 85000,
    applicationDate: '2024-01-25',
    dosagePerHectare: 0.56,
    totalCost: 85000
  }
];

export default function CostCalculator({ insumos, usageRecords = mockUsageRecords }: CostCalculatorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedLote, setSelectedLote] = useState<string>('ALL');
  const [analysis, setAnalysis] = useState<CostAnalysis | null>(null);

  // Calcular análisis de costos
  useEffect(() => {
    if (usageRecords.length === 0) return;

    // Filtrar por período
    const now = new Date();
    const periodStart = new Date();
    
    switch (selectedPeriod) {
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredRecords = usageRecords.filter(record => {
      const recordDate = new Date(record.applicationDate);
      const loteMatch = selectedLote === 'ALL' || record.loteId === selectedLote;
      const dateMatch = recordDate >= periodStart;
      return loteMatch && dateMatch;
    });

    if (filteredRecords.length === 0) {
      setAnalysis(null);
      return;
    }

    // Calcular área total
    const totalArea = filteredRecords.reduce((sum, record) => {
      return sum + record.loteArea;
    }, 0);

    // Costo total
    const totalCost = filteredRecords.reduce((sum, record) => sum + record.totalCost, 0);
    const totalCostPerHectare = totalArea > 0 ? totalCost / totalArea : 0;

    // Costo por tipo
    const costByType: { [key: string]: number } = {};
    filteredRecords.forEach(record => {
      if (!costByType[record.type]) {
        costByType[record.type] = 0;
      }
      costByType[record.type] += record.totalCost;
    });

    // Costo por mes
    const costByMonth: { [key: string]: number } = {};
    filteredRecords.forEach(record => {
      const month = new Date(record.applicationDate).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!costByMonth[month]) {
        costByMonth[month] = 0;
      }
      costByMonth[month] += record.totalCost;
    });

    // Promedio por aplicación
    const averageCostPerApplication = totalCost / filteredRecords.length;

    // Insumos más costosos
    const inputCosts: { [key: string]: { cost: number; applications: number; name: string } } = {};
    filteredRecords.forEach(record => {
      if (!inputCosts[record.insumoId]) {
        inputCosts[record.insumoId] = {
          cost: 0,
          applications: 0,
          name: record.insumoName
        };
      }
      inputCosts[record.insumoId].cost += record.totalCost;
      inputCosts[record.insumoId].applications += 1;
    });

    const mostExpensiveInputs = Object.values(inputCosts)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Generar recomendaciones
    const recommendations: string[] = [];
    
    if (totalCostPerHectare > 500000) {
      recommendations.push('Los costos por hectárea son elevados. Considera optimizar las dosis de aplicación.');
    }
    
    const fertilizanteCost = costByType['FERTILIZANTE'] || 0;
    const pesticidaCost = (costByType['PESTICIDA'] || 0) + (costByType['FUNGICIDA'] || 0) + (costByType['HERBICIDA'] || 0);
    
    if (pesticidaCost > fertilizanteCost * 1.5) {
      recommendations.push('El gasto en pesticidas es alto comparado con fertilizantes. Evalúa programas de MIP.');
    }
    
    if (mostExpensiveInputs.length > 0 && mostExpensiveInputs[0].applications > 5) {
      recommendations.push(`El insumo "${mostExpensiveInputs[0].name}" se está usando frecuentemente. Verifica si es necesario.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Los costos están dentro de rangos normales. Mantén el monitoreo constante.');
    }

    setAnalysis({
      totalCostPerHectare,
      costByType,
      costByMonth,
      averageCostPerApplication,
      mostExpensiveInputs,
      recommendations
    });
  }, [usageRecords, selectedPeriod, selectedLote]);

  // Obtener lotes únicos
  const uniqueLotes = Array.from(new Set(usageRecords.map(record => ({ 
    id: record.loteId, 
    name: record.loteName 
  }))))
    .reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as { id: string; name: string }[]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FERTILIZANTE':
        return 'bg-green-500';
      case 'PESTICIDA':
        return 'bg-red-500';
      case 'FUNGICIDA':
        return 'bg-blue-500';
      case 'HERBICIDA':
        return 'bg-yellow-500';
      case 'ABONO_ORGANICO':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FERTILIZANTE':
        return 'Fertilizantes';
      case 'PESTICIDA':
        return 'Pesticidas';
      case 'FUNGICIDA':
        return 'Fungicidas';
      case 'HERBICIDA':
        return 'Herbicidas';
      case 'ABONO_ORGANICO':
        return 'Abonos Orgánicos';
      default:
        return 'Otros';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-amber-600" />
          Calculadora de Costos por Hectárea
        </h3>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período de Análisis
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="month">Último mes</option>
              <option value="quarter">Últimos 3 meses</option>
              <option value="year">Último año</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lote
            </label>
            <select
              value={selectedLote}
              onChange={(e) => setSelectedLote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="ALL">Todos los lotes</option>
              {uniqueLotes.map(lote => (
                <option key={lote.id} value={lote.id}>{lote.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {analysis ? (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Costo por Hectárea</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analysis.totalCostPerHectare.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio por Aplicación</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analysis.averageCostPerApplication.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Aplicaciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageRecords.length}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Distribución por Tipo */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Distribución de Costos por Tipo</h4>
            <div className="space-y-4">
              {Object.entries(analysis.costByType).map(([type, cost]) => {
                const percentage = (cost / Object.values(analysis.costByType).reduce((a, b) => a + b, 0)) * 100;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${getTypeColor(type)}`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {getTypeLabel(type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getTypeColor(type)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-20 text-right">
                        ${cost.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insumos Más Costosos */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Insumos Más Costosos</h4>
            <div className="space-y-3">
              {analysis.mostExpensiveInputs.map((input, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{input.name}</p>
                    <p className="text-sm text-gray-600">{input.applications} aplicaciones</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${input.cost.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      ${(input.cost / input.applications).toLocaleString()} promedio
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="text-lg font-medium text-blue-900 mb-3">
                  Recomendaciones de Optimización
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <p key={index} className="text-sm text-blue-800">
                      • {recommendation}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Benchmarks */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-green-900 mb-3">
              Benchmarks de la Industria
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <p className="font-medium mb-2">Costos Típicos por Hectárea:</p>
                <ul className="space-y-1">
                  <li>• Fertilización: $200,000 - $400,000</li>
                  <li>• Control de plagas: $100,000 - $250,000</li>
                  <li>• Control de malezas: $80,000 - $150,000</li>
                  <li>• Abonos orgánicos: $150,000 - $300,000</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Indicadores de Eficiencia:</p>
                <ul className="space-y-1">
                  <li>• Costo total &lt; $600,000/ha: Excelente</li>
                  <li>• Costo total $600,000-$800,000/ha: Bueno</li>
                  <li>• Costo total $800,000-$1,000,000/ha: Regular</li>
                  <li>• Costo total &gt; $1,000,000/ha: Revisar</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <Calculator className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos suficientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron registros de uso para el período y filtros seleccionados.
          </p>
        </div>
      )}
    </div>
  );
}