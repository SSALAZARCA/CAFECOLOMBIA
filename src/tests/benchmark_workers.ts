import 'fake-indexeddb/auto';
import { offlineDB, ensureOfflineDBReady } from '../utils/offlineDB';

async function runBenchmark() {
    await ensureOfflineDBReady();

    // Clear tables
    await offlineDB.lots.clear();
    await offlineDB.collections.clear();

    // Populate data
    console.log('Populating DB for benchmark...');
    const lots = [];
    for (let i = 1; i <= 50; i++) {
        lots.push({ id: i, name: `Lote ${i}`, farmId: '1', area: 1, variety: 'Castillo', plantingDate: '2020-01-01', status: 'ACTIVE' });
    }
    await offlineDB.lots.bulkAdd(lots);

    const collections = [];
    for (let i = 1; i <= 500; i++) {
        collections.push({
            id: i,
            workerId: 1,
            lotId: (i % 50) + 1, // Random-ish lot from 1 to 50
            quantityKg: 10,
            method: 'MANUAL',
            collectionDate: new Date().toISOString()
        });
    }
    await offlineDB.collections.bulkAdd(collections);

    console.log(`Inserted ${lots.length} lots and ${collections.length} collections.`);

    const workerCollections = await offlineDB.collections.where('workerId').equals(1).toArray();

    // Baseline: N+1 queries
    console.log('Running baseline (Promise.all with individual .get)...');
    const startBaseline = performance.now();
    for (let run = 0; run < 10; run++) {
        const historyWithNames1 = await Promise.all(workerCollections.map(async (c) => {
            const lot = await offlineDB.lots.get(c.lotId);
            return {
                id: c.id!.toString(),
                lotName: lot ? lot.name : 'Lote desconocido'
            };
        }));
    }
    const endBaseline = performance.now();
    const baselineTime = (endBaseline - startBaseline) / 10;
    console.log(`Baseline avg time: ${baselineTime.toFixed(2)}ms per 500 items`);

    // Optimized: bulkGet
    console.log('Running optimized (bulkGet)...');
    const startOptimized = performance.now();
    for (let run = 0; run < 10; run++) {
        const uniqueLotIds = [...new Set(workerCollections.map(c => c.lotId))];
        const fetchedLots = await offlineDB.lots.bulkGet(uniqueLotIds);

        const lotMap = new Map();
        fetchedLots.forEach((lot, index) => {
            if (lot) {
                lotMap.set(uniqueLotIds[index], lot);
            }
        });

        const historyWithNames2 = workerCollections.map((c) => {
            const lot = lotMap.get(c.lotId);
            return {
                id: c.id!.toString(),
                lotName: lot ? lot.name : 'Lote desconocido'
            };
        });
    }
    const endOptimized = performance.now();
    const optimizedTime = (endOptimized - startOptimized) / 10;
    console.log(`Optimized avg time: ${optimizedTime.toFixed(2)}ms per 500 items`);
    console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x`);

    process.exit(0);
}

runBenchmark().catch(console.error);
