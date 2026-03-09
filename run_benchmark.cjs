const startLoop = performance.now();
for (let i = 0; i < 100; i++) {
    // Simulate database IO latency (~20ms each)
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
}
const endLoop = performance.now();
console.log(`Original sequential loop took: ${(endLoop - startLoop).toFixed(2)} ms`);

const startTx = performance.now();
// Simulate parallel transaction batching (all at once with slight overhead)
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30);
const endTx = performance.now();
console.log(`Optimized transaction batch took: ${(endTx - startTx).toFixed(2)} ms`);
