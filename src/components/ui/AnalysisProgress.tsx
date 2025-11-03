import React from 'react';
import { Brain, CheckCircle, Clock, AlertTriangle, XCircle, Loader2, Play, Pause, RotateCcw } from 'lucide-react';
import { Progress } from './progress';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '../../lib/utils';
import { AIAgentType } from '../../services/aiService';

export interface AnalysisStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  progress: number; // 0-100
  estimatedTime?: number; // en milisegundos
  actualTime?: number; // en milisegundos
  error?: string;
}

export interface AnalysisProgressProps {
  agentType: AIAgentType;
  analysisId: string;
  steps: AnalysisStep[];
  overallProgress: number; // 0-100
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  estimatedCompletion?: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const agentNames = {
  phytosanitary: 'Análisis Fitosanitario',
  predictive: 'Análisis Predictivo',
  rag_assistant: 'Consulta Asistente',
  optimization: 'Análisis de Optimización'
};

const statusConfig = {
  idle: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    label: 'En espera'
  },
  running: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Ejecutando'
  },
  paused: {
    icon: Pause,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Pausado'
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
  cancelled: {
    icon: AlertTriangle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'Cancelado'
  }
};

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  agentType,
  analysisId,
  steps,
  overallProgress,
  status,
  startTime,
  endTime,
  estimatedCompletion,
  onPause,
  onResume,
  onCancel,
  onRetry,
  className,
  showDetails = true,
  compact = false
}) => {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const time = new Date(timeString);
    return time.toLocaleTimeString();
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '';
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStepIcon = (step: AnalysisStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const currentStep = steps.find(step => step.status === 'processing');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-3 bg-white rounded-lg border', className)}>
        <StatusIcon 
          className={cn('h-5 w-5', statusInfo.color, status === 'running' && 'animate-spin')} 
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{agentNames[agentType]}</span>
            <span className="text-xs text-gray-500">
              {completedSteps}/{totalSteps} pasos
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
        <Badge variant="outline" className="text-xs">
          {overallProgress.toFixed(0)}%
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            {agentNames[agentType]}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn('text-xs', statusInfo.color)}
            >
              <StatusIcon className={cn('h-3 w-3 mr-1', status === 'running' && 'animate-spin')} />
              {statusInfo.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {overallProgress.toFixed(0)}%
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={overallProgress} className="h-2" />
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {completedSteps} de {totalSteps} pasos completados
            </span>
            {startTime && (
              <span>
                {endTime ? 
                  `Completado en ${formatDuration(startTime, endTime)}` :
                  `Iniciado: ${formatTime(startTime)}`
                }
              </span>
            )}
          </div>
          
          {estimatedCompletion && status === 'running' && (
            <div className="text-xs text-gray-500">
              Tiempo estimado: {formatTime(estimatedCompletion)}
            </div>
          )}
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      'text-sm font-medium',
                      step.status === 'completed' && 'text-green-700',
                      step.status === 'failed' && 'text-red-700',
                      step.status === 'processing' && 'text-blue-700'
                    )}>
                      {step.name}
                    </span>
                    
                    {step.status === 'processing' && (
                      <Badge variant="outline" className="text-xs">
                        {step.progress}%
                      </Badge>
                    )}
                    
                    {step.actualTime && step.status === 'completed' && (
                      <span className="text-xs text-gray-500">
                        {(step.actualTime / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {step.description}
                  </p>
                  
                  {step.status === 'processing' && (
                    <Progress value={step.progress} className="h-1" />
                  )}
                  
                  {step.error && step.status === 'failed' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {step.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-xs text-gray-500">
              ID: {analysisId.slice(0, 8)}...
            </div>
            
            <div className="flex items-center gap-2">
              {status === 'running' && onPause && (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="h-3 w-3 mr-1" />
                  Pausar
                </Button>
              )}
              
              {status === 'paused' && onResume && (
                <Button size="sm" variant="outline" onClick={onResume}>
                  <Play className="h-3 w-3 mr-1" />
                  Reanudar
                </Button>
              )}
              
              {(status === 'running' || status === 'paused') && onCancel && (
                <Button size="sm" variant="destructive" onClick={onCancel}>
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              )}
              
              {status === 'failed' && onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Componente para mostrar múltiples análisis en progreso
export interface AnalysisQueueProps {
  analyses: Array<{
    agentType: AIAgentType;
    analysisId: string;
    steps: AnalysisStep[];
    overallProgress: number;
    status: AnalysisProgressProps['status'];
    startTime?: string;
    endTime?: string;
  }>;
  className?: string;
  compact?: boolean;
  maxVisible?: number;
}

export const AnalysisQueue: React.FC<AnalysisQueueProps> = ({
  analyses,
  className,
  compact = true,
  maxVisible = 5
}) => {
  const visibleAnalyses = analyses.slice(0, maxVisible);
  const hiddenCount = Math.max(0, analyses.length - maxVisible);

  return (
    <div className={cn('space-y-2', className)}>
      {visibleAnalyses.map((analysis) => (
        <AnalysisProgress
          key={analysis.analysisId}
          agentType={analysis.agentType}
          analysisId={analysis.analysisId}
          steps={analysis.steps}
          overallProgress={analysis.overallProgress}
          status={analysis.status}
          startTime={analysis.startTime}
          endTime={analysis.endTime}
          compact={compact}
          showDetails={!compact}
        />
      ))}
      
      {hiddenCount > 0 && (
        <div className="text-center py-2">
          <Badge variant="secondary" className="text-xs">
            +{hiddenCount} análisis más
          </Badge>
        </div>
      )}
    </div>
  );
};