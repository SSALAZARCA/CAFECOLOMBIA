// =====================================================
// WIDGETS INTERACTIVOS CON DRILL-DOWN
// Café Colombia - Super Administrator Panel
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  CreditCard,
  DollarSign,
  Activity,
  Calendar,
  ChevronRight,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Filter,
  Download
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface WidgetData {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  chartData?: any[];
  chartType?: 'line' | 'area' | 'bar' | 'pie';
  drillDownPath?: string;
  description?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    icon?: React.ComponentType<any>;
  }>;
}

interface InteractiveWidgetsProps {
  widgets: WidgetData[];
  className?: string;
}

const InteractiveWidgets: React.FC<InteractiveWidgetsProps> = ({
  widgets,
  className = ''
}) => {
  const navigate = useNavigate();
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);

  // =====================================================
  // COLORES PARA GRÁFICOS
  // =====================================================

  const chartColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  // =====================================================
  // RENDERIZAR MINI GRÁFICO
  // =====================================================

  const renderMiniChart = (widget: WidgetData) => {
    if (!widget.chartData || widget.chartData.length === 0) return null;

    const commonProps = {
      width: 120,
      height: 60,
      data: widget.chartData
    };

    switch (widget.chartType) {
      case 'line':
        return (
          <RechartsLineChart {...commonProps}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={widget.color.replace('bg-', '#')}
              strokeWidth={2}
              dot={false}
            />
          </RechartsLineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={widget.color.replace('bg-', '#')}
              fill={widget.color.replace('bg-', '#')}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <Bar dataKey="value" fill={widget.color.replace('bg-', '#')} />
          </BarChart>
        );

      default:
        return null;
    }
  };

  // =====================================================
  // RENDERIZAR GRÁFICO EXPANDIDO
  // =====================================================

  const renderExpandedChart = (widget: WidgetData) => {
    if (!widget.chartData || widget.chartData.length === 0) return null;

    const commonProps = {
      width: '100%',
      height: 300,
      data: widget.chartData
    };

    switch (widget.chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsLineChart data={widget.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={widget.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={widget.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsPieChart>
              <Pie
                data={widget.chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {widget.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // =====================================================
  // MANEJO DE EVENTOS
  // =====================================================

  const handleWidgetClick = (widget: WidgetData) => {
    if (widget.drillDownPath) {
      navigate(widget.drillDownPath);
    } else {
      setExpandedWidget(expandedWidget === widget.id ? null : widget.id);
    }
  };

  const handleDrillDown = (widget: WidgetData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (widget.drillDownPath) {
      navigate(widget.drillDownPath);
    }
  };

  // =====================================================
  // RENDER DEL COMPONENTE
  // =====================================================

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {widgets.map((widget) => {
        const isExpanded = expandedWidget === widget.id;
        const isHovered = hoveredWidget === widget.id;

        return (
          <div
            key={widget.id}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 cursor-pointer ${
              isHovered ? 'shadow-lg scale-105' : ''
            } ${isExpanded ? 'col-span-full' : ''}`}
            onMouseEnter={() => setHoveredWidget(widget.id)}
            onMouseLeave={() => setHoveredWidget(null)}
            onClick={() => handleWidgetClick(widget)}
          >
            {/* Header del widget */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${widget.color}`}>
                      <widget.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">{widget.title}</h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{widget.value}</p>
                    </div>
                  </div>

                  {/* Indicador de cambio */}
                  {widget.change !== undefined && (
                    <div className={`flex items-center mt-3 text-sm ${
                      widget.changeType === 'increase' ? 'text-green-600' :
                      widget.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {widget.changeType === 'increase' ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : widget.changeType === 'decrease' ? (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      ) : null}
                      <span>{Math.abs(widget.change)}%</span>
                      <span className="text-gray-500 ml-1">vs mes anterior</span>
                    </div>
                  )}

                  {/* Descripción */}
                  {widget.description && (
                    <p className="text-sm text-gray-500 mt-2">{widget.description}</p>
                  )}
                </div>

                {/* Mini gráfico */}
                <div className="ml-4">
                  {renderMiniChart(widget)}
                </div>
              </div>

              {/* Acciones del widget */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  {widget.actions?.map((action, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.action();
                      }}
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {action.icon && <action.icon className="h-4 w-4" />}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  {widget.chartData && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedWidget(expandedWidget === widget.id ? null : widget.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title={isExpanded ? 'Contraer' : 'Expandir gráfico'}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                  )}

                  {widget.drillDownPath && (
                    <button
                      onClick={(e) => handleDrillDown(widget, e)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Ver detalles"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gráfico expandido */}
            {isExpanded && widget.chartData && (
              <div className="px-6 pb-6">
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Análisis Detallado - {widget.title}
                  </h4>
                  {renderExpandedChart(widget)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =====================================================
// HOOK PARA DATOS DE WIDGETS
// =====================================================

export const useWidgetData = () => {
  const navigate = useNavigate();

  const defaultWidgets: WidgetData[] = [
    {
      id: 'users',
      title: 'Usuarios Totales',
      value: '1,234',
      change: 12.5,
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500',
      chartType: 'line',
      chartData: [
        { name: 'Ene', value: 1000 },
        { name: 'Feb', value: 1100 },
        { name: 'Mar', value: 1150 },
        { name: 'Abr', value: 1234 }
      ],
      drillDownPath: '/admin/users',
      description: 'Usuarios registrados en la plataforma',
      actions: [
        {
          label: 'Ver detalles',
          action: () => navigate('/admin/users'),
          icon: Eye
        },
        {
          label: 'Exportar',
          action: () => console.log('Exportar usuarios'),
          icon: Download
        }
      ]
    },
    {
      id: 'farms',
      title: 'Fincas Registradas',
      value: '856',
      change: 8.3,
      changeType: 'increase',
      icon: MapPin,
      color: 'bg-green-500',
      chartType: 'area',
      chartData: [
        { name: 'Ene', value: 750 },
        { name: 'Feb', value: 800 },
        { name: 'Mar', value: 830 },
        { name: 'Abr', value: 856 }
      ],
      drillDownPath: '/admin/coffee-growers',
      description: 'Fincas cafeteras activas',
      actions: [
        {
          label: 'Ver mapa',
          action: () => navigate('/admin/coffee-growers'),
          icon: MapPin
        }
      ]
    },
    {
      id: 'revenue',
      title: 'Ingresos Mensuales',
      value: '$15,420',
      change: 15.2,
      changeType: 'increase',
      icon: DollarSign,
      color: 'bg-emerald-500',
      chartType: 'bar',
      chartData: [
        { name: 'Ene', value: 12000 },
        { name: 'Feb', value: 13500 },
        { name: 'Mar', value: 14200 },
        { name: 'Abr', value: 15420 }
      ],
      drillDownPath: '/admin/payments',
      description: 'Ingresos por suscripciones y servicios'
    },
    {
      id: 'payments',
      title: 'Pagos Procesados',
      value: '342',
      change: 5.7,
      changeType: 'increase',
      icon: CreditCard,
      color: 'bg-indigo-500',
      chartType: 'line',
      chartData: [
        { name: 'Ene', value: 280 },
        { name: 'Feb', value: 310 },
        { name: 'Mar', value: 325 },
        { name: 'Abr', value: 342 }
      ],
      drillDownPath: '/admin/payments',
      description: 'Transacciones exitosas este mes'
    },
    {
      id: 'activity',
      title: 'Actividad del Sistema',
      value: '94%',
      change: 2.1,
      changeType: 'increase',
      icon: Activity,
      color: 'bg-purple-500',
      chartType: 'area',
      chartData: [
        { name: '00:00', value: 85 },
        { name: '06:00', value: 92 },
        { name: '12:00', value: 96 },
        { name: '18:00', value: 94 }
      ],
      description: 'Uptime y rendimiento del sistema'
    },
    {
      id: 'subscriptions',
      title: 'Distribución de Planes',
      value: '3 planes',
      icon: PieChart,
      color: 'bg-orange-500',
      chartType: 'pie',
      chartData: [
        { name: 'Básico', value: 45 },
        { name: 'Premium', value: 35 },
        { name: 'Enterprise', value: 20 }
      ],
      description: 'Distribución de suscripciones por plan'
    }
  ];

  return { widgets: defaultWidgets };
};

export default InteractiveWidgets;