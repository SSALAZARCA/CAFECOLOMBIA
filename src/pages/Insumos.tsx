import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import AddInsumoModal from '@/components/AddInsumoModal';
import UseInsumoModal from '@/components/UseInsumoModal';
import DashboardBodega from '@/components/DashboardBodega';
import GracePeriodAlerts from '@/components/GracePeriodAlerts';
import QRCodeModal from '@/components/QRCodeModal';
import CostCalculator from '@/components/CostCalculator';
import { offlineDB } from '@/utils/offlineDB';
import { toast } from 'sonner';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Beaker,
  Leaf,
  Bug,
  Zap,
  Droplets,
  BarChart3,
  List,
  Clock,
  QrCode,
  Calculator,
  Loader2
} from 'lucide-react';

interface Insumo {
  id: string;
  name: string;
  type: 'FERTILIZANTE' | 'PESTICIDA' | 'FUNGICIDA' | 'HERBICIDA' | 'ABONO_ORGANICO' | 'OTRO';
  brand: string;
  activeIngredient: string;
  concentration: string;
  unit: string;
  gracePeriodDays: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  purchaseDate: string;
  expiryDate: string;
  supplier: string;
  batchNumber: string;
  isActive: boolean;
  stockStatus: 'ALTO' | 'MEDIO' | 'BAJO' | 'AGOTADO';
  daysToExpiry: number;
}

const mockInsumos: Insumo[] = [
  {
    id: '1',
    name: 'Urea 46%',
    type: 'FERTILIZANTE',
    brand: 'Yara',
    activeIngredient: 'Nitrógeno',
    concentration: '46%',
    unit: 'kg',
    gracePeriodDays: 0,
    quantity: 250,
    unitCost: 2500,
    totalCost: 625000,
    purchaseDate: '2024-01-15',
    expiryDate: '2025-01-15',
    supplier: 'Agroquímicos del Valle',
    batchNumber: 'YR2024001',
    isActive: true,
    stockStatus: 'ALTO',
    daysToExpiry: 45
  },
  {
    id: '2',
    name: 'Roundup',
    type: 'HERBICIDA',
    brand: 'Bayer',
    activeIngredient: 'Glifosato',
    concentration: '48%',
    unit: 'L',
    gracePeriodDays: 21,
    quantity: 5,
    unitCost: 45000,
    totalCost: 225000,
    purchaseDate: '2024-01-20',
    expiryDate: '2025-06-20',
    supplier: 'Distribuidora Agrícola',
    batchNumber: 'BY2024002',
    isActive: true,
    stockStatus: 'BAJO',
    daysToExpiry: 180
  },
  {
    id: '3',
    name: 'Compost Orgánico',
    type: 'ABONO_ORGANICO',
    brand: 'EcoFinca',
    activeIngredient: 'Materia Orgánica',
    concentration: '85%',
    unit: 'kg',
    gracePeriodDays: 0,
    quantity: 1000,
    unitCost: 800,
    totalCost: 800000,
    purchaseDate: '2024-02-01',
    expiryDate: '2025-02-01',
    supplier: 'Abonos Naturales SAS',
    batchNumber: 'EF2024003',
    isActive: true,
    stockStatus: 'ALTO',
    daysToExpiry: 90
  },
  {
    id: '4',
    name: 'Fungicida Sistémico',
    type: 'FUNGICIDA',
    brand: 'Syngenta',
    activeIngredient: 'Tebuconazol',
    concentration: '25%',
    unit: 'L',
    gracePeriodDays: 14,
    quantity: 2,
    unitCost: 85000,
    totalCost: 170000,
    purchaseDate: '2024-01-25',
    expiryDate: '2024-12-25',
    supplier: 'Agroquímicos del Valle',
    batchNumber: 'SY2024004',
    isActive: true,
    stockStatus: 'BAJO',
    daysToExpiry: 15
  }
];

const typeIcons = {
  FERTILIZANTE: Leaf,
  PESTICIDA: Bug,
  FUNGICIDA: Droplets,
  HERBICIDA: Zap,
  ABONO_ORGANICO: Beaker,
  OTRO: Package
};

const typeColors = {
  FERTILIZANTE: 'bg-green-100 text-green-800',
  PESTICIDA: 'bg-red-100 text-red-800',
  FUNGICIDA: 'bg-blue-100 text-blue-800',
  HERBICIDA: 'bg-yellow-100 text-yellow-800',
  ABONO_ORGANICO: 'bg-emerald-100 text-emerald-800',
  OTRO: 'bg-gray-100 text-gray-800'
};

