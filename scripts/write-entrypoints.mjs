import { copyFileSync } from 'node:fs';

copyFileSync('dist/server/index.js', 'server.js');
copyFileSync('dist/server/index.d.ts', 'server.d.ts');
copyFileSync('dist/client-v2/index.js', 'client-v2.js');
copyFileSync('dist/client-v2/index.d.ts', 'client-v2.d.ts');
