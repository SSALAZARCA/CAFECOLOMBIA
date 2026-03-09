import fs from 'fs';

let filePath = 'src/utils/syncManager.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/\(import\.meta as any\)\.env\?\.DEV/g, "false");
fs.writeFileSync(filePath, code);
