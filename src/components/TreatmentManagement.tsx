import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Droplets, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';

interface Treatment {
  id: number;
  lotId: number;
  lotName: string;
  pestType: string;
  treatmentType: 'PREVENTIVE' | 'CURATIVE' | 'BIOLOGICAL' | 'CULTURAL';
  product: string;
  dosage: string;
  applicationMethod: string;
  scheduledDate: string;
  appliedDate?: string;
  status: 'SCHEDULED' | 'APPLIED' | 'CANCELLED';
  efficacy?: number;
  notes?: string;
  preHarvestInterval: number;
  applicator?: string;
  weatherConditions?: string;
  createdAt: string;
}

interface TreatmentManagementProps {
  farmId?: number;
  onClose: () => void;
}

const TreatmentManagement: React.FC<TreatmentManagementProps> = ({ farmId, onClose }) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'applied' | 'overdue'>('all');

  const [formData, setFormData] = useState({
    lotId: '',
    pestType: '',
    treatmentType: 'PREVENTIVE' as const,
    product: '',
    dosage: '',
    applicationMethod: '',
    scheduledDate: '',
    preHarvestInterval: 0,
    notes: ''
  });

  useEffect(() => {
    fetchTreatments();
    fetchLots();
  }, [farmId]);

  const fetchTreatments = async () => {
    try {
      const { offlineDB } = await import('../utils/offlineDB');
      
      // Simular datos de tratamientos
      const mockTreatments: Treatment[] = [
        {
          id: 1,
          lotId: 1,
          lotName: 'Lote El Mirador',
          pestType: 'BROCA',
          treatmentType: 'PREVENTIVE',
          product: 'Beauveria bassiana',
          dosage: '2 kg/ha',
          applicationMethod: 'Aspersión foliar',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'SCHEDULED',
          preHarvestInterval: 30,
          notes: 'Aplicar en horas de la mañana',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          lotId: 2,
          lotName: 'Lote La Esperanza',
          pestType: 'ROYA',
          treatmentType: 'CURATIVE',
          product: 'Fungicida sistémico',
          dosage: '1.5 L/ha',
          applicationMethod: 'Aspersión dirigida',
          scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'APPLIED',
          efficacy: 85,
          preHarvestInterval: 21,
          applicator: 'Juan Pérez',
          weatherConditions: 'Nublado, sin viento',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setTreatments(mockTreatments);
    } catch (error) {
      console.error('Error fetching treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLots = async () => {
    try {
      const { offlineDB } = await import('../utils/offlineDB');
      const lots = await offlineDB.lots.toArray();
      
      const formattedLots = lots.map(lot => ({
        id: lot.id!,
        name: lot.nombre,
        area: lot.area,
        farmName: 'Finca Principal'
      }));
      
      setLots(formattedLots);
    } catch (error) {
      console.error('Error fetching lots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedLot = lots.find(lot => lot.id === parseInt(formData.lotId));
      
      const newTreatment: Treatment = {
        id: editingTreatment ? editingTreatment.id : Date.now(),
        lotId: parseInt(formData.lotId),
        lotName: selectedLot?.name || 'Lote desconocido',
        pestType: formData.pestType,
        treatmentType: formData.treatmentType,
        product: formData.product,
        dosage: formData.dosage,
        applicationMethod: formData.applicationMethod,
        scheduledDate: formData.scheduledDate,
        status: 'SCHEDULED',
        preHarvestInterval: formData.preHarvestInterval,
        notes: formData.notes,
        createdAt: editingTreatment ? editingTreatment.createdAt : new Date().toISOString()
      };

      if (editingTreatment) {
        setTreatments(prev => prev.map(t => t.id === editingTreatment.id ? newTreatment : t));
      } else {
        setTreatments(prev => [...prev, newTreatment]);
      }

      resetForm();
      
      // Mostrar mensaje de éxito
      const action = editingTreatment ? 'actualizado' : 'creado';
      alert(`Tratamiento ${action} exitosamente`);
    } catch (error) {
      console.error('Error saving treatment:', error);
      alert('Error al guardar el tratamiento');
    }
  };

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setFormData({
      lotId: treatment.lotId.toString(),
      pestType: treatment.pestType,
      treatmentType: treatment.treatmentType,
      product: treatment.product,
      dosage: treatment.dosage,
      applicationMethod: treatment.applicationMethod,
      scheduledDate: treatment.scheduledDate.split('T')[0],
      preHarvestInterval: treatment.preHarvestInterval,
      notes: treatment.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este tratamiento?')) return;

    try {
      setTreatments(prev => prev.filter(t => t.id !== id));
      alert('Tratamiento eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting treatment:', error);
      alert('Error al eliminar el tratamiento');
    }
  };

  const markAsApplied = async (id: number) => {
    try {
      setTreatments(prev => prev.map(t => 
        t.id === id 
          ? { 
              ...t, 
              status: 'APPLIED' as const, 
              appliedDate: new Date().toISOString().split('T')[0],
              applicator: 'Usuario Actual'
            }
          : t
      ));
      alert('Tratamiento marcado como aplicado');
    } catch (error) {
      console.error('Error marking treatment as applied:', error);
      alert('Error al marcar el tratamiento como aplicado');
    }
  };

  const resetForm = () => {
    setFormData({
      lotId: '',
      pestType: '',
      treatmentType: 'PREVENTIVE',
      product: '',
      dosage: '',
      applicationMethod: '',
      scheduledDate: '',
      preHarvestInterval: 0,
      notes: ''
    });
    setEditingTreatment(null);
    setShowForm(false);
  };

  const getFilteredTreatments = () => {
    const now = new Date();
    
    return treatments.filter(treatment => {
      switch (filter) {
        case 'scheduled':
          return treatment.status === 'SCHEDULED';
        case 'applied':
          return treatment.status === 'APPLIED';
        case 'overdue':
          return treatment.status === 'SCHEDULED' && new Date(treatment.scheduledDate) < now;
        default:
          return true;
      }
    });
  };

  const getTreatmentTypeText = (type: string) => {
    switch (type) {
      case 'PREVENTIVE': return 'Preventivo';
      case 'CURATIVE': return 'Curativo';
      case 'BIOLOGICAL': return 'Biológico';
      case 'CULTURAL': return 'Cultural';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'APPLIED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (scheduledDate: string, status: string) => {
    return status === 'SCHEDULED' && new Date(scheduledDate) < new Date();
  };

  const filteredTreatments = getFilteredTreatments();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Tratamientos</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Tratamiento
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'scheduled', label: 'Programados' },
            { key: 'applied', label: 'Aplicados' },
            { key: 'overdue', label: 'Vencidos' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista de Tratamientos */}
        <div className="space-y-4 mb-6">
          {filteredTreatments.map((treatment) => (
            <div
              key={treatment.id}
              className={`bg-white border rounded-lg p-4 ${
                isOverdue(treatment.scheduledDate, treatment.status)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{treatment.product}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(treatment.status)}`}>
                      {treatment.status === 'SCHEDULED' ? 'Programado' : 
                       treatment.status === 'APPLIED' ? 'Aplicado' : 'Cancelado'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {getTreatmentTypeText(treatment.treatmentType)}
                    </span>
                    {isOverdue(treatment.scheduledDate, treatment.status) && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Vencido
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {treatment.lotName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(treatment.scheduledDate).toLocaleDateString('es-ES')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-4 w-4" />
                      {treatment.dosage}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {treatment.preHarvestInterval} días
                    </div>
                  </div>

                  {treatment.notes && (
                    <p className="text-sm text-gray-600 mt-2">{treatment.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {treatment.status === 'SCHEDULED' && (
                    <button
                      onClick={() => markAsApplied(treatment.id)}
                      className="text-green-600 hover:text-green-700 p-1"
                      title="Marcar como aplicado"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(treatment)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(treatment.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTreatments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay tratamientos {filter !== 'all' ? `${filter === 'scheduled' ? 'programados' : filter === 'applied' ? 'aplicados' : 'vencidos'}` : ''} para mostrar
            </div>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingTreatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lote *
                  </label>
                  <select
                    value={formData.lotId}
                    onChange={(e) => setFormData({ ...formData, lotId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">Seleccionar lote</option>
                    {lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name} - {lot.area} ha
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Plaga *
                  </label>
                  <select
                    value={formData.pestType}
                    onChange={(e) => setFormData({ ...formData, pestType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">Seleccionar plaga</option>
                    <option value="BROCA">Broca del Café</option>
                    <option value="ROYA">Roya del Café</option>
                    <option value="MINADOR">Minador de la Hoja</option>
                    <option value="COCHINILLA">Cochinilla</option>
                    <option value="NEMATODOS">Nematodos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Tratamiento *
                  </label>
                  <select
                    value={formData.treatmentType}
                    onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="PREVENTIVE">Preventivo</option>
                    <option value="CURATIVE">Curativo</option>
                    <option value="BIOLOGICAL">Biológico</option>
                    <option value="CULTURAL">Cultural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Nombre del producto"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosis *
                  </label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="ej: 2 ml/L, 500 g/ha"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Aplicación *
                  </label>
                  <input
                    type="text"
                    value={formData.applicationMethod}
                    onChange={(e) => setFormData({ ...formData, applicationMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="ej: Aspersión foliar, Drench"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Programada *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período de Carencia (días) *
                  </label>
                  <input
                    type="number"
                    value={formData.preHarvestInterval}
                    onChange={(e) => setFormData({ ...formData, preHarvestInterval: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  rows={3}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingTreatment ? 'Actualizar' : 'Crear'} Tratamiento
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentManagement;