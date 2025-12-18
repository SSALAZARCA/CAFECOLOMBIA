import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit2, Eye, Boxes, Tag, Layers, Calendar, AlertTriangle, Droplet, Truck } from 'lucide-react';
import { offlineDB, ensureOfflineDBReady } from '@/utils/offlineDB';
import type { OfflineInventory } from '@/utils/offlineDB';
import AddInsumoModal from '../components/AddInsumoModal';
import { toast } from 'sonner';

export interface Insumo {
  id: string;
  nombre: string;
  tipo: 'fertilizante' | 'fungicida' | 'herbicida' | 'insecticida' | 'enmienda' | 'otro';
  unidad: 'kg' | 'l' | 'ml' | 'g' | 'unidades' | string;
  cantidad: number;
  lote?: string;
  fechaIngreso: string;
  fechaVencimiento?: string;
  proveedor?: string;
  costoUnitario?: number;
  totalCost?: number;
  diasPorVencer?: number;
  stockStatus?: 'Alto' | 'Medio' | 'Bajo' | 'Crítico';
  ubicacion?: string;
  observaciones?: string;
}

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todas');
  const [filterStock, setFilterStock] = useState('todos');
  const [showUseModal, setShowUseModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await ensureOfflineDBReady();
      } catch (err) {
        console.warn('[Insumos] DB no disponible, usando fallback:', err);
      } finally {
        await loadInsumos();
      }
    })();
  }, []);

  const computeDiasPorVencer = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return undefined;
    const expiry = new Date(fechaVencimiento);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const computeStockStatus = (cantidad: number): Insumo['stockStatus'] => {
    if (cantidad <= 0) return 'Crítico';
    if (cantidad <= 10) return 'Bajo';
    if (cantidad <= 50) return 'Medio';
    return 'Alto';
  };

  const mapInventoryToInsumo = (item: OfflineInventory): Insumo => {
    const fechaIngreso = item.purchaseDate || new Date().toISOString();
    const fechaVencimiento = item.expirationDate || undefined;
    const totalCost = (item.quantity || 0) * (item.unitCost || 0);
    return {
      id: item.id!.toString(),
      nombre: item.name || item.inputId, // Use name if available, fallback to inputId
      tipo: (item.type as any) || 'otro',
      unidad: item.unit,
      cantidad: item.quantity ?? 0,
      lote: item.batchNumber ?? undefined,
      fechaIngreso,
      fechaVencimiento,
      proveedor: item.supplier ?? undefined,
      costoUnitario: item.unitCost ?? undefined,
      totalCost,
      diasPorVencer: computeDiasPorVencer(fechaVencimiento),
      stockStatus: computeStockStatus(item.quantity ?? 0),
      ubicacion: item.location ?? 'Bodega Principal',
      observaciones: item.brand ? `Marca: ${item.brand}` : undefined,
    };
  };

  const loadInsumos = async () => {
    try {
      setLoading(true);
      const items = await offlineDB.inventory.toArray();
      const mapped = items.map(mapInventoryToInsumo);
      setInsumos(mapped);
    } catch (error) {
      console.error('Error cargando insumos:', error);
      // Fallback only if really empty and offline
      const fallback: Insumo[] = [];
      setInsumos(fallback);
    } finally {
      setLoading(false);
    }
  };

  const filteredInsumos = useMemo(() => {
    return insumos.filter((insumo) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        insumo.nombre.toLowerCase().includes(searchLower) ||
        (insumo.proveedor || '').toLowerCase().includes(searchLower) ||
        (insumo.observaciones || '').toLowerCase().includes(searchLower);

      const matchesType = filterType === 'todas' || insumo.tipo === filterType;
      const matchesStock = filterStock === 'todos' || insumo.stockStatus === filterStock;
      return matchesSearch && matchesType && matchesStock;
    });
  }, [insumos, searchTerm, filterType, filterStock]);

  const handleAddInsumo = async (newInsumo: any) => {
    try {
      // Save all details to offlineDB for full offline support
      const id = await offlineDB.inventory.add({
        inputId: newInsumo.name, // Link key (potentially redundant if name is separate)
        name: newInsumo.name,
        type: newInsumo.type,
        brand: newInsumo.brand,
        activeIngredient: newInsumo.activeIngredient,
        concentration: newInsumo.concentration,
        quantity: newInsumo.quantity,
        unit: newInsumo.unit,
        unitCost: newInsumo.unitCost,
        supplier: newInsumo.supplier,
        purchaseDate: newInsumo.purchaseDate,
        expirationDate: newInsumo.expiryDate,
        batchNumber: newInsumo.batchNumber,
        gracePeriodDays: newInsumo.gracePeriodDays,
        location: 'Bodega Principal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pendingSync: true,
        action: 'create'
      });
      await loadInsumos();
      setShowAddModal(false);
      toast.success('Insumo agregado', { description: `${newInsumo.name} fue registrado en inventario` });
    } catch (error) {
      console.error('Error agregando insumo:', error);
      toast.error('Error al agregar insumo');
    }
  };

  const handleInsumoUsage = async (insumoId: string, usedQuantity: number) => {
    try {
      const item = await offlineDB.inventory.get(parseInt(insumoId));
      if (!item) return;
      const newQty = Math.max(0, (item.quantity ?? 0) - usedQuantity);
      await offlineDB.inventory.update(parseInt(insumoId), { quantity: newQty, updatedAt: new Date().toISOString() });
      await loadInsumos();
      toast.success('Uso registrado', { description: `Se registró el uso de ${usedQuantity} ${item.unit || 'unidades'}` });
    } catch (error) {
      console.error('Error registrando uso:', error);
      toast.error('Error al registrar el uso');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Control de Insumos</h1>
            <p className="text-gray-600 mt-2">Gestión de inventario y consumos</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            Agregar Insumo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Insumos</p>
                <p className="text-2xl font-bold text-gray-900">{insumos.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Boxes className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Costo Total</p>
                <p className="text-2xl font-bold text-gray-900">${insumos.reduce((sum, i) => sum + (i.totalCost || 0), 0).toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tipos</p>
                <p className="text-2xl font-bold text-gray-900">{[...new Set(insumos.map(i => i.tipo))].length}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <Layers className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por vencer</p>
                <p className="text-2xl font-bold text-gray-900">{insumos.filter(i => (i.diasPorVencer || 999) < 30).length}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Inventario</h2>
          </div>
          <div className="p-6">
            <div className="flex gap-4 mb-4">
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nombre o proveedor" className="flex-1 border rounded-lg p-2" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-lg p-2">
                <option value="todas">Todas</option>
                <option value="fertilizante">Fertilizantes</option>
                <option value="fungicida">Fungicidas</option>
                <option value="herbicida">Herbicidas</option>
                <option value="insecticida">Insecticidas</option>
                <option value="enmienda">Enmiendas</option>
                <option value="otro">Otros</option>
              </select>
              <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="border rounded-lg p-2">
                <option value="todos">Todos</option>
                <option value="Alto">Alto</option>
                <option value="Medio">Medio</option>
                <option value="Bajo">Bajo</option>
                <option value="Crítico">Crítico</option>
              </select>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredInsumos.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron insumos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInsumos.map((insumo) => (
                  <div key={insumo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{insumo.nombre}</h3>
                        <p className="text-sm text-gray-600">{insumo.tipo} • {insumo.unidad}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Stock: {insumo.cantidad}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Proveedor</p>
                        <p className="font-medium">{insumo.proveedor || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Lote</p>
                        <p className="font-medium">{insumo.lote || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Ingreso</p>
                        <p className="font-medium">{new Date(insumo.fechaIngreso).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vencimiento</p>
                        <p className="font-medium">{insumo.fechaVencimiento ? new Date(insumo.fechaVencimiento).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedInsumo(insumo)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Ver detalle"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { /* futuro: abrir modal edición */ }} className="p-1 text-amber-600 hover:bg-amber-100 rounded" title="Editar"><Edit2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowUseModal(true)} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Usar"><Droplet className="w-4 h-4" /></button>
                        <button onClick={() => setShowQRModal(true)} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="QR"><Truck className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AddInsumoModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAddInsumo} />
      </div>
    </Layout>
  );
}