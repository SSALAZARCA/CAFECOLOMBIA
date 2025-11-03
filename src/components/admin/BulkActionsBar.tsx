import React, { useState } from 'react';
import {
  Trash2,
  UserCheck,
  UserX,
  Download,
  Mail,
  Edit,
  Archive,
  MoreHorizontal,
  X,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  action: (selectedIds: string[]) => void;
  confirmMessage?: string;
  requiresConfirmation?: boolean;
}

interface BulkActionsBarProps {
  selectedItems: string[];
  onClearSelection: () => void;
  entityType: 'users' | 'farms' | 'payments' | 'reports';
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  className?: string;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedItems,
  onClearSelection,
  entityType,
  onBulkAction,
  className = ''
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const getUserActions = (): BulkAction[] => [
    {
      id: 'activate',
      label: 'Activar',
      icon: UserCheck,
      color: 'text-green-600 hover:text-green-700',
      action: (ids) => handleBulkAction('activate', ids),
      confirmMessage: `¿Activar ${selectedItems.length} usuario(s)?`
    },
    {
      id: 'deactivate',
      label: 'Desactivar',
      icon: UserX,
      color: 'text-orange-600 hover:text-orange-700',
      action: (ids) => handleBulkAction('deactivate', ids),
      confirmMessage: `¿Desactivar ${selectedItems.length} usuario(s)?`,
      requiresConfirmation: true
    },
    {
      id: 'send-email',
      label: 'Enviar Email',
      icon: Mail,
      color: 'text-blue-600 hover:text-blue-700',
      action: (ids) => handleBulkAction('send-email', ids)
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: Download,
      color: 'text-purple-600 hover:text-purple-700',
      action: (ids) => handleBulkAction('export', ids)
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      color: 'text-red-600 hover:text-red-700',
      action: (ids) => handleBulkAction('delete', ids),
      confirmMessage: `¿Eliminar permanentemente ${selectedItems.length} usuario(s)? Esta acción no se puede deshacer.`,
      requiresConfirmation: true
    }
  ];

  const getFarmActions = (): BulkAction[] => [
    {
      id: 'approve',
      label: 'Aprobar',
      icon: CheckCircle,
      color: 'text-green-600 hover:text-green-700',
      action: (ids) => handleBulkAction('approve', ids),
      confirmMessage: `¿Aprobar ${selectedItems.length} finca(s)?`
    },
    {
      id: 'archive',
      label: 'Archivar',
      icon: Archive,
      color: 'text-orange-600 hover:text-orange-700',
      action: (ids) => handleBulkAction('archive', ids),
      confirmMessage: `¿Archivar ${selectedItems.length} finca(s)?`,
      requiresConfirmation: true
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: Download,
      color: 'text-purple-600 hover:text-purple-700',
      action: (ids) => handleBulkAction('export', ids)
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      color: 'text-red-600 hover:text-red-700',
      action: (ids) => handleBulkAction('delete', ids),
      confirmMessage: `¿Eliminar permanentemente ${selectedItems.length} finca(s)? Esta acción no se puede deshacer.`,
      requiresConfirmation: true
    }
  ];

  const getPaymentActions = (): BulkAction[] => [
    {
      id: 'approve',
      label: 'Aprobar',
      icon: CheckCircle,
      color: 'text-green-600 hover:text-green-700',
      action: (ids) => handleBulkAction('approve', ids),
      confirmMessage: `¿Aprobar ${selectedItems.length} pago(s)?`
    },
    {
      id: 'refund',
      label: 'Reembolsar',
      icon: Edit,
      color: 'text-orange-600 hover:text-orange-700',
      action: (ids) => handleBulkAction('refund', ids),
      confirmMessage: `¿Procesar reembolso para ${selectedItems.length} pago(s)?`,
      requiresConfirmation: true
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: Download,
      color: 'text-purple-600 hover:text-purple-700',
      action: (ids) => handleBulkAction('export', ids)
    }
  ];

  const getReportActions = (): BulkAction[] => [
    {
      id: 'download',
      label: 'Descargar',
      icon: Download,
      color: 'text-blue-600 hover:text-blue-700',
      action: (ids) => handleBulkAction('download', ids)
    },
    {
      id: 'archive',
      label: 'Archivar',
      icon: Archive,
      color: 'text-orange-600 hover:text-orange-700',
      action: (ids) => handleBulkAction('archive', ids),
      confirmMessage: `¿Archivar ${selectedItems.length} reporte(s)?`
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      color: 'text-red-600 hover:text-red-700',
      action: (ids) => handleBulkAction('delete', ids),
      confirmMessage: `¿Eliminar permanentemente ${selectedItems.length} reporte(s)?`,
      requiresConfirmation: true
    }
  ];

  const getActionsForType = (): BulkAction[] => {
    switch (entityType) {
      case 'users': return getUserActions();
      case 'farms': return getFarmActions();
      case 'payments': return getPaymentActions();
      case 'reports': return getReportActions();
      default: return [];
    }
  };

  const handleBulkAction = async (actionId: string, selectedIds: string[]) => {
    try {
      if (onBulkAction) {
        await onBulkAction(actionId, selectedIds);
      }
      
      // Simular acciones específicas
      switch (actionId) {
        case 'activate':
          toast.success(`${selectedIds.length} elemento(s) activado(s) exitosamente`);
          break;
        case 'deactivate':
          toast.success(`${selectedIds.length} elemento(s) desactivado(s) exitosamente`);
          break;
        case 'delete':
          toast.success(`${selectedIds.length} elemento(s) eliminado(s) exitosamente`);
          break;
        case 'export':
          toast.success('Exportación iniciada. Recibirás una notificación cuando esté lista.');
          break;
        case 'send-email':
          toast.success(`Email enviado a ${selectedIds.length} usuario(s)`);
          break;
        case 'approve':
          toast.success(`${selectedIds.length} elemento(s) aprobado(s) exitosamente`);
          break;
        case 'archive':
          toast.success(`${selectedIds.length} elemento(s) archivado(s) exitosamente`);
          break;
        case 'refund':
          toast.success(`Reembolso procesado para ${selectedIds.length} pago(s)`);
          break;
        case 'download':
          toast.success('Descarga iniciada');
          break;
        default:
          toast.info(`Acción "${actionId}" ejecutada`);
      }
      
      onClearSelection();
    } catch (error) {
      console.error('Error en acción en lote:', error);
      toast.error('Error al ejecutar la acción');
    }
  };

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      action.action(selectedItems);
    }
  };

  const confirmAction = () => {
    if (pendingAction) {
      pendingAction.action(selectedItems);
      setPendingAction(null);
      setShowConfirmDialog(false);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
    setShowConfirmDialog(false);
  };

  if (selectedItems.length === 0) {
    return null;
  }

  const actions = getActionsForType();

  return (
    <>
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} elemento(s) seleccionado(s)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {actions.slice(0, 4).map((action) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    className={`flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${action.color} hover:bg-white`}
                    title={action.label}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden sm:inline">{action.label}</span>
                  </button>
                );
              })}
              
              {actions.length > 4 && (
                <div className="relative group">
                  <button className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-white rounded-md transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      {actions.slice(4).map((action) => {
                        const IconComponent = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <IconComponent className="h-4 w-4" />
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={onClearSelection}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-white rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Acción
            </h3>
            <p className="text-gray-600 mb-6">
              {pendingAction.confirmMessage}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsBar;