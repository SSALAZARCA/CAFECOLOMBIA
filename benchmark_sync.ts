import { performance } from 'perf_hooks';

// Mock dependencies
globalThis.fetch = async (url: string, options: any) => {
  // Simulate network latency (200ms)
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    ok: true,
    json: async () => ({ success: true, message: 'Mock response' }),
    status: 200,
    statusText: 'OK'
  } as any;
};

// We will mock offlineDB before importing syncManager so that the import uses our mock
const mockOfflineDB = {
  aiImages: {
    update: async (id: number, data: any) => {
      // Simulate db latency (10ms)
      await new Promise(resolve => setTimeout(resolve, 10));
      return 1;
    },
    where: (field: string) => ({
      anyOf: (keys: any[]) => ({
        modify: async (changes: any) => {
          // Simulate bulk update latency (15ms for the whole batch)
          await new Promise(resolve => setTimeout(resolve, 15));
          return keys.length;
        }
      })
    })
  },
  getAIImagesByStatus: async (status: string) => {
    // Return 20 mock images
    const images = [];
    for (let i = 1; i <= 20; i++) {
      images.push({
        id: i,
        serverId: `srv_${i}`,
        filename: `image_${i}.jpg`,
        blob: new Blob(['mock data'], { type: 'image/jpeg' }),
        metadata: { captureDate: new Date() },
        analysisStatus: 'pending'
      });
    }
    return images;
  }
};

// We need to override the import of offlineDB in syncManager.ts
// For a simple benchmark, we can just load the file as a module and replace offlineDB
// However, since it's an ES module, we'll use a hack or just copy the relevant function logic

async function runBenchmark() {
  // Copying the original logic to test it directly without dealing with module mocking complexities
  const batchSize = 5;
  const pendingImages = await mockOfflineDB.getAIImagesByStatus('pending');

  const apiRequestFormData = async (method: string, url: string, formData: FormData) => {
    const response = await globalThis.fetch(url, { method, body: formData });
    return await response.json();
  };

  const syncAIImage = async (action: string, data: any) => {
    const formData = new FormData();
    formData.append('image', data.blob, data.filename);
    formData.append('metadata', JSON.stringify(data.metadata));
    formData.append('analysisStatus', data.analysisStatus);
    await apiRequestFormData('POST', '/api/ai/images', formData);
  };

  const syncAIImagesBatch = async () => {
    const result = { success: true, syncedItems: 0, failedItems: 0, errors: [] };
    for (let i = 0; i < pendingImages.length; i += batchSize) {
      const batch = pendingImages.slice(i, i + batchSize);
      const batchPromises = batch.map(async (image) => {
        try {
          await syncAIImage('create', image);
          await mockOfflineDB.aiImages.update(image.id!, { syncStatus: 'synced' });
          return { success: true, image };
        } catch (error) {
          await mockOfflineDB.aiImages.update(image.id!, { syncStatus: 'failed' });
          return { success: false, image, error };
        }
      });
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled' && promiseResult.value.success) {
          result.syncedItems++;
        }
      });
      // Original logic has a pause
      if (i + batchSize < pendingImages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return result;
  };

  const start = performance.now();
  await syncAIImagesBatch();
  const end = performance.now();

  console.log(`Baseline Execution Time: ${(end - start).toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
