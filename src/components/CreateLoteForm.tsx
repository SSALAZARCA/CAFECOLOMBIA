import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, MapPin, Save, Coffee } from 'lucide-react';
import { LatLngExpression } from 'leaflet';
import LoteDrawingMap from './LoteDrawingMap';

interface TerrainInfo {
  area: number;
  perimeter: number;
  centroid: LatLngExpression;
  estimatedAltitude: number;
  estimatedSlope: number;
  exposition: 'norte' | 'sur' | 'este' | 'oeste' | 'noreste' | 'noroeste' | 'sureste' | 'suroeste';
}

// Schema de validación para el formulario
const loteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres'),
  variedad: z.string().min(1, 'La variedad es requerida'),
  fechaSiembra: z.string().min(1, 'La fecha de siembra es requerida'),
  area: z.number().min(0.1, 'El área debe ser mayor a 0.1 hectáreas').max(100, 'Máximo 100 hectáreas'),
  numeroArboles: z.number().min(1, 'Debe tener al menos 1 árbol').max(50000, 'Máximo 50,000 árboles'),
  densidad: z.number().min(500, 'Densidad mínima 500 árboles/ha').max(10000, 'Densidad máxima 10,000 árboles/ha'),
  estado: z.enum(['crecimiento', 'produccion', 'zoca', 'renovacion']),
  altitud: z.number().min(800, 'Altitud mínima 800 msnm').max(2500, 'Altitud máxima 2,500 msnm').optional(),
  pendiente: z.number().min(0, 'Pendiente mínima 0%').max(100, 'Pendiente máxima 100%').optional(),
  exposicion: z.enum(['norte', 'sur', 'este', 'oeste', 'noreste', 'noroeste', 'sureste', 'suroeste']).optional(),
  tipoSuelo: z.string().optional(),
  observaciones: z.string().max(500, 'Máximo 500 caracteres').optional(),
  coordenadas: z.array(z.array(z.number())).optional(),
});

type LoteFormData = z.infer<typeof loteSchema>;

interface CreateLoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LoteFormData) => void;
}

const variedadesCafe = [
  'Caturra',
  'Colombia',
  'Castillo',
  'Típica',
  'Borbón',
  'Tabi',
  'Geisha',
  'Pacamara',
  'Maragogipe',
  'Otro'
];

const estadosLote = [
  { value: 'crecimiento', label: 'Crecimiento', description: 'Plantas jóvenes en desarrollo' },
  { value: 'produccion', label: 'Producción', description: 'Lote en plena producción' },
  { value: 'zoca', label: 'Zoca', description: 'Renovación por poda drástica' },
  { value: 'renovacion', label: 'Renovación', description: 'Replantación completa' },
];

const exposiciones = [
  { value: 'norte', label: 'Norte' },
  { value: 'noreste', label: 'Noreste' },
  { value: 'este', label: 'Este' },
  { value: 'sureste', label: 'Sureste' },
  { value: 'sur', label: 'Sur' },
  { value: 'suroeste', label: 'Suroeste' },
  { value: 'oeste', label: 'Oeste' },
  { value: 'noroeste', label: 'Noroeste' },
];

