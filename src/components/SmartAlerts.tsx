import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Cloud, 
  Thermometer,
  Droplets,
  Bug,
  Calendar,
  Settings,
  Smartphone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp
} from 'lucide-react';

interface SmartAlert {
  id: string;
  type: 'THRESHOLD_EXCEEDED' | 'WEATHER_RISK' | 'MONITORING_REMINDER' | 'TREATMENT_DUE' | 'RESISTANCE_WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  pestType?: string;
  lotId?: string;
  lotName?: string;
  threshold?: number;
  currentValue?: number;
  weatherData?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    forecast: string;
  };
  recommendations: string[];
  createdAt: string;
  isRead: boolean;
  isActive: boolean;
  scheduledFor?: string;
  actionTaken?: boolean;
}

interface AlertSettings {
  thresholdAlerts: boolean;
  weatherAlerts: boolean;
  monitoringReminders: boolean;
  treatmentReminders: boolean;
  resistanceWarnings: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  alertFrequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface SmartAlertsProps {
  farmId: string;
  onAlertAction?: (alertId: string, action: string) => void;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({
  farmId,
  onAlertAction
}) => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    thresholdAlerts: true,
    weatherAlerts: true,
    monitoringReminders: true,
    treatmentReminders: true,
    resistanceWarnings: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    alertFrequency: 'IMMEDIATE',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '06:00'
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    fetchAlerts();
    fetchSettings();
    
    // Configurar polling para nuevas alertas
    const interval = setInterval(fetchAlerts, 30000); // Cada 30 segundos
    
    return () => clearInterval(interval);
  }, [farmId]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/alerts/smart?farmId=${farmId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/alerts/settings?farmId=${farmId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<AlertSettings>) => {
    try {
      const token = localStorage.getItem('token');
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch(`/api/alerts/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ farmId, settings: updatedSettings })
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, isActive: false } : alert
      ));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const takeAction = async (alertId: string, action: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/alerts/${alertId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, actionTaken: true } : alert
      ));
      
      onAlertAction?.(alertId, action);
    } catch (error) {
      console.error('Error taking action:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'THRESHOLD_EXCEEDED': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'WEATHER_RISK': return <Cloud className="h-5 w-5 text-blue-500" />;
      case 'MONITORING_REMINDER': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'TREATMENT_DUE': return <Bug className="h-5 w-5 text-purple-500" />;
      case 'RESISTANCE_WARNING': return <TrendingUp className="h-5 w-5 text-orange-500" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-l-red-500 bg-red-50';
      case 'HIGH': return 'border-l-orange-500 bg-orange-50';
      case 'MEDIUM': return 'border-l-yellow-500 bg-yellow-50';
      case 'LOW': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const unreadAlerts = activeAlerts.filter(alert => !alert.isRead);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'CRITICAL');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Bell className="h-6 w-6 animate-pulse mr-2" />
            <span>Cargando alertas inteligentes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Activas</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sin Leer</p>
                <p className="text-2xl font-bold text-orange-600">{unreadAlerts.length}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Críticas</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Configuración</p>
                <p className="text-sm text-green-600">
                  {Object.values(settings).filter(Boolean).length} activas
                </p>
              </div>
              <Settings className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticas */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-l-4 border-l-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>¡Atención!</strong> Tienes {criticalAlerts.length} alerta(s) crítica(s) que requieren acción inmediata.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">
            Alertas ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">No hay alertas activas</h3>
                <p className="text-gray-600">Tu finca está bajo control. Continúa con el monitoreo regular.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)} ${
                  !alert.isRead ? 'shadow-md' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                              {alert.severity}
                            </Badge>
                            {!alert.isRead && (
                              <Badge variant="outline" className="bg-blue-50">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          
                          {alert.lotName && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                              <Calendar className="h-3 w-3" />
                              <span>Lote: {alert.lotName}</span>
                            </div>
                          )}
                          
                          {alert.currentValue && alert.threshold && (
                            <div className="text-sm mb-2">
                              <span className="text-gray-600">Valor actual: </span>
                              <span className="font-bold">{alert.currentValue.toFixed(1)}%</span>
                              <span className="text-gray-600"> | Umbral: </span>
                              <span className="font-bold">{alert.threshold.toFixed(1)}%</span>
                            </div>
                          )}
                          
                          {alert.weatherData && (
                            <div className="grid grid-cols-3 gap-2 text-xs bg-blue-50 p-2 rounded mb-2">
                              <div className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3" />
                                <span>{alert.weatherData.temperature}°C</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Droplets className="h-3 w-3" />
                                <span>{alert.weatherData.humidity}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Cloud className="h-3 w-3" />
                                <span>{alert.weatherData.rainfall}mm</span>
                              </div>
                            </div>
                          )}
                          
                          {alert.recommendations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Recomendaciones:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {alert.recommendations.slice(0, 2).map((rec, index) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <span className="text-blue-500">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {!alert.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(alert.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Marcar leída
                          </Button>
                        )}
                        
                        {!alert.actionTaken && alert.severity !== 'LOW' && (
                          <Button
                            size="sm"
                            onClick={() => takeAction(alert.id, 'schedule_treatment')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Tomar Acción
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Descartar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.filter(alert => !alert.isActive).slice(0, 10).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="opacity-60">
                      {alert.actionTaken ? 'Resuelta' : 'Descartada'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Umbral</p>
                  <p className="text-sm text-gray-600">Cuando se superan los umbrales económicos</p>
                </div>
                <Switch
                  checked={settings.thresholdAlerts}
                  onCheckedChange={(checked) => updateSettings({ thresholdAlerts: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas Climáticas</p>
                  <p className="text-sm text-gray-600">Condiciones favorables para plagas</p>
                </div>
                <Switch
                  checked={settings.weatherAlerts}
                  onCheckedChange={(checked) => updateSettings({ weatherAlerts: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios de Monitoreo</p>
                  <p className="text-sm text-gray-600">Programación de inspecciones</p>
                </div>
                <Switch
                  checked={settings.monitoringReminders}
                  onCheckedChange={(checked) => updateSettings({ monitoringReminders: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios de Tratamiento</p>
                  <p className="text-sm text-gray-600">Aplicaciones programadas</p>
                </div>
                <Switch
                  checked={settings.treatmentReminders}
                  onCheckedChange={(checked) => updateSettings({ treatmentReminders: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Resistencia</p>
                  <p className="text-sm text-gray-600">Posible resistencia a productos</p>
                </div>
                <Switch
                  checked={settings.resistanceWarnings}
                  onCheckedChange={(checked) => updateSettings({ resistanceWarnings: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Canales de Notificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Notificaciones Push</p>
                    <p className="text-sm text-gray-600">En la aplicación</p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <div>
                    <p className="font-medium">SMS</p>
                    <p className="text-sm text-gray-600">Mensajes de texto</p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSettings({ smsNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartAlerts;