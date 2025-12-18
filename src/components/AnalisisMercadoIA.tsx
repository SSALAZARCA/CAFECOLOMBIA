import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Globe, Award,
  Plus, Calendar, Save, X, BrainCircuit, Target, Link, Phone, ExternalLink, DollarSign, RefreshCw, Activity
} from 'lucide-react';
import { pricePredictionService } from '../services/pricePredictionService';
import { marketTrendsService } from '../services/marketTrendsService';
import { offlineDB } from '../utils/offlineDB';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Types
import { MarketTrend, CompetitorAnalysis, ExportMarket, MarketOpportunity } from '../types/marketAnalysis';

const AnalisisMercadoIA: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [exportMarkets, setExportMarkets] = useState<ExportMarket[]>([]);
  const [nationalOpportunities, setNationalOpportunities] = useState<MarketOpportunity[]>([]);

  const [showAddPriceModal, setShowAddPriceModal] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ title: string, message: string, type: 'success' | 'warning' | 'info' | null }>(null);

  // New Price Form State
  const [newPrice, setNewPrice] = useState('');
  const [newPriceDate, setNewPriceDate] = useState(new Date().toISOString().split('T')[0]);
  const [priceType, setPriceType] = useState<'Local' | 'Nacional'>('Local');
  const [loadingFNC, setLoadingFNC] = useState(false);

  useEffect(() => {
    loadMarketData();
  }, []);

  // Effect to fetch FNC price when National type is selected
  useEffect(() => {
    if (showAddPriceModal && priceType === 'Nacional') {
      fetchOfficialPrice();
    }
  }, [showAddPriceModal, priceType]);

  const fetchOfficialPrice = async () => {
    setLoadingFNC(true);
    try {
      const response = await fetch('/api/fnc-price');
      const data = await response.json();
      if (data.price) {
        // Remove dots/commas if needed, but data.price should be number
        setNewPrice(data.price.toString());
      }
    } catch (error) {
      console.error("Error fetching FNC price:", error);
    } finally {
      setLoadingFNC(false);
    }
  };

  const loadMarketData = async () => {
    setLoading(true);
    try {
      // 1. Load Price History
      const prices = await pricePredictionService.getHistoricalPrices();

      const pricesMap = new Map<string, { date: Date, dateStr: string, priceLocal: number | null, priceNational: number | null }>();

      prices.forEach(p => {
        const dStr = format(p.timestamp, 'dd MMM', { locale: es });
        const key = p.timestamp.toISOString().split('T')[0];

        if (!pricesMap.has(key)) {
          pricesMap.set(key, {
            date: new Date(p.timestamp),
            dateStr: dStr,
            priceLocal: null,
            priceNational: null
          });
        }

        const entry = pricesMap.get(key)!;
        if (p.region === 'Nacional') {
          entry.priceNational = p.price;
        } else {
          entry.priceLocal = p.price;
        }
      });

      const formattedPrices = Array.from(pricesMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
      setPriceHistory(formattedPrices);

      // 2. Load Market Data
      setTrends(await marketTrendsService.getMarketTrends());
      setCompetitors(await marketTrendsService.getCompetitorAnalysis());
      setExportMarkets(await marketTrendsService.getExportMarkets());
      setNationalOpportunities(await marketTrendsService.getNationalOpportunities());

    } catch (error) {
      console.error("Error loading market data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrice = async () => {
    if (!newPrice || !newPriceDate) return;

    try {
      await offlineDB.marketPrices.add({
        date: newPriceDate, // Store as string YYYY-MM-DD
        price: parseFloat(newPrice),
        source: priceType === 'Nacional' ? 'national_ref' : 'user_input',
        region: priceType
      });

      setShowAddPriceModal(false);
      setNewPrice('');
      setPriceType('Local');
      loadMarketData();
    } catch (error) {
      console.error("Error saving price:", error);
      alert("Error al guardar el precio");
    }
  };

  const generateAIAnalysis = () => {
    const latest = priceHistory[priceHistory.length - 1];

    if (!latest || (latest.priceLocal === null && latest.priceNational === null)) {
      setAiSuggestion({
        title: "Falta Información",
        message: "Necesitamos al menos un dato reciente para ayudarte. ¿Podrías registrar el precio de hoy?",
        type: 'info'
      });
      setShowAIAnalysis(true);
      return;
    }

    if (latest.priceLocal && latest.priceNational) {
      const gap = latest.priceLocal - latest.priceNational;
      const gapPercent = (gap / latest.priceNational) * 100;

      if (gap > 0) {
        setAiSuggestion({
          title: "¡Excelente Posición!",
          message: `Tu café se vende un ${gapPercent.toFixed(1)}% mejor que el promedio nacional. Esto indica que tu calidad es valorada. ¡Sigue así!`,
          type: 'success'
        });
      } else if (gapPercent > -5) {
        setAiSuggestion({
          title: "Precio Competitivo",
          message: `Estás recibiendo un precio justo (${gapPercent.toFixed(1)}%). Para ganar más, podrías explorar certificar tu finca con los sellos que ves en 'Oportunidades Globales'.`,
          type: 'info'
        });
      } else {
        setAiSuggestion({
          title: "Alerta de Ingresos",
          message: `Estás recibiendo menos dinero del que deberías (${Math.abs(gapPercent).toFixed(1)}% abajo). Revisa la calidad de tu grano o intenta vender a una Cooperativa diferente.`,
          type: 'warning'
        });
      }
    } else if (latest.priceLocal && !latest.priceNational) {
      setAiSuggestion({
        title: "¿A cómo está el Café Hoy?",
        message: "Sabemos a cuánto vendiste, pero nos falta saber el Precio Nacional de hoy para comparar. Por favor regístralo.",
        type: 'info'
      });
    } else {
      setAiSuggestion({
        title: "Mercado Estable",
        message: "Antes de vender tu cosecha, asegúrate de consultar el precio del día en el botón 'Consultar Precio Federación'.",
        type: 'info'
      });
    }

    setShowAIAnalysis(true);
  };

  const formatCurrency = (val: number) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Conectando con base de datos real...</span>
      </div>
    );
  }

  // KPI Calculations
  const getKPIs = () => {
    if (priceHistory.length === 0) return null;

    const sorted = [...priceHistory].sort((a, b) => a.date.getTime() - b.date.getTime());
    const latest = sorted[sorted.length - 1];

    // 1. National Price (Today/Latest)
    const currentNational = latest.priceNational || 0;

    // 2. Avg Price 7 Days (Local)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7Days = sorted.filter(p => p.date >= sevenDaysAgo && p.priceLocal !== null);

    let avgLocal7d = 0;
    if (last7Days.length > 0) {
      const sum = last7Days.reduce((acc, curr) => acc + (curr.priceLocal || 0), 0);
      avgLocal7d = sum / last7Days.length;
    } else {
      avgLocal7d = latest.priceLocal || 0; // Fallback to latest if no 7d history
    }

    // 3. Gap
    let gapPercent = 0;
    if (currentNational > 0 && avgLocal7d > 0) {
      gapPercent = ((avgLocal7d - currentNational) / currentNational) * 100;
    }

    // 4. Trend (Simple: Last 3 vs Prev 3)
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (sorted.length >= 6) {
      const last3 = sorted.slice(-3);
      const prev3 = sorted.slice(-6, -3);

      const avgLast3 = last3.reduce((acc, p) => acc + (p.priceLocal || p.priceNational || 0), 0) / 3;
      const avgPrev3 = prev3.reduce((acc, p) => acc + (p.priceLocal || p.priceNational || 0), 0) / 3;

      if (avgLast3 > avgPrev3 * 1.02) trend = 'up';
      else if (avgLast3 < avgPrev3 * 0.98) trend = 'down';
    }

    return { currentNational, avgLocal7d, gapPercent, trend };
  };

  const kpis = getKPIs();

  return (
    <div className="space-y-6 pb-20 relative font-sans">

      {/* KPI Section */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Avg Price Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500 group-hover:bg-indigo-600 transition" />
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Promedio (7d)</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(kpis.avgLocal7d)}</h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <span>Base: {priceType === 'Local' ? 'Venta Finca' : 'Referencia'}</span>
            </div>
          </div>

          {/* National Price Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute right-0 top-0 h-full w-1 bg-green-500 group-hover:bg-green-600 transition" />
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ref. Nacional Hoy</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(kpis.currentNational)}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                Fuente: FNC <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Gap Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className={`absolute right-0 top-0 h-full w-1 transition ${kpis.gapPercent >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`} />
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Brecha de Calidad</p>
                <h3 className={`text-2xl font-bold mt-1 ${kpis.gapPercent >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {kpis.gapPercent > 0 ? '+' : ''}{kpis.gapPercent.toFixed(1)}%
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${kpis.gapPercent >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <Award className={`w-5 h-5 ${kpis.gapPercent >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <span>Vs. Precio Nacional</span>
            </div>
          </div>

          {/* Trend Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className={`absolute right-0 top-0 h-full w-1 transition ${kpis.trend === 'up' ? 'bg-green-500' : kpis.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'}`} />
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tendencia</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1 capitalize">
                  {kpis.trend === 'up' ? 'Alcista' : kpis.trend === 'down' ? 'Bajista' : 'Estable'}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${kpis.trend === 'up' ? 'bg-green-50' : kpis.trend === 'down' ? 'bg-red-50' : 'bg-gray-100'}`}>
                {kpis.trend === 'up' ? <TrendingUp className="w-5 h-5 text-green-600" /> :
                  kpis.trend === 'down' ? <TrendingDown className="w-5 h-5 text-red-600" /> :
                    <Activity className="w-5 h-5 text-gray-600" />}
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <span>Últimos 3 registros</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Price Trends Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Tu Precio vs. Nacional</h3>
            <p className="text-sm text-gray-500">¿Estás vendiendo bien tu cosecha?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={generateAIAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-lg hover:from-purple-200 hover:to-purple-300 transition text-sm font-bold border border-purple-200 shadow-sm"
            >
              <BrainCircuit className="w-4 h-4" />
              Sugerencia IA
            </button>
            <button
              onClick={() => setShowAddPriceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Registrar
            </button>
          </div>
        </div>

        {priceHistory.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="colorPriceLocal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPriceNat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="dateStr"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [formatCurrency(val), name === 'priceLocal' ? 'Mi Venta' : 'Ref. Nacional']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Legend iconType="circle" />

                <Area
                  type="monotone"
                  dataKey="priceNational"
                  name="Ref. Nacional"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPriceNat)"
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="priceLocal"
                  name="Mi Venta"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPriceLocal)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mb-4" />
            <h4 className="text-gray-900 font-medium mb-1">Sin Registros Aún</h4>
            <p className="text-gray-500 text-sm max-w-sm">
              Para ver la gráfica, registra al menos un precio de venta.
            </p>
            <button
              onClick={() => setShowAddPriceModal(true)}
              className="mt-4 px-6 py-2 bg-white border border-gray-300 text-indigo-600 rounded-full text-sm font-bold hover:bg-gray-50 transition"
            >
              Empezar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* National Opportunities (Enriched) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-12 -mt-12 z-0"></div>
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Target className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Compradores Nacionales</h3>
              <p className="text-xs text-gray-500">Oportunidades verificadas en Colombia</p>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            {nationalOpportunities.map((opp) => (
              <div key={opp.id} className="p-4 bg-white rounded-xl border border-gray-100 hover:border-green-300 hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 text-base">{opp.marketName}</h4>
                  <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                    {opp.potentialRevenue}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{opp.description}</p>

                {/* Contact Section */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-50 mt-2">
                  {opp.contactPhone && (
                    <a href={`tel:${opp.contactPhone}`} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-2 py-1 rounded-md transition">
                      <Phone className="w-3 h-3" />
                      {opp.contactPhone}
                    </a>
                  )}
                  {opp.contactUrl && (
                    <a href={opp.contactUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      Ver Web Oficial
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Opportunities */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Mercado Global</h3>
              <p className="text-xs text-gray-500">Tendencias de exportación</p>
            </div>
          </div>
          <div className="space-y-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {exportMarkets.map((market, idx) => (
              <div key={idx} className="p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-blue-900 text-sm">{market.country}</h4>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${market.demandLevel === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    Demanda {market.demandLevel === 'high' ? 'ALTA' : 'MEDIA'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-3 text-xs">
                  <div className="bg-white/50 p-2 rounded">
                    <span className="block text-gray-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Requisitos Clave</span>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {market.requirements.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Price Modal */}
      {showAddPriceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nuevo Registro</h3>
              <button
                onClick={() => setShowAddPriceModal(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1 rounded-full hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Type Selector */}
              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-xl">
                <button
                  onClick={() => setPriceType('Local')}
                  className={`text-sm py-2 rounded-lg font-bold transition flex flex-col items-center ${priceType === 'Local' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span>Mi Venta</span>
                  <span className="text-[10px] font-normal opacity-80">(Precio Finca)</span>
                </button>
                <button
                  onClick={() => setPriceType('Nacional')}
                  className={`text-sm py-2 rounded-lg font-bold transition flex flex-col items-center ${priceType === 'Nacional' ? 'bg-white shadow text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span>Nacional</span>
                  <span className="text-[10px] font-normal opacity-80">(Referencia)</span>
                </button>
              </div>

              {priceType === 'Nacional' && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 flex flex-col gap-2">
                  <p>⚠️ Importante: Consulta primero el precio oficial del día.</p>
                  <a
                    href="https://federaciondecafeteros.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md font-bold hover:bg-blue-700 transition shadow-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Consultar Precio FNC Hoy
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Fecha del Precio</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={newPriceDate}
                    onChange={(e) => setNewPriceDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  {priceType === 'Local' ? 'Valor Pagado por Carga (125kg)' : 'Precio Interno de Referencia (125kg)'}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Ej: 2400000"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
              </div>

              <button
                onClick={handleSavePrice}
                disabled={!newPrice}
                className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-base shadow-xl shadow-gray-200"
              >
                <Save className="w-5 h-5" />
                Guardar Precio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIAnalysis && aiSuggestion && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden transform transition-all scale-100">
            <div className={`p-6 ${aiSuggestion.type === 'success' ? 'bg-gradient-to-br from-green-50 to-green-100' :
              aiSuggestion.type === 'warning' ? 'bg-gradient-to-br from-red-50 to-red-100' :
                'bg-gradient-to-br from-blue-50 to-blue-100'
              }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shadow-sm ${aiSuggestion.type === 'success' ? 'bg-green-500 text-white' :
                  aiSuggestion.type === 'warning' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${aiSuggestion.type === 'success' ? 'text-green-900' :
                    aiSuggestion.type === 'warning' ? 'text-red-900' :
                      'text-blue-900'
                    }`}>{aiSuggestion.title}</h3>
                  <p className="text-sm font-bold opacity-70 mt-0.5 uppercase tracking-wide">Reporte Inteligente</p>
                </div>
              </div>
            </div>

            <div className="p-7">
              <p className="text-gray-600 text-lg leading-relaxed mb-8 font-medium">
                {aiSuggestion.message}
              </p>

              <button
                onClick={() => setShowAIAnalysis(false)}
                className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg shadow-gray-200"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalisisMercadoIA;