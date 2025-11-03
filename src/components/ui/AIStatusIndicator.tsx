import React from 'react';
import { Brain, CheckCircle, Clock, AlertTriangle, XCircle, Zap, Eye, BarChart3, MessageSquare } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '../../lib/utils';
import { AIAgentType } from '../../services/aiService';

export interface AIStatusIndicatorProps {
  agentType: AIAgentType;
  status: 'idle' | 'processing' | 'completed' | 'failed' | 'disabled';
  confidence?: number;
  processingTime?: number;
  className?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const agentConfig = {
  phytosanitary: {
    name: 'Fitosanitario',
    icon: Eye,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  predictive: {
    name: 'Predictivo',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  rag_assistant: {
    name: 'Asistente',
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  optimization: {
    name: 'Optimización',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
};

const statusConfig = {
  idle: {
    icon: Brain,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    label: 'Inactivo'
  },
  processing: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Procesando'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Completado'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Error'
  },
  disabled: {
    icon: AlertTriangle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    label: 'Deshabilitado'
  }
};

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  agentType,
  status,
  confidence,
  processingTime,
  className,
  showDetails = false,
  size = 'md'
}) => {
  const agent = agentConfig[agentType];
  const statusInfo = statusConfig[status];
  const AgentIcon = agent.icon;
  const StatusIcon = statusInfo.icon;

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'h-4 w-4',
      text: 'text-xs',
      badge: 'text-xs'
    },
    md: {
      container: 'p-3',
      icon: 'h-5 w-5',
      text: 'text-sm',
      badge: 'text-sm'
    },
    lg: {
      container: 'p-4',
      icon: 'h-6 w-6',
      text: 'text-base',
      badge: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatProcessingTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        agent.bgColor,
        agent.borderColor,
        classes.container,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AgentIcon className={cn(classes.icon, agent.color)} />
            {status !== 'idle' && (
              <div className="absolute -top-1 -right-1">
                <StatusIcon className={cn('h-3 w-3', statusInfo.color)} />
              </div>
            )}
          </div>
          
          <div>
            <div className={cn('font-medium', classes.text, agent.color)}>
              {agent.name}
            </div>
            {showDetails && (
              <div className={cn('text-gray-600', classes.text)}>
                {statusInfo.label}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'processing' && (
            <div className="flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-600 border-t-transparent" />
              <span className={cn('text-yellow-600', classes.text)}>
                Procesando...
              </span>
            </div>
          )}

          {confidence !== undefined && status === 'completed' && (
            <Badge 
              variant="outline" 
              className={cn(
                classes.badge,
                getConfidenceColor(confidence)
              )}
            >
              {(confidence * 100).toFixed(0)}%
            </Badge>
          )}

          {processingTime !== undefined && status === 'completed' && showDetails && (
            <Badge variant="secondary" className={classes.badge}>
              {formatProcessingTime(processingTime)}
            </Badge>
          )}
        </div>
      </div>

      {showDetails && status === 'completed' && confidence !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className={cn('text-gray-600', classes.text)}>
              Confianza:
            </span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    confidence >= 0.8 ? 'bg-green-500' :
                    confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className={cn(classes.text, getConfidenceColor(confidence))}>
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {status === 'failed' && showDetails && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className={cn('text-red-600', classes.text)}>
              Error en el análisis
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar múltiples agentes
export interface AIStatusPanelProps {
  agents: Array<{
    agentType: AIAgentType;
    status: AIStatusIndicatorProps['status'];
    confidence?: number;
    processingTime?: number;
  }>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'grid';
}

export const AIStatusPanel: React.FC<AIStatusPanelProps> = ({
  agents,
  className,
  size = 'md',
  layout = 'horizontal'
}) => {
  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'space-y-2',
    grid: 'grid grid-cols-2 gap-2'
  };

  return (
    <div className={cn(layoutClasses[layout], className)}>
      {agents.map((agent) => (
        <AIStatusIndicator
          key={agent.agentType}
          agentType={agent.agentType}
          status={agent.status}
          confidence={agent.confidence}
          processingTime={agent.processingTime}
          size={size}
          showDetails={layout !== 'horizontal'}
        />
      ))}
    </div>
  );
};