// Datos de ejemplo para la aplicación CaféColombia
import { offlineDB } from './offlineDB';

export const sampleData = {
  lots: [
    {
      serverId: 'lot-001',
      name: 'Lote El Mirador',
      area: 2.5,
      farmId: 'farm-001',
      variety: 'Caturra',
      plantingDate: '2020-03-15',
      status: 'Producción',
      coordinates: '2.9273,-75.2819',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'lot-002',
      name: 'Lote La Esperanza',
      area: 3.2,
      farmId: 'farm-001',
      variety: 'Colombia',
      plantingDate: '2019-08-20',
      status: 'Producción',
      coordinates: '2.9283,-75.2829',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'lot-003',
      name: 'Lote San José',
      area: 1.8,
      farmId: 'farm-001',
      variety: 'Castillo',
      plantingDate: '2021-01-10',
      status: 'Desarrollo',
      coordinates: '2.9263,-75.2809',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'lot-004',
      name: 'Lote Santa Rosa',
      area: 4.1,
      farmId: 'farm-001',
      variety: 'Geisha',
      plantingDate: '2018-11-05',
      status: 'Producción',
      coordinates: '2.9293,-75.2839',
      lastSync: new Date(),
      pendingSync: false
    }
  ],

  inventory: [
    {
      serverId: 'inv-001',
      inputId: 'fertilizer-npk',
      quantity: 50,
      unit: 'kg',
      expirationDate: '2025-06-30',
      location: 'Bodega Principal',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'inv-002',
      inputId: 'insecticide-cypermethrin',
      quantity: 5,
      unit: 'L',
      expirationDate: '2024-12-15',
      location: 'Bodega Químicos',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'inv-003',
      inputId: 'fungicide-copper',
      quantity: 25,
      unit: 'kg',
      expirationDate: '2025-03-20',
      location: 'Bodega Químicos',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'inv-004',
      inputId: 'fertilizer-organic',
      quantity: 100,
      unit: 'kg',
      expirationDate: '2024-08-10',
      location: 'Bodega Principal',
      lastSync: new Date(),
      pendingSync: false
    }
  ],

  tasks: [
    {
      serverId: 'task-001',
      title: 'Aplicar fertilizante NPK',
      description: 'Aplicación de fertilizante NPK en Lote El Mirador según cronograma',
      type: 'Fertilización',
      status: 'Pendiente',
      dueDate: '2024-01-20',
      lotId: 'lot-001',
      assignedTo: 'Juan Pérez',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'task-002',
      title: 'Monitoreo de broca',
      description: 'Inspección semanal de broca del café en todos los lotes',
      type: 'Monitoreo',
      status: 'En Progreso',
      dueDate: '2024-01-18',
      lotId: 'lot-002',
      assignedTo: 'María González',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'task-003',
      title: 'Poda de cafetos',
      description: 'Poda de mantenimiento en Lote San José',
      type: 'Mantenimiento',
      status: 'Completada',
      dueDate: '2024-01-15',
      lotId: 'lot-003',
      assignedTo: 'Carlos Rodríguez',
      completedAt: '2024-01-15T10:30:00Z',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'task-004',
      title: 'Cosecha selectiva',
      description: 'Recolección de café maduro en Lote Santa Rosa',
      type: 'Cosecha',
      status: 'Pendiente',
      dueDate: '2024-01-25',
      lotId: 'lot-004',
      assignedTo: 'Ana López',
      lastSync: new Date(),
      pendingSync: false
    }
  ],

  pestMonitoring: [
    {
      serverId: 'pest-001',
      lotId: 'lot-001',
      pestType: 'Broca del café',
      severity: 'Bajo',
      affectedArea: 0.2,
      observationDate: '2024-01-15',
      notes: 'Incidencia mínima, continuar monitoreo',
      photos: [],
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'pest-002',
      lotId: 'lot-002',
      pestType: 'Roya del café',
      severity: 'Medio',
      affectedArea: 0.8,
      observationDate: '2024-01-14',
      notes: 'Aplicar tratamiento preventivo',
      photos: [],
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'pest-003',
      lotId: 'lot-004',
      pestType: 'Minador de la hoja',
      severity: 'Alto',
      affectedArea: 1.2,
      observationDate: '2024-01-16',
      notes: 'Requiere tratamiento inmediato',
      photos: [],
      lastSync: new Date(),
      pendingSync: false
    }
  ],

  harvests: [
    {
      serverId: 'harvest-001',
      lotId: 'lot-001',
      date: '2024-01-10',
      quantity: 150,
      quality: 'Premium',
      notes: 'Café cereza bien maduro',
      weather: 'Soleado',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'harvest-002',
      lotId: 'lot-002',
      date: '2024-01-12',
      quantity: 200,
      quality: 'Estándar',
      notes: 'Mezcla de cerezas maduras y semi-maduras',
      weather: 'Parcialmente nublado',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'harvest-003',
      lotId: 'lot-004',
      date: '2024-01-14',
      quantity: 300,
      quality: 'Premium',
      notes: 'Excelente calidad, café especial',
      weather: 'Soleado',
      lastSync: new Date(),
      pendingSync: false
    }
  ],

  expenses: [
    {
      serverId: 'expense-001',
      description: 'Compra fertilizante NPK',
      amount: 125000,
      category: 'Insumos',
      date: '2024-01-05',
      lotId: 'lot-001',
      receipt: 'REC-001',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'expense-002',
      description: 'Mano de obra cosecha',
      amount: 80000,
      category: 'Mano de obra',
      date: '2024-01-10',
      lotId: 'lot-001',
      receipt: 'REC-002',
      lastSync: new Date(),
      pendingSync: false
    },
    {
      serverId: 'expense-003',
      description: 'Insecticida para broca',
      amount: 45000,
      category: 'Insumos',
      date: '2024-01-08',
      lotId: 'lot-002',
      receipt: 'REC-003',
      lastSync: new Date(),
      pendingSync: false
    }
  ]
};

