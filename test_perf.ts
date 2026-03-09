import { performance } from 'perf_hooks';

// Setup Mock Environment
const LATENCY = {
  HTTP: 100, // API request latency
  DB_WRITE: 15, // Single row write
  DB_BULK: 20 // Bulk write
};

const images = Array.from({length: 50}, (_, i) => ({
    id: i,
    blob: new Blob(['data']),
    filename: `img${i}.jpg`,
    metadata: {},
    analysisStatus: 'pending'
}));
const batchSize = 10;

async function apiRequestFormData() {
    await new Promise(r => setTimeout(r, LATENCY.HTTP));
    return { success: true };
}
async function dbWrite() {
    await new Promise(r => setTimeout(r, LATENCY.DB_WRITE));
}
async function dbBulkWrite() {
    await new Promise(r => setTimeout(r, LATENCY.DB_BULK));
}

async function runOriginal() {
    const start = performance.now();
    for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);
        const batchPromises = batch.map(async (image) => {
            await apiRequestFormData();
            await dbWrite();
        });
        await Promise.allSettled(batchPromises);
    }
    const end = performance.now();
    return end - start;
}

async function runOptimized() {
    const start = performance.now();
    for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);
        await apiRequestFormData(); // one request per batch
        await dbBulkWrite(); // one write per batch
    }
    const end = performance.now();
    return end - start;
}

async function test() {
    const origTime = await runOriginal();
    const optTime = await runOptimized();

    console.log(`Original Time: ${origTime.toFixed(2)}ms`);
    console.log(`Optimized Time: ${optTime.toFixed(2)}ms`);
    console.log(`Improvement: ${((origTime - optTime) / origTime * 100).toFixed(2)}%`);
}

test();
