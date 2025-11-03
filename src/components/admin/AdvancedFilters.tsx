// =====================================================
// COMPONENTE DE FILTROS AVANZADOS
// Café Colombia - Super Administrator Panel
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  Filter,
  X,
  Calendar,
  Search,
  ChevronDown,
  RotateCcw,
  Check
} from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'multiSelect' | 'number';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterValue {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  values: FilterValue;
  onChange: (values: FilterValue) => void;
  onReset: () => void;
  className?: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  values,
  onChange,
  onReset,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // =====================================================
  // CONTAR FILTROS ACTIVOS
  // =====================================================

  useEffect(() => {
    const count = Object.values(values).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return value !== 0;
      return value !== null && value !== undefined;
    }).length;
    setActiveFiltersCount(count);
  }, [values]);

  // =====================================================
  // MANEJO DE CAMBIOS EN FILTROS
  // =====================================================

  const handleFilterChange = (key: string, value: any) => {
    onChange({
      ...values,
      [key]: value
    });
  };

  const handleMultiSelectChange = (key: string, optionValue: string) => {
    const currentValues = values[key] || [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter((v: string) => v !== optionValue)
      : [...currentValues, optionValue];
    
    handleFilterChange(key, newValues);
  };

  const clearFilter = (key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  };

  // =====================================================
  // RENDERIZAR CAMPO DE FILTRO
  // =====================================================

  const renderFilterField = (filter: FilterOption) => {
    const value = values[filter.key];

    switch (filter.type) {
      case 'text':
        return (
          <div key={filter.key} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <div className="relative">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              {value && (
                <button
                  onClick={() => clearFilter(filter.key)}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.key} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Todos</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-9 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        );

      case 'multiSelect':
        return (
          <div key={filter.key} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <div className="border border-gray-300 rounded-lg p-2 bg-white max-h-32 overflow-y-auto">
              {filter.options?.map((option) => {
                const isSelected = (value || []).includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleMultiSelectChange(filter.key, option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                    {isSelected && <Check className="h-3 w-3 text-blue-600 ml-auto" />}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={filter.key} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <div className="relative">
              <input
                type="date"
                value={value || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              {value && (
                <button
                  onClick={() => clearFilter(filter.key)}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );

      case 'dateRange':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {filter.label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={value?.start || ''}
                  onChange={(e) => handleFilterChange(filter.key, { ...value, start: e.target.value })}
                  placeholder="Desde"
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={value?.end || ''}
                  onChange={(e) => handleFilterChange(filter.key, { ...value, end: e.target.value })}
                  placeholder="Hasta"
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={filter.key} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, Number(e.target.value))}
              placeholder={filter.placeholder}
              min={filter.min}
              max={filter.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // =====================================================
  // RENDER DEL COMPONENTE
  // =====================================================

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header del panel de filtros */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filtros Avanzados</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount} activo{activeFiltersCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Limpiar</span>
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <span>{isExpanded ? 'Contraer' : 'Expandir'}</span>
            <ChevronDown className={`h-4 w-4 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Contenido de los filtros */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map(renderFilterField)}
          </div>
        </div>
      )}

      {/* Filtros activos (siempre visibles) */}
      {activeFiltersCount > 0 && !isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Object.entries(values).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              
              const filter = filters.find(f => f.key === key);
              if (!filter) return null;

              let displayValue = value;
              if (Array.isArray(value)) {
                displayValue = `${value.length} seleccionado${value.length !== 1 ? 's' : ''}`;
              } else if (typeof value === 'object' && value.start && value.end) {
                displayValue = `${value.start} - ${value.end}`;
              }

              return (
                <div
                  key={key}
                  className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  <span className="font-medium">{filter.label}:</span>
                  <span>{displayValue}</span>
                  <button
                    onClick={() => clearFilter(key)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;