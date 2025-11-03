import { useState } from 'react';
import { X, Save, Package } from 'lucide-react';

interface AddInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (insumo: any) => void;
}

export default function AddInsumoModal({ isOpen, onClose, onSave }: AddInsumoModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'FERTILIZANTE',
    brand: '',
    activeIngredient: '',
    concentration: '',
    unit: 'kg',
    gracePeriodDays: 0,
    quantity: 0,
    unitCost: 0,
    purchaseDate: '',
    expiryDate: '',
    supplier: '',
    batchNumber: '',
    minStock: 10,
    maxStock: 100
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.brand.trim()) newErrors.brand = 'La marca es requerida';
    if (!formData.activeIngredient.trim()) newErrors.activeIngredient = 'El ingrediente activo es requerido';
    if (!formData.concentration.trim()) newErrors.concentration = 'La concentración es requerida';
    if (formData.quantity <= 0) newErrors.quantity = 'La cantidad debe ser mayor a 0';
    if (formData.unitCost <= 0) newErrors.unitCost = 'El costo unitario debe ser mayor a 0';
    if (!formData.purchaseDate) newErrors.purchaseDate = 'La fecha de compra es requerida';
    if (!formData.expiryDate) newErrors.expiryDate = 'La fecha de vencimiento es requerida';
    if (!formData.supplier.trim()) newErrors.supplier = 'El proveedor es requerido';
    if (!formData.batchNumber.trim()) newErrors.batchNumber = 'El número de lote es requerido';

    // Validate dates
    if (formData.purchaseDate && formData.expiryDate) {
      const purchaseDate = new Date(formData.purchaseDate);
      const expiryDate = new Date(formData.expiryDate);
      if (expiryDate <= purchaseDate) {
        newErrors.expiryDate = 'La fecha de vencimiento debe ser posterior a la fecha de compra';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const totalCost = formData.quantity * formData.unitCost;
    const purchaseDate = new Date(formData.purchaseDate);
    const expiryDate = new Date(formData.expiryDate);
    const daysToExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    let stockStatus: 'ALTO' | 'MEDIO' | 'BAJO' | 'AGOTADO' = 'ALTO';
    if (formData.quantity === 0) stockStatus = 'AGOTADO';
    else if (formData.quantity <= formData.minStock) stockStatus = 'BAJO';
    else if (formData.quantity <= (formData.minStock + formData.maxStock) / 2) stockStatus = 'MEDIO';

    const newInsumo = {
      id: Date.now().toString(),
      ...formData,
      totalCost,
      daysToExpiry,
      stockStatus,
      isActive: true
    };

    onSave(newInsumo);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      type: 'FERTILIZANTE',
      brand: '',
      activeIngredient: '',
      concentration: '',
      unit: 'kg',
      gracePeriodDays: 0,
      quantity: 0,
      unitCost: 0,
      purchaseDate: '',
      expiryDate: '',
      supplier: '',
      batchNumber: '',
      minStock: 10,
      maxStock: 100
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900">Agregar Nuevo Insumo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Insumo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Urea 46%"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Insumo *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="FERTILIZANTE">Fertilizante</option>
                  <option value="PESTICIDA">Pesticida</option>
                  <option value="FUNGICIDA">Fungicida</option>
                  <option value="HERBICIDA">Herbicida</option>
                  <option value="ABONO_ORGANICO">Abono Orgánico</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.brand ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Yara, Bayer, Syngenta"
                />
                {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingrediente Activo *
                </label>
                <input
                  type="text"
                  name="activeIngredient"
                  value={formData.activeIngredient}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.activeIngredient ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Nitrógeno, Glifosato"
                />
                {errors.activeIngredient && <p className="text-red-500 text-xs mt-1">{errors.activeIngredient}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concentración *
                </label>
                <input
                  type="text"
                  name="concentration"
                  value={formData.concentration}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.concentration ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 46%, 25%"
                />
                {errors.concentration && <p className="text-red-500 text-xs mt-1">{errors.concentration}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período de Carencia (días)
                </label>
                <input
                  type="number"
                  name="gracePeriodDays"
                  value={formData.gracePeriodDays}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Información de Inventario */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Inventario</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="L">Litros (L)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="mL">Mililitros (mL)</option>
                  <option value="unidad">Unidades</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario *
                </label>
                <input
                  type="number"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.unitCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.unitCost && <p className="text-red-500 text-xs mt-1">{errors.unitCost}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Máximo
                </label>
                <input
                  type="number"
                  name="maxStock"
                  value={formData.maxStock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Información de Compra */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Compra</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Compra *
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.purchaseDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor *
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.supplier ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre del proveedor"
                />
                {errors.supplier && <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Lote *
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.batchNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Número de lote del producto"
                />
                {errors.batchNumber && <p className="text-red-500 text-xs mt-1">{errors.batchNumber}</p>}
              </div>
            </div>
          </div>

          {/* Resumen de Costos */}
          {formData.quantity > 0 && formData.unitCost > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Resumen de Costos</h4>
              <div className="text-sm text-amber-700">
                <p>Cantidad: {formData.quantity} {formData.unit}</p>
                <p>Costo unitario: ${formData.unitCost.toLocaleString()}</p>
                <p className="font-semibold">Costo total: ${(formData.quantity * formData.unitCost).toLocaleString()}</p>
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar Insumo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}