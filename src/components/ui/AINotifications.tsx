import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, Eye, BarChart3, MessageSquare, Zap, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ScrollArea } from './scroll-area';
import { cn } from '../../lib/utils';
import { AINotification, AIAgentType } from '../../services/aiService';

export interface AINotificationsProps {
  notifications: AINotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (notificationId: string) => void;
  className?: string;
  maxHeight?: string;
  showUnreadOnly?: boolean;
}

const agentIcons = {
  phytosanitary: Eye,
  predictive: BarChart3,
  rag_assistant: MessageSquare,
  optimization: Zap
};

const agentColors = {
  phytosanitary: 'text-green-600',
  predictive: 'text-blue-600',
  rag_assistant: 'text-purple-600',
  optimization: 'text-orange-600'
};

const typeIcons = {
  analysis_complete: CheckCircle,
  urgent_alert: AlertTriangle,
  recommendation: Info,
  system_update: Bell
};

const priorityColors = {
  critical: 'border-red-500 bg-red-50',
  high: 'border-orange-500 bg-orange-50',
  medium: 'border-yellow-500 bg-yellow-50',
  low: 'border-gray-300 bg-gray-50'
};

export const AINotifications: React.FC<AINotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  className,
  maxHeight = '400px',
  showUnreadOnly = false
}) => {
  const filteredNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const handleNotificationClick = (notification: AINotification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-blue-600" />
            Notificaciones IA
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          {filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                {showUnreadOnly ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const AgentIcon = agentIcons[notification.agentType];
                const TypeIcon = typeIcons[notification.type];
                const agentColor = agentColors[notification.agentType];
                const priorityColor = priorityColors[notification.priority];

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4',
                      priorityColor,
                      !notification.read && 'bg-blue-50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <AgentIcon className={cn('h-5 w-5', agentColor)} />
                          <div className="absolute -top-1 -right-1">
                            <TypeIcon className="h-3 w-3 text-gray-600" />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={cn(
                              'text-sm font-medium',
                              !notification.read && 'font-semibold'
                            )}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(notification.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-gray-200"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Datos adicionales específicos del tipo de notificación */}
                        {notification.data && notification.type === 'analysis_complete' && (
                          <div className="mt-2 p-2 bg-white rounded border text-xs">
                            {notification.data.confidence && (
                              <div className="flex items-center justify-between">
                                <span>Confianza:</span>
                                <Badge variant="outline" className="text-xs">
                                  {(notification.data.confidence * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            )}
                            {notification.data.processingTime && (
                              <div className="flex items-center justify-between mt-1">
                                <span>Tiempo:</span>
                                <span>{(notification.data.processingTime / 1000).toFixed(1)}s</span>
                              </div>
                            )}
                          </div>
                        )}

                        {notification.data && notification.type === 'urgent_alert' && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="font-medium">Acción requerida</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {notification.agentType === 'phytosanitary' && 'Fitosanitario'}
                            {notification.agentType === 'predictive' && 'Predictivo'}
                            {notification.agentType === 'rag_assistant' && 'Asistente'}
                            {notification.agentType === 'optimization' && 'Optimización'}
                          </Badge>
                          
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs',
                              notification.priority === 'critical' && 'text-red-600 border-red-300',
                              notification.priority === 'high' && 'text-orange-600 border-orange-300',
                              notification.priority === 'medium' && 'text-yellow-600 border-yellow-300',
                              notification.priority === 'low' && 'text-gray-600 border-gray-300'
                            )}
                          >
                            {notification.priority === 'critical' && 'Crítico'}
                            {notification.priority === 'high' && 'Alto'}
                            {notification.priority === 'medium' && 'Medio'}
                            {notification.priority === 'low' && 'Bajo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Componente compacto para mostrar solo el contador de notificaciones
export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  onClick,
  className,
  size = 'md'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('relative', className)}
    >
      <Bell 
        className={cn(
          sizeClasses[size],
          isAnimating && 'animate-bounce',
          unreadCount > 0 ? 'text-blue-600' : 'text-gray-500'
        )} 
      />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};