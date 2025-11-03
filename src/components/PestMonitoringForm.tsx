import React, { useState, useEffect } from 'react';
import { X, Camera, MapPin, AlertTriangle, Save, Loader } from 'lucide-react';

interface Lot {
  id: number;
  name: string;
  area: number;
  farmName: string;
}

interface PestMonitoringFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editData?: any;
}

const pestTypes = [
  { value: 'BROCA', label: 'Broca del Café', threshold: 2 },
  { value: 'ROYA', label: 'Roya del Café', threshold: 5 },
  { value: 'MINADOR', label: 'Minador de la Hoja', threshold: 10 },
  { value: 'COCHINILLA', label: 'Cochinilla', threshold: 15 },
  { value: 'NEMATODOS', label: 'Nematodos', threshold: 20 },
  { value: 'OTROS', label: 'Otros', threshold: 10 }
];

const severityLevels = [
  { value: 'LOW', label: 'Bajo', color: 'text-green-600 bg-green-100' },
  { value: 'MEDIUM', label: 'Medio', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'HIGH', label: 'Alto', color: 'text-orange-600 bg-orange-100' },
  { value: 'CRITICAL', label: 'Crítico', color: 'text-red-600 bg-red-100' }
];

const PestMonitoringForm: React.FC<PestMonitoringFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData
}) => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lotId: '',
    pestType: '',
    severity: '',
    affectedArea: '',
    plantsInspected: '',
    plantsAffected: '',
    description: '',
    symptoms: '',
    location: '',
    weatherConditions: '',
    recommendedActions: '',
    photos: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      fetchLots();
      if (editData) {
        setFormData({
          lotId: editData.lotId?.toString() || '',
          pestType: editData.pestType || '',
          severity: editData.severity || '',
          affectedArea: editData.affectedArea?.toString() || '',
          plantsInspected: editData.plantsInspected?.toString() || '',
          plantsAffected: editData.plantsAffected?.toString() || '',
          description: editData.description || '',
          symptoms: editData.symptoms || '',
          location: editData.location || '',
          weatherConditions: editData.weatherConditions || '',
          recommendedActions: editData.recommendedActions || '',
          photos: editData.photos ? JSON.parse(editData.photos) : []
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editData]);

  const fetchLots = async () => {
    try {
      const { offlineDB } = await import('../utils/offlineDB');
      const lots = await offlineDB.lots.toArray();
      
      const formattedLots = lots.map(lot => ({
        id: lot.id!,
        name: lot.nombre,
        area: lot.area,
        farmName: 'Finca Principal' // Valor por defecto
      }));
      
      setLots(formattedLots);
    } catch (error) {
      console.error('Error fetching lots:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      lotId: '',
      pestType: '',
      severity: '',
      affectedArea: '',
      plantsInspected: '',
      plantsAffected: '',
      description: '',
      symptoms: '',
      location: '',
      weatherConditions: '',
      recommendedActions: '',
      photos: []
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateInfestationLevel = () => {
    const plantsInspected = parseInt(formData.plantsInspected);
    const plantsAffected = parseInt(formData.plantsAffected);
    
    if (plantsInspected > 0 && plantsAffected >= 0) {
      return ((plantsAffected / plantsInspected) * 100).toFixed(1);
    }
    return '0';
  };

  const getRecommendedSeverity = () => {
    const infestationLevel = parseFloat(calculateInfestationLevel());
    const selectedPest = pestTypes.find(p => p.value === formData.pestType);
    
    if (!selectedPest) return '';
    
    if (infestationLevel >= selectedPest.threshold * 3) return 'CRITICAL';
    if (infestationLevel >= selectedPest.threshold * 2) return 'HIGH';
    if (infestationLevel >= selectedPest.threshold) return 'MEDIUM';
    return 'LOW';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        lotId: parseInt(formData.lotId),
        affectedArea: parseFloat(formData.affectedArea),
        plantsInspected: formData.plantsInspected ? parseInt(formData.plantsInspected) : undefined,
        plantsAffected: formData.plantsAffected ? parseInt(formData.plantsAffected) : undefined,
        photos: formData.photos.length > 0 ? formData.photos : undefined
      };

      await onSubmit(submitData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = () => {
    // Simulación de captura de foto
    const photoUrl = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=coffee_plant_pest_damage_${formData.pestType.toLowerCase()}&image_size=square`;
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, photoUrl]
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationText = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
          setFormData(prev => ({
            ...prev,
            location: locationText
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('No se pudo obtener la ubicación. Verifica que tengas permisos de geolocalización habilitados.');
        }
      );
    } else {
      alert('La geolocalización no está soportada en este navegador.');
    }
  };

  if (!isOpen) return null;

  const infestationLevel = calculateInfestationLevel();
  const recommendedSeverity = getRecommendedSeverity();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editData ? 'Editar Monitoreo de Plagas' : 'Nuevo Monitoreo de Plagas'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lote *
              </label>
              <select
                name="lotId"
                value={formData.lotId}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Seleccionar lote</option>
                {lots.map(lot => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} - {lot.farmName} ({lot.area} ha)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Plaga *
              </label>
              <select
                name="pestType"
                value={formData.pestType}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Seleccionar plaga</option>
                {pestTypes.map(pest => (
                  <option key={pest.value} value={pest.value}>
                    {pest.label} (Umbral: {pest.threshold}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Datos de Muestreo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantas Inspeccionadas
              </label>
              <input
                type="number"
                name="plantsInspected"
                value={formData.plantsInspected}
                onChange={handleInputChange}
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ej: 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantas Afectadas
              </label>
              <input
                type="number"
                name="plantsAffected"
                value={formData.plantsAffected}
                onChange={handleInputChange}
                min="0"
                max={formData.plantsInspected || undefined}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ej: 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Infestación
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${infestationLevel}%`}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                />
                {recommendedSeverity && (
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    severityLevels.find(s => s.value === recommendedSeverity)?.color
                  }`}>
                    {severityLevels.find(s => s.value === recommendedSeverity)?.label}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Severidad y Área Afectada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severidad *
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Seleccionar severidad</option>
                {severityLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              {recommendedSeverity && formData.severity !== recommendedSeverity && (
                <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Severidad recomendada: {severityLevels.find(s => s.value === recommendedSeverity)?.label}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área Afectada (ha) *
              </label>
              <input
                type="number"
                name="affectedArea"
                value={formData.affectedArea}
                onChange={handleInputChange}
                step="0.1"
                min="0.1"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ej: 1.5"
              />
            </div>
          </div>

          {/* Descripción y Síntomas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Describe los hallazgos del monitoreo..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Síntomas Observados
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Describe los síntomas específicos..."
              />
            </div>
          </div>

          {/* Ubicación y Condiciones Climáticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación Específica
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ej: Sector norte, cerca del río"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Obtener ubicación GPS"
                >
                  <MapPin className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condiciones Climáticas
              </label>
              <input
                type="text"
                name="weatherConditions"
                value={formData.weatherConditions}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ej: Soleado, 25°C, humedad alta"
              />
            </div>
          </div>

          {/* Acciones Recomendadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acciones Recomendadas
            </label>
            <textarea
              name="recommendedActions"
              value={formData.recommendedActions}
              onChange={handleInputChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Describe las acciones recomendadas para el control..."
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidencia Fotográfica
            </label>
            <div className="space-y-4">
              <button
                type="button"
                onClick={handlePhotoCapture}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Camera className="h-4 w-4" />
                Capturar Foto
              </button>
              
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Evidencia ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editData ? 'Actualizar' : 'Guardar'} Monitoreo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PestMonitoringForm;