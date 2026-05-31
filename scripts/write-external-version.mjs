import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const externalPackages = ['@nocobase/auth', '@nocobase/client', '@nocobase/plugin-auth', '@nocobase/server', 'antd', 'react', 'react-dom'];

const versions = Object.fromEntries(
  externalPackages.map((packageName) => [packageName, require(`${packageName}/package.json`).version]),
);

writeFileSync('dist/externalVersion.js', `module.exports = ${JSON.stringify(versions, null, 2)};\n`);