const stockColors = {
  ALTO: 'bg-green-100 text-green-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  BAJO: 'bg-orange-100 text-orange-800',
  AGOTADO: 'bg-red-100 text-red-800'
};

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventario' | 'carencia' | 'costos'>('dashboard');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedInsumoForQR, setSelectedInsumoForQR] = useState<Insumo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);

  // Cargar datos de la base de datos offline
  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    try {
      setLoading(true);
      const inventoryFromDB = await offlineDB.inventory.toArray();
      
      // Convertir los datos de la DB al formato esperado por el componente
      const insumosFormateados = inventoryFromDB.map(item => {
        const expiryDate = item.expirationDate ? new Date(item.expirationDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const today = new Date();
        const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determinar estado del stock
        let stockStatus: 'ALTO' | 'MEDIO' | 'BAJO' | 'AGOTADO' = 'ALTO';
        if (item.quantity === 0) stockStatus = 'AGOTADO';
        else if (item.quantity <= 10) stockStatus = 'BAJO';
        else if (item.quantity <= 50) stockStatus = 'MEDIO';

        // Mapear tipo de insumo
        const typeMapping: { [key: string]: 'FERTILIZANTE' | 'PESTICIDA' | 'FUNGICIDA' | 'HERBICIDA' | 'ABONO_ORGANICO' | 'OTRO' } = {
          'Fertilizante': 'FERTILIZANTE',
          'Pesticida': 'PESTICIDA',
          'Fungicida': 'FUNGICIDA',
          'Herbicida': 'HERBICIDA',
          'Abono Orgánico': 'ABONO_ORGANICO'
        };

        return {
          id: item.id!.toString(),
          name: item.inputId,
          type: typeMapping[item.inputId.split(' ')[0]] || 'OTRO',
          brand: item.supplier,
          activeIngredient: item.inputId,
          concentration: '100%',
          unit: item.unit,
          gracePeriodDays: 0,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
          purchaseDate: item.purchaseDate,
          expiryDate: item.expirationDate || '',
          supplier: item.supplier,
          batchNumber: item.batchNumber || '',
          isActive: true,
          stockStatus,
          daysToExpiry
        };
      });

      setInsumos(insumosFormateados);
    } catch (error) {
      console.error('Error cargando insumos:', error);
      toast.error('Error al cargar el inventario de insumos');
    } finally {
      setLoading(false);
    }
  };

  const filteredInsumos = insumos.filter(insumo => {
    const matchesSearch = insumo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insumo.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insumo.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || insumo.type === selectedType;
    const matchesStock = !selectedStock || insumo.stockStatus === selectedStock;
    
    return matchesSearch && matchesType && matchesStock;
  });

  const totalValue = insumos.reduce((sum, insumo) => sum + insumo.totalCost, 0);
  const lowStockCount = insumos.filter(insumo => insumo.stockStatus === 'BAJO' || insumo.stockStatus === 'AGOTADO').length;
  const expiringCount = insumos.filter(insumo => insumo.daysToExpiry <= 30).length;

  const handleAddInsumo = async (newInsumo: Omit<Insumo, 'id'>) => {
    try {
      // Agregar a la base de datos offline
      await offlineDB.inventory.add({
        inputId: newInsumo.name,
        quantity: newInsumo.quantity,
        unit: newInsumo.unit,
        unitCost: newInsumo.unitCost,
        supplier: newInsumo.supplier,
        purchaseDate: newInsumo.purchaseDate,
        expirationDate: newInsumo.expiryDate,
        batchNumber: newInsumo.batchNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Recargar la lista de insumos
      await loadInsumos();
      setShowAddModal(false);
      toast.success('Insumo agregado exitosamente');
    } catch (error) {
      console.error('Error agregando insumo:', error);
      toast.error('Error al agregar el insumo');
    }
  };

  const handleUseInsumo = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    setShowUseModal(true);
  };

  const handleInsumoUsage = async (usage: any) => {
    try {
      const insumo = insumos.find(i => i.id === usage.insumoId);
      if (!insumo) return;

      const newQuantity = Math.max(0, insumo.quantity - usage.quantityUsed);
      
      // Actualizar en la base de datos
      await offlineDB.inventory.update(parseInt(usage.insumoId), {
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      });

      // Recargar la lista de insumos
      await loadInsumos();
      setShowUseModal(false);
      setSelectedInsumo(null);
      toast.success('Uso de insumo registrado exitosamente');
    } catch (error) {
      console.error('Error usando insumo:', error);
      toast.error('Error al registrar el uso del insumo');
    }
  };

  const handleShowQR = (insumo: Insumo) => {
    setSelectedInsumoForQR(insumo);
    setShowQRModal(true);
  };

  const handleEditInsumo = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setShowEditModal(true);
  };

  const handleUpdateInsumo = async (updatedInsumo: Omit<Insumo, 'id'>) => {
    try {
      if (!editingInsumo) return;

      // Actualizar en la base de datos offline
      await offlineDB.inventory.update(parseInt(editingInsumo.id), {
        inputId: updatedInsumo.name,
        quantity: updatedInsumo.quantity,
        unit: updatedInsumo.unit,
        unitCost: updatedInsumo.unitCost,
        supplier: updatedInsumo.supplier,
        purchaseDate: updatedInsumo.purchaseDate,
        expirationDate: updatedInsumo.expiryDate,
        batchNumber: updatedInsumo.batchNumber,
        updatedAt: new Date().toISOString()
      });

      // Recargar la lista de insumos
      await loadInsumos();
      setShowEditModal(false);
      setEditingInsumo(null);
      toast.success('Insumo actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando insumo:', error);
      toast.error('Error al actualizar el insumo');
    }
  };

  // Mostrar indicador de carga
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-600" />
            <p className="text-gray-600">Cargando inventario de insumos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de Insumos y Bodega</h1>
            <p className="text-gray-600">Gestión completa del inventario de insumos agrícolas</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Insumo
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('inventario')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'inventario'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <List className="w-4 h-4 inline mr-2" />
              Inventario
            </button>
            <button
              onClick={() => setActiveTab('carencia')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'carencia'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Períodos de Carencia
            </button>
            <button
              onClick={() => setActiveTab('costos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'costos'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calculator className="w-4 h-4 inline mr-2" />
              Análisis de Costos
            </button>
          </nav>
        </div>

        {/* Contenido según la pestaña activa */}
        {activeTab === 'dashboard' ? (
          <DashboardBodega insumos={insumos} />
        ) : activeTab === 'carencia' ? (
          <GracePeriodAlerts />
        ) : activeTab === 'costos' ? (
          <CostCalculator insumos={insumos} />
        ) : (
          <>
            {/* Resumen de Bodega */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Insumos</p>
                <p className="text-2xl font-bold text-gray-900">{insumos.length}</p>
              </div>
              <Package className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Inventario</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Vencer</p>
                <p className="text-2xl font-bold text-red-600">{expiringCount}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, marca o ingrediente activo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="FERTILIZANTE">Fertilizantes</option>
                <option value="PESTICIDA">Pesticidas</option>
                <option value="FUNGICIDA">Fungicidas</option>
                <option value="HERBICIDA">Herbicidas</option>
                <option value="ABONO_ORGANICO">Abonos Orgánicos</option>
                <option value="OTRO">Otros</option>
              </select>

              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Todos los stocks</option>
                <option value="ALTO">Stock Alto</option>
                <option value="MEDIO">Stock Medio</option>
                <option value="BAJO">Stock Bajo</option>
                <option value="AGOTADO">Agotado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Insumos */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Insumo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInsumos.map((insumo) => {
                  const TypeIcon = typeIcons[insumo.type];
                  return (
                    <tr key={insumo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TypeIcon className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{insumo.name}</div>
                            <div className="text-sm text-gray-500">{insumo.brand} - {insumo.activeIngredient}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeColors[insumo.type]}`}>
                          {insumo.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockColors[insumo.stockStatus]} mr-2`}>
                            {insumo.stockStatus}
                          </span>
                          <span className="text-sm text-gray-900">{insumo.quantity} {insumo.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {insumo.gracePeriodDays > 0 ? `${insumo.gracePeriodDays} días` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(insumo.expiryDate).toLocaleDateString()}</div>
                        <div className={`text-xs ${insumo.daysToExpiry <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                          {insumo.daysToExpiry} días restantes
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${insumo.totalCost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleShowQR(insumo)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Generar QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditInsumo(insumo)}
                            className="text-amber-600 hover:text-amber-900"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleUseInsumo(insumo)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={insumo.stockStatus === 'AGOTADO'}
                          >
                            Usar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredInsumos.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron insumos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Intenta ajustar los filtros o agregar nuevos insumos al inventario.
            </p>
          </div>
        )}
          </>
        )}

        {/* Modal para agregar insumo */}
        <AddInsumoModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddInsumo}
        />

        {/* Modal para usar insumo */}
        <UseInsumoModal
          isOpen={showUseModal}
          onClose={() => {
            setShowUseModal(false);
            setSelectedInsumo(null);
          }}
          onSave={handleInsumoUsage}
          insumo={selectedInsumo}
        />

        {/* Modal para QR Code */}
        {selectedInsumoForQR && (
          <QRCodeModal
            isOpen={showQRModal}
            onClose={() => {
              setShowQRModal(false);
              setSelectedInsumoForQR(null);
            }}
            insumo={selectedInsumoForQR}
          />
        )}

        {/* Modal para editar insumo */}
        <AddInsumoModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingInsumo(null);
          }}
          onSave={handleUpdateInsumo}
          initialData={editingInsumo ? {
            name: editingInsumo.name,
            type: editingInsumo.type,
            brand: editingInsumo.brand,
            activeIngredient: editingInsumo.activeIngredient,
            concentration: editingInsumo.concentration,
            unit: editingInsumo.unit,
            gracePeriodDays: editingInsumo.gracePeriodDays,
            quantity: editingInsumo.quantity,
            unitCost: editingInsumo.unitCost,
            totalCost: editingInsumo.totalCost,
            purchaseDate: editingInsumo.purchaseDate,
            expiryDate: editingInsumo.expiryDate,
            supplier: editingInsumo.supplier,
            batchNumber: editingInsumo.batchNumber,
            isActive: editingInsumo.isActive,
            stockStatus: editingInsumo.stockStatus,
            daysToExpiry: editingInsumo.daysToExpiry
          } : undefined}
        />
      </div>
    </Layout>
  );
}