export default function CreateLoteForm({ isOpen, onClose, onSubmit }: CreateLoteFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Log cuando el formulario se abre/cierra
  console.log('🔄 CreateLoteForm render - isOpen:', isOpen, 'currentStep:', currentStep);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<LoteFormData>({
    resolver: zodResolver(loteSchema),
    defaultValues: {
      estado: 'crecimiento',
      densidad: 5000,
    },
  });

  // Log de errores de validación solo cuando hay errores
  if (Object.keys(errors).length > 0) {
    console.log('🔍 Errores de validación actuales:', errors);
  }

  const watchedArea = watch('area');
  const watchedDensidad = watch('densidad');

  // Calcular número de árboles automáticamente
  const calculateTrees = () => {
    if (watchedArea && watchedDensidad) {
      const trees = Math.round(watchedArea * watchedDensidad);
      setValue('numeroArboles', trees);
    }
  };

  const handleFormSubmit = (data: LoteFormData) => {
    console.log('🚀 handleFormSubmit ejecutado con datos:', data);
    try {
      onSubmit(data);
      reset();
      setCurrentStep(1);
      onClose();
      console.log('✅ Formulario enviado exitosamente');
    } catch (error) {
      console.error('❌ Error en handleFormSubmit:', error);
    }
  };

  const handleFormError = (errors: any) => {
    console.error('❌ Errores de validación en el envío:', errors);
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    onClose();
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Función de prueba para verificar el auto-llenado
  const testAutoFill = () => {
    const testCoordinates: LatLngExpression[] = [
      [2.9273, -75.2819],
      [2.9283, -75.2829],
      [2.9293, -75.2839],
      [2.9273, -75.2819]
    ];
    
    const testTerrainInfo: TerrainInfo = {
      area: 1.5,
      perimeter: 500,
      centroid: [2.9283, -75.2829],
      estimatedAltitude: 1650,
      estimatedSlope: 12,
      exposition: 'sur'
    };
    
    console.log('🧪 Ejecutando prueba de auto-llenado...');
    handlePolygonComplete(testCoordinates, testTerrainInfo);
  };

  // Función de prueba para llenar todos los campos requeridos
  const testFillAllFields = () => {
    console.log('🧪 Llenando todos los campos requeridos...');
    setValue('nombre', 'Lote de Prueba');
    setValue('variedad', 'Caturra');
    setValue('fechaSiembra', '2024-01-15');
    setValue('area', 2.5);
    setValue('numeroArboles', 12500);
    setValue('densidad', 5000);
    setValue('estado', 'crecimiento');
    console.log('✅ Todos los campos llenados');
  };

  const handlePolygonComplete = (coordinates: LatLngExpression[], terrainInfo: TerrainInfo) => {
    console.log('📝 CreateLoteForm recibió datos del polígono:', {
      coordinates,
      terrainInfo
    });
    
    setValue('coordenadas', coordinates.map(coord => Array.isArray(coord) ? coord : [coord.lat, coord.lng]));
    setValue('area', terrainInfo.area);
    setValue('altitud', Math.round(terrainInfo.estimatedAltitude));
    setValue('pendiente', Math.round(terrainInfo.estimatedSlope));
    setValue('exposicion', terrainInfo.exposition);
    
    console.log('💾 Valores establecidos en el formulario:', {
      area: terrainInfo.area,
      altitud: Math.round(terrainInfo.estimatedAltitude),
      pendiente: Math.round(terrainInfo.estimatedSlope),
      exposicion: terrainInfo.exposition
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Coffee className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Lote</h2>
              <p className="text-sm text-gray-600">Paso {currentStep} de {totalSteps}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)}>
          <div className="p-6">
            {/* Paso 1: Información Básica */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Lote *
                    </label>
                    <input
                      type="text"
                      {...register('nombre')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ej: Lote El Mirador"
                    />
                    {errors.nombre && (
                      <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variedad de Café *
                    </label>
                    <select
                      {...register('variedad')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar variedad</option>
                      {variedadesCafe.map((variedad) => (
                        <option key={variedad} value={variedad}>
                          {variedad}
                        </option>
                      ))}
                    </select>
                    {errors.variedad && (
                      <p className="text-red-500 text-sm mt-1">{errors.variedad.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Siembra *
                    </label>
                    <input
                      type="date"
                      {...register('fechaSiembra')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {errors.fechaSiembra && (
                      <p className="text-red-500 text-sm mt-1">{errors.fechaSiembra.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado del Cultivo *
                    </label>
                    <select
                      {...register('estado')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {estadosLote.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                    {errors.estado && (
                      <p className="text-red-500 text-sm mt-1">{errors.estado.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Área y Densidad */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Área y Densidad</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Área (hectáreas) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('area', { valueAsNumber: true })}
                      onChange={(e) => {
                        register('area').onChange(e);
                        setTimeout(calculateTrees, 100);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="2.5"
                    />
                    {errors.area && (
                      <p className="text-red-500 text-sm mt-1">{errors.area.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Densidad (árboles/ha) *
                    </label>
                    <input
                      type="number"
                      {...register('densidad', { valueAsNumber: true })}
                      onChange={(e) => {
                        register('densidad').onChange(e);
                        setTimeout(calculateTrees, 100);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="5000"
                    />
                    {errors.densidad && (
                      <p className="text-red-500 text-sm mt-1">{errors.densidad.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número Total de Árboles *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        {...register('numeroArboles', { valueAsNumber: true })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="12500"
                      />
                      <button
                        type="button"
                        onClick={calculateTrees}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        Calcular
                      </button>
                    </div>
                    {errors.numeroArboles && (
                      <p className="text-red-500 text-sm mt-1">{errors.numeroArboles.message}</p>
                    )}
                    {watchedArea && watchedDensidad && (
                      <p className="text-sm text-gray-600 mt-1">
                        Calculado: {Math.round(watchedArea * watchedDensidad).toLocaleString()} árboles
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Georreferenciación */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Dibuja el Polígono del Lote
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Haz clic en el mapa para crear los puntos del polígono. El área se calculará automáticamente.
                  </p>
                  
                  {/* Botón de prueba temporal */}
                  <button
                    type="button"
                    onClick={testAutoFill}
                    className="mb-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    🧪 Probar Auto-llenado
                  </button>
                </div>

                <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
                  <LoteDrawingMap
                    onPolygonComplete={handlePolygonComplete}
                    initialArea={watch('area')}
                  />
                </div>

                {watch('area') && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="flex-shrink-0">
                        <MapPin className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Información Extraída Automáticamente
                        </h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Área:</span>
                        <span className="ml-2 font-semibold text-green-700">
                          {watch('area')?.toFixed(2)} ha
                        </span>
                      </div>
                      {watch('altitud') && (
                        <div>
                          <span className="text-gray-600">Altitud:</span>
                          <span className="ml-2 font-semibold text-purple-700">
                            {watch('altitud')} msnm
                          </span>
                        </div>
                      )}
                      {watch('pendiente') !== undefined && (
                        <div>
                          <span className="text-gray-600">Pendiente:</span>
                          <span className="ml-2 font-semibold text-orange-700">
                            {watch('pendiente')}%
                          </span>
                        </div>
                      )}
                      {watch('exposicion') && (
                        <div>
                          <span className="text-gray-600">Exposición:</span>
                          <span className="ml-2 font-semibold text-indigo-700 capitalize">
                            {watch('exposicion')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paso 4: Información Adicional */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Información Adicional</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('📋 Estado de validación actual:', {
                          errors: Object.keys(errors),
                          hasErrors: Object.keys(errors).length > 0,
                          formData: watch()
                        });
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      📋 Ver Estado
                    </button>
                    <button
                      type="button"
                      onClick={testFillAllFields}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      🧪 Llenar Campos
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altitud (msnm)
                    </label>
                    <input
                      type="number"
                      {...register('altitud', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="1500"
                    />
                    {errors.altitud && (
                      <p className="text-red-500 text-sm mt-1">{errors.altitud.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pendiente (%)
                    </label>
                    <input
                      type="number"
                      {...register('pendiente', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="15"
                    />
                    {errors.pendiente && (
                      <p className="text-red-500 text-sm mt-1">{errors.pendiente.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exposición
                    </label>
                    <select
                      {...register('exposicion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar exposición</option>
                      {exposiciones.map((exp) => (
                        <option key={exp.value} value={exp.value}>
                          {exp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Suelo
                    </label>
                    <input
                      type="text"
                      {...register('tipoSuelo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ej: Franco arcilloso"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      {...register('observaciones')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Información adicional sobre el lote..."
                    />
                    {errors.observaciones && (
                      <p className="text-red-500 text-sm mt-1">{errors.observaciones.message}</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Georreferenciación</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Después de crear el lote, podrás definir sus coordenadas en el mapa interactivo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => {
                    console.log('🔘 Botón Crear Lote clickeado');
                    console.log('📊 Estado del formulario:', {
                      isSubmitting,
                      errors: Object.keys(errors),
                      currentStep,
                      formData: watch()
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Crear Lote
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}