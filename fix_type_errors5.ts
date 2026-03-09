import fs from 'fs';

let filePath = 'api/routes/ai.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "import express from 'express';",
  "import * as express from 'express';"
);

fs.writeFileSync(filePath, code);
