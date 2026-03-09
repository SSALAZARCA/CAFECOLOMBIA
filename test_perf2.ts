import { performance } from 'perf_hooks';

// Setup Mock Environment for Local Dexie Database & Fetch
// Real Dexie uses IndexedDB which runs on main thread and sequential queries have major overhead compared to bulk
const LATENCY = {
  HTTP: 100, // API request latency
  DB_WRITE: 15, // Single row write
  DB_BULK: 20 // Bulk write overhead
};

const BATCH_SIZE = 10;
const BATCH_COUNT = 5;

async function apiRequestFormData() {
    await new Promise(r => setTimeout(r, LATENCY.HTTP));
    return { success: true };
}
async function dbWrite() {
    // Note: in Dexie, sequential updates in a Promise.all execute sequentially underneath due to IndexedDB queueing,
    // so 10 parallel updates takes ~10 * 15ms
    await new Promise(r => setTimeout(r, LATENCY.DB_WRITE));
}
async function dbBulkWrite() {
    await new Promise(r => setTimeout(r, LATENCY.DB_BULK));
}

async function runOriginal() {
    const start = performance.now();
    for (let i = 0; i < BATCH_COUNT; i++) {
        // Original creates an array of promises and awaits them
        const batchPromises = Array.from({length: BATCH_SIZE}, async () => {
            await apiRequestFormData();
            // Since JS is single-threaded and IndexedDB txs are queued, multiple calls will effectively sequentialize writes
            // We simulate this by awaiting sequentially if doing multiple writes
        });
        await Promise.allSettled(batchPromises);
        // Add DB execution overhead linearly since it's queued sequentially in Dexie
        for (let j = 0; j < BATCH_SIZE; j++) {
            await dbWrite();
        }
    }
    const end = performance.now();
    return end - start;
}

async function runOptimized() {
    const start = performance.now();
    for (let i = 0; i < BATCH_COUNT; i++) {
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
