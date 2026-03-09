import fs from 'fs';

let filePath = 'src/utils/offlineDB.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "status: 'pendiente' as any | 'syncing' | 'synced' | 'failed'",
  "status: 'pending' | 'syncing' | 'synced' | 'failed'"
);

fs.writeFileSync(filePath, code);
