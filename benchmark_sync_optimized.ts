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

async function runBenchmark() {
  const batchSize = 5;
  const pendingImages = await mockOfflineDB.getAIImagesByStatus('pending');

  const apiRequestFormData = async (method: string, url: string, formData: FormData) => {
    const response = await globalThis.fetch(url, { method, body: formData });
    return await response.json();
  };

  const syncAIImagesBatchAPI = async (action: string, batch: any[]) => {
    const formData = new FormData();
    batch.forEach((data, index) => {
      formData.append('images', data.blob, data.filename);
      formData.append('metadata', JSON.stringify(data.metadata));
      formData.append('analysisStatus', data.analysisStatus);
      formData.append('localIds', data.id.toString());
    });
    return await apiRequestFormData('POST', '/api/ai/images/batch', formData);
  };

  const syncAIImagesBatch = async () => {
    const result = { success: true, syncedItems: 0, failedItems: 0, errors: [] };
    for (let i = 0; i < pendingImages.length; i += batchSize) {
      const batch = pendingImages.slice(i, i + batchSize);
      try {
        const apiResult = await syncAIImagesBatchAPI('create', batch);
        const successfulIds = batch.map(img => img.id!);
        await mockOfflineDB.aiImages.where('id').anyOf(successfulIds).modify({ syncStatus: 'synced' });
        result.syncedItems += batch.length;
      } catch (error) {
        const failedIds = batch.map(img => img.id!);
        await mockOfflineDB.aiImages.where('id').anyOf(failedIds).modify({ syncStatus: 'failed' });
        result.failedItems += batch.length;
      }
      if (i + batchSize < pendingImages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return result;
  };

  const start = performance.now();
  await syncAIImagesBatch();
  const end = performance.now();

  console.log(`Optimized Execution Time: ${(end - start).toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
