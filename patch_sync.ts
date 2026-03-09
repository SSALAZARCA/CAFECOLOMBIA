import fs from 'fs';

const filePath = 'src/utils/syncManager.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Add syncAIImagesBatchAPI method
const apiMethod = `
  private async syncAIImagesBatchAPI(action: string, batch: any[]): Promise<any> {
    const endpoint = '/api/ai/images/batch';

    switch (action) {
      case 'create':
        const formData = new FormData();
        batch.forEach((data, index) => {
          formData.append('images', data.blob, data.filename);
          // Send metadata corresponding to the index
          formData.append('metadata', JSON.stringify(data.metadata));
          formData.append('analysisStatus', data.analysisStatus);
          formData.append('localIds', data.id.toString());
        });

        return await this.apiRequestFormData('POST', endpoint, formData);
      default:
        throw new Error(\`Batch action \${action} not supported\`);
    }
  }
`;

// Insert it before syncAIImagesBatch
code = code.replace(
  "  // Sincronizar imágenes por lotes para optimizar rendimiento\n  async syncAIImagesBatch(batchSize: number = 5): Promise<SyncResult> {",
  apiMethod + "\n  // Sincronizar imágenes por lotes para optimizar rendimiento\n  async syncAIImagesBatch(batchSize: number = 5): Promise<SyncResult> {"
);

// Modify syncAIImagesBatch body
const oldBatchLogic = `      // Procesar en lotes
      for (let i = 0; i < pendingImages.length; i += batchSize) {
        const batch = pendingImages.slice(i, i + batchSize);

        // Procesar lote en paralelo
        const batchPromises = batch.map(async (image) => {
          try {
            await this.syncAIImage('create', image);
            await offlineDB.aiImages.update(image.id!, { syncStatus: 'synced' });
            return { success: true, image };
          } catch (error) {
            console.error(\`[SyncManager] Failed to sync image \${image.id}:\`, error);
            await offlineDB.aiImages.update(image.id!, { syncStatus: 'failed' });
            return { success: false, image, error };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((promiseResult, index) => {
          if (promiseResult.status === 'fulfilled') {
            const { success } = promiseResult.value;
            if (success) {
              result.syncedItems++;
            } else {
              result.failedItems++;
              result.errors.push(\`Image \${batch[index].filename}: \${promiseResult.value.error}\`);
            }
          } else {
            result.failedItems++;
            result.errors.push(\`Image \${batch[index].filename}: \${promiseResult.reason}\`);
          }
        });

        // Pausa entre lotes para no sobrecargar el servidor
        if (i + batchSize < pendingImages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }`;

const newBatchLogic = `      // Procesar en lotes
      for (let i = 0; i < pendingImages.length; i += batchSize) {
        const batch = pendingImages.slice(i, i + batchSize);

        try {
          const apiResult = await this.syncAIImagesBatchAPI('create', batch);

          // Suponiendo que apiResult devuelve una lista de resultados por cada imagen
          // Si todo el batch falló o tuvo éxito:
          const successfulIds = batch.map(img => img.id!);

          // Actualizar lote en Dexie
          await offlineDB.aiImages.where('id').anyOf(successfulIds).modify({ syncStatus: 'synced' });

          result.syncedItems += batch.length;
        } catch (error) {
          console.error('[SyncManager] Failed to sync images batch:', error);
          const failedIds = batch.map(img => img.id!);
          await offlineDB.aiImages.where('id').anyOf(failedIds).modify({ syncStatus: 'failed' });

          result.failedItems += batch.length;
          result.errors.push(\`Batch failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
        }

        // Pausa entre lotes para no sobrecargar el servidor
        if (i + batchSize < pendingImages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }`;

code = code.replace(oldBatchLogic, newBatchLogic);

fs.writeFileSync(filePath, code);
