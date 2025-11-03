import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '../../stores/adminStore';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'export' | 'import';
  entityType: 'users' | 'farms' | 'payments' | 'reports' | 'all';
  selectedIds?: string[];
}

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  includeHeaders: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  fields: string[];
}

interface ImportResult {
  success: boolean;
  processed: number;
  errors: string[];
  warnings: string[];
}

const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  mode,
  entityType,
  selectedIds = []
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeHeaders: true,
    fields: []
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { useAuthenticatedFetch } = useAdminStore();

  const getEntityFields = () => {
    switch (entityType) {
      case 'users':
        return [
          { id: 'id', label: 'ID', required: true },
          { id: 'username', label: 'Nombre de usuario', required: true },
          { id: 'email', label: 'Email', required: true },
          { id: 'firstName', label: 'Nombre', required: false },
          { id: 'lastName', label: 'Apellido', required: false },
          { id: 'role', label: 'Rol', required: false },
          { id: 'status', label: 'Estado', required: false },
          { id: 'createdAt', label: 'Fecha de creación', required: false },
          { id: 'lastLogin', label: 'Último acceso', required: false }
        ];
      case 'farms':
        return [
          { id: 'id', label: 'ID', required: true },
          { id: 'name', label: 'Nombre de la finca', required: true },
          { id: 'location', label: 'Ubicación', required: true },
          { id: 'area', label: 'Área (hectáreas)', required: false },
          { id: 'ownerName', label: 'Propietario', required: false },
          { id: 'coffeeVariety', label: 'Variedad de café', required: false },
          { id: 'altitude', label: 'Altitud', required: false },
          { id: 'certifications', label: 'Certificaciones', required: false }
        ];
      case 'payments':
        return [
          { id: 'id', label: 'ID', required: true },
          { id: 'amount', label: 'Monto', required: true },
          { id: 'currency', label: 'Moneda', required: true },
          { id: 'status', label: 'Estado', required: false },
          { id: 'method', label: 'Método de pago', required: false },
          { id: 'userEmail', label: 'Email del usuario', required: false },
          { id: 'createdAt', label: 'Fecha de creación', required: false },
          { id: 'processedAt', label: 'Fecha de procesamiento', required: false }
        ];
      default:
        return [];
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const exportData = {
        entityType,
        format: exportOptions.format,
        includeHeaders: exportOptions.includeHeaders,
        fields: exportOptions.fields.length > 0 ? exportOptions.fields : getEntityFields().map(f => f.id),
        selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
        dateRange: exportOptions.dateRange
      };

      const response = await useAuthenticatedFetch('/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entityType}_export_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Exportación completada exitosamente');
        onClose();
      } else {
        throw new Error('Error en la exportación');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('entityType', entityType);

      const response = await useAuthenticatedFetch('/admin/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setImportResult(result);
        
        if (result.success) {
          toast.success(`Importación completada: ${result.processed} registros procesados`);
        } else {
          toast.error('La importación completó con errores');
        }
      } else {
        throw new Error('Error en la importación');
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('Error al importar los datos');
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const downloadTemplate = () => {
    const fields = getEntityFields();
    const headers = fields.map(f => f.label).join(',');
    const exampleRow = fields.map(f => {
      switch (f.id) {
        case 'id': return '1';
        case 'email': return 'ejemplo@email.com';
        case 'username': return 'usuario_ejemplo';
        case 'firstName': return 'Juan';
        case 'lastName': return 'Pérez';
        case 'role': return 'user';
        case 'status': return 'active';
        case 'name': return 'Finca Ejemplo';
        case 'location': return 'Huila, Colombia';
        case 'area': return '5.5';
        case 'amount': return '100.00';
        case 'currency': return 'COP';
        case 'method': return 'credit_card';
        default: return 'ejemplo';
      }
    }).join(',');

    const csvContent = `${headers}\n${exampleRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  const fields = getEntityFields();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            {mode === 'export' ? (
              <>
                <Download className="h-5 w-5 mr-2" />
                Exportar {entityType}
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Importar {entityType}
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {mode === 'export' ? (
          <div className="space-y-6">
            {/* Formato de exportación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de archivo
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'csv', label: 'CSV', icon: FileText },
                  { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
                  { value: 'json', label: 'JSON', icon: File },
                  { value: 'pdf', label: 'PDF', icon: FileText }
                ].map((format) => {
                  const IconComponent = format.icon;
                  return (
                    <button
                      key={format.value}
                      onClick={() => setExportOptions({ ...exportOptions, format: format.value as any })}
                      className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                        exportOptions.format === format.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-sm font-medium">{format.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opciones */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeHeaders}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeHeaders: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Incluir encabezados</span>
              </label>
            </div>

            {/* Campos a exportar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campos a exportar
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {fields.map((field) => (
                  <label key={field.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.fields.includes(field.id) || exportOptions.fields.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportOptions({
                            ...exportOptions,
                            fields: [...exportOptions.fields, field.id]
                          });
                        } else {
                          setExportOptions({
                            ...exportOptions,
                            fields: exportOptions.fields.filter(f => f !== field.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <Info className="h-4 w-4 inline mr-1" />
                  Se exportarán {selectedIds.length} elemento(s) seleccionado(s)
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center"
              >
                {exporting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plantilla */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Plantilla de importación
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Descarga la plantilla para asegurar el formato correcto de tus datos.
              </p>
              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Descargar plantilla CSV
              </button>
            </div>

            {/* Selección de archivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {importFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setImportFile(null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Arrastra un archivo aquí o haz clic para seleccionar
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Seleccionar archivo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Formatos soportados: CSV, Excel (.xlsx, .xls)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Resultado de importación */}
            {importResult && (
              <div className={`border rounded-lg p-4 ${
                importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <h4 className={`font-medium ${
                    importResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {importResult.success ? 'Importación exitosa' : 'Importación con errores'}
                  </h4>
                </div>
                <p className={`text-sm ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.processed} registros procesados
                </p>
                
                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-red-900 mb-1">Errores:</h5>
                    <ul className="text-sm text-red-800 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {importResult.warnings.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-yellow-900 mb-1">Advertencias:</h5>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {importResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors flex items-center"
              >
                {importing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportImportModal;