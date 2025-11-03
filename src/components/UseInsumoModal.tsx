import { useState, useEffect } from 'react';
import { X, Save, Droplets, MapPin, User, Calendar } from 'lucide-react';

interface Lote {
  id: string;
  name: string;
  area: number;
}

interface UseInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (usage: any) => void;
  insumo: any;
}

const mockLotes: Lote[] = [
  { id: '1', name: 'Lote A - Caturra', area: 2.5 },
  { id: '2', name: 'Lote B - Colombia', area: 3.2 },
  { id: '3', name: 'Lote C - Castillo', area: 1.8 },
  { id: '4', name: 'Lote D - Típica', area: 2.1 }
];

export default function UseInsumoModal({ isOpen, onClose, onSave, insumo }: UseInsumoModalProps) {
  const [formData, setFormData] = useState({
    loteId: '',
    quantityUsed: 0,
    applicationMethod: 'ASPERSION',
    applicationDate: new Date().toISOString().split('T')[0],
    responsiblePerson: '',
    weatherConditions: 'SOLEADO',
    notes: '',
    dosisPerHectare: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [calculatedDosis, setCalculatedDosis] = useState(0);
  const [harvestSafeDate, setHarvestSafeDate] = useState('');

  useEffect(() => {
    if (formData.loteId) {
      const lote = mockLotes.find(l => l.id === formData.loteId);
      setSelectedLote(lote || null);
    }
  }, [formData.loteId]);

  useEffect(() => {
    if (selectedLote && formData.quantityUsed > 0) {
      const dosisPerHa = formData.quantityUsed / selectedLote.area;
      setCalculatedDosis(dosisPerHa);
    }
  }, [selectedLote, formData.quantityUsed]);

  useEffect(() => {
    if (formData.applicationDate && insumo?.gracePeriodDays > 0) {
      const applicationDate = new Date(formData.applicationDate);
      const safeDate = new Date(applicationDate);
      safeDate.setDate(safeDate.getDate() + insumo.gracePeriodDays);
      setHarvestSafeDate(safeDate.toISOString().split('T')[0]);
    }
  }, [formData.applicationDate, insumo?.gracePeriodDays]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.loteId) newErrors.loteId = 'Debe seleccionar un lote';
    if (formData.quantityUsed <= 0) newErrors.quantityUsed = 'La cantidad debe ser mayor a 0';
    if (formData.quantityUsed > (insumo?.quantity || 0)) {
      newErrors.quantityUsed = `No hay suficiente stock. Disponible: ${insumo?.quantity} ${insumo?.unit}`;
    }
    if (!formData.applicationDate) newErrors.applicationDate = 'La fecha de aplicación es requerida';
    if (!formData.responsiblePerson.trim()) newErrors.responsiblePerson = 'El responsable es requerido';

    // Validate application date is not in the future
    const today = new Date().toISOString().split('T')[0];
    if (formData.applicationDate > today) {
      newErrors.applicationDate = 'La fecha de aplicación no puede ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const usage = {
      id: Date.now().toString(),
      insumoId: insumo.id,
      insumoName: insumo.name,
      loteId: formData.loteId,
      loteName: selectedLote?.name || '',
      quantityUsed: formData.quantityUsed,
      unit: insumo.unit,
      applicationMethod: formData.applicationMethod,
      applicationDate: formData.applicationDate,
      responsiblePerson: formData.responsiblePerson,
      weatherConditions: formData.weatherConditions,
      notes: formData.notes,
      dosisPerHectare: calculatedDosis,
      harvestSafeDate: harvestSafeDate,
      gracePeriodDays: insumo.gracePeriodDays,
      createdAt: new Date().toISOString()
    };

    onSave(usage);
    onClose();
    
    // Reset form
    setFormData({
      loteId: '',
      quantityUsed: 0,
      applicationMethod: 'ASPERSION',
      applicationDate: new Date().toISOString().split('T')[0],
      responsiblePerson: '',
      weatherConditions: 'SOLEADO',
      notes: '',
      dosisPerHectare: 0
    });
    setErrors({});
  };

  if (!isOpen || !insumo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Registrar Uso de Insumo</h2>
              <p className="text-sm text-gray-600">{insumo.name} - {insumo.brand}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información del Insumo */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Información del Insumo</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <span className="font-medium">Stock disponible:</span> {insumo.quantity} {insumo.unit}
              </div>
              <div>
                <span className="font-medium">Período de carencia:</span> {insumo.gracePeriodDays} días
              </div>
              <div>
                <span className="font-medium">Ingrediente activo:</span> {insumo.activeIngredient}
              </div>
              <div>
                <span className="font-medium">Concentración:</span> {insumo.concentration}
              </div>
            </div>
          </div>

          {/* Información de Aplicación */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Aplicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Lote de Aplicación *
                </label>
                <select
                  name="loteId"
                  value={formData.loteId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.loteId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar lote</option>
                  {mockLotes.map(lote => (
                    <option key={lote.id} value={lote.id}>
                      {lote.name} ({lote.area} ha)
                    </option>
                  ))}
                </select>
                {errors.loteId && <p className="text-red-500 text-xs mt-1">{errors.loteId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Aplicación *
                </label>
                <input
                  type="date"
                  name="applicationDate"
                  value={formData.applicationDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.applicationDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.applicationDate && <p className="text-red-500 text-xs mt-1">{errors.applicationDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Utilizada * ({insumo.unit})
                </label>
                <input
                  type="number"
                  name="quantityUsed"
                  value={formData.quantityUsed}
                  onChange={handleInputChange}
                  min="0"
                  max={insumo.quantity}
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.quantityUsed ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.quantityUsed && <p className="text-red-500 text-xs mt-1">{errors.quantityUsed}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Aplicación
                </label>
                <select
                  name="applicationMethod"
                  value={formData.applicationMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ASPERSION">Aspersión</option>
                  <option value="RIEGO">Riego</option>
                  <option value="ESPOLVOREO">Espolvoreo</option>
                  <option value="INYECCION">Inyección al suelo</option>
                  <option value="MANUAL">Aplicación manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Responsable de la Aplicación *
                </label>
                <input
                  type="text"
                  name="responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.responsiblePerson ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre del responsable"
                />
                {errors.responsiblePerson && <p className="text-red-500 text-xs mt-1">{errors.responsiblePerson}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condiciones Climáticas
                </label>
                <select
                  name="weatherConditions"
                  value={formData.weatherConditions}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="SOLEADO">Soleado</option>
                  <option value="NUBLADO">Nublado</option>
                  <option value="LLUVIA_LIGERA">Lluvia ligera</option>
                  <option value="VIENTO">Ventoso</option>
                  <option value="HUMEDO">Húmedo</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observaciones adicionales sobre la aplicación..."
              />
            </div>
          </div>

          {/* Cálculos y Alertas */}
          {selectedLote && formData.quantityUsed > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-2">Cálculos de Aplicación</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <span className="font-medium">Área del lote:</span> {selectedLote.area} ha
                </div>
                <div>
                  <span className="font-medium">Dosis por hectárea:</span> {calculatedDosis.toFixed(2)} {insumo.unit}/ha
                </div>
              </div>
            </div>
          )}

          {harvestSafeDate && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Período de Carencia</h4>
              <div className="text-sm text-amber-700">
                <p>
                  <span className="font-medium">Fecha segura para cosecha:</span> {new Date(harvestSafeDate).toLocaleDateString()}
                </p>
                <p className="text-xs mt-1">
                  No cosechar antes de esta fecha para cumplir con el período de carencia de {insumo.gracePeriodDays} días.
                </p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Registrar Uso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}