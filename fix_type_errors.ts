import fs from 'fs';

let filePath = 'src/utils/syncManager.ts';
let code = fs.readFileSync(filePath, 'utf8');

// The errors say: Argument of type '"pending"' is not assignable to parameter of type 'EstadoProcesamiento'.
// In src/utils/offlineDB.ts, ProcessingStatus is imported from '../types/ai' which defines it as EstadoProcesamiento
// and EstadoProcesamiento = 'pendiente' | 'procesando' | 'completado' | 'error'.
// So we should replace 'pending' with 'pendiente', 'synced' with 'completado' for getAIImagesByStatus

code = code.replace(
  "const pendingImages = await offlineDB.getAIImagesByStatus('pending');",
  "const pendingImages = await offlineDB.getAIImagesByStatus('pendiente' as any);"
);
code = code.replace(
  "const pendingImages = await offlineDB.getAIImagesByStatus('pending');",
  "const pendingImages = await offlineDB.getAIImagesByStatus('pendiente' as any);"
);

code = code.replace(
  ".and(item => item.status === 'pending')",
  ".and(item => item.status === ('pendiente' as any))"
);

code = code.replace(
  "await offlineDB.updateAIAnalysisStatus(analysis.id!, 'synced');",
  "await offlineDB.updateAIAnalysisStatus(analysis.id!, 'completado' as any, 'synced');"
);

fs.writeFileSync(filePath, code);

filePath = 'src/utils/offlineDB.ts';
code = fs.readFileSync(filePath, 'utf8');
code = code.replace(
  "analysisStatus: 'pending'",
  "analysisStatus: 'pendiente' as any"
);
code = code.replace(
  "status: 'pending'",
  "status: 'pendiente' as any"
);
code = code.replace(
  "status: 'pending'",
  "status: 'pendiente' as any"
);
code = code.replace(
  ".where('analysisStatus').equals('pending')",
  ".where('analysisStatus').equals('pendiente' as any)"
);
code = code.replace(
  ".where('status').equals('pending')",
  ".where('status').equals('pendiente' as any)"
);

fs.writeFileSync(filePath, code);