// Función para inicializar la base de datos con datos de ejemplo
export async function initializeSampleData() {
  try {
    console.log('🌱 Inicializando datos de ejemplo...');

    // Verificar si ya hay datos
    const existingLots = await offlineDB.lots.count();
    if (existingLots > 0) {
      console.log('✅ La base de datos ya contiene datos');
      return;
    }

    // Agregar datos de ejemplo
    await offlineDB.transaction('rw', [
      offlineDB.lots,
      offlineDB.inventory,
      offlineDB.tasks,
      offlineDB.pestMonitoring,
      offlineDB.harvests,
      offlineDB.expenses
    ], async () => {
      await offlineDB.lots.bulkAdd(sampleData.lots);
      await offlineDB.inventory.bulkAdd(sampleData.inventory);
      await offlineDB.tasks.bulkAdd(sampleData.tasks);
      await offlineDB.pestMonitoring.bulkAdd(sampleData.pestMonitoring);
      await offlineDB.harvests.bulkAdd(sampleData.harvests);
      await offlineDB.expenses.bulkAdd(sampleData.expenses);
    });

    console.log('✅ Datos de ejemplo agregados exitosamente');
    console.log(`📊 Agregados: ${sampleData.lots.length} lotes, ${sampleData.tasks.length} tareas, ${sampleData.inventory.length} insumos`);

  } catch (error) {
    console.error('❌ Error inicializando datos de ejemplo:', error);
  }
}

// Función para limpiar todos los datos
export async function clearAllData() {
  try {
    await offlineDB.transaction('rw', [
      offlineDB.lots,
      offlineDB.inventory,
      offlineDB.tasks,
      offlineDB.pestMonitoring,
      offlineDB.harvests,
      offlineDB.expenses,
      offlineDB.syncQueue
    ], async () => {
      await offlineDB.lots.clear();
      await offlineDB.inventory.clear();
      await offlineDB.tasks.clear();
      await offlineDB.pestMonitoring.clear();
      await offlineDB.harvests.clear();
      await offlineDB.expenses.clear();
      await offlineDB.syncQueue.clear();
    });
    
    console.log('🗑️ Todos los datos han sido eliminados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  }
}