import fs from 'fs';

let filePath = 'src/utils/syncManager.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/getAIImagesByStatus\('pending'\)/g, "getAIImagesByStatus('pendiente' as any)");
code = code.replace(/getAIImagesByStatus\('pendiente' as any\)/g, "getAIImagesByStatus('pendiente' as any)");
code = code.replace(/status === 'pending'/g, "status === ('pendiente' as any)");
code = code.replace(/updateAIAnalysisStatus\(analysis.id!, 'synced'\)/g, "updateAIAnalysisStatus(analysis.id!, 'completado' as any, 'synced')");

code = code.replace(/import.meta.env.DEV/g, "(import.meta as any).env?.DEV");
fs.writeFileSync(filePath, code);

filePath = 'src/utils/offlineDB.ts';
code = fs.readFileSync(filePath, 'utf8');
code = code.replace(/analysisStatus: 'pending'/g, "analysisStatus: 'pendiente' as any");
code = code.replace(/status: 'pending'/g, "status: 'pendiente' as any");
code = code.replace(/equals\('pending'\)/g, "equals('pendiente' as any)");
code = code.replace(/status === 'completed'/g, "status === ('completado' as any)");
code = code.replace(/status === 'failed'/g, "status === ('error' as any)");

fs.writeFileSync(filePath, code);
