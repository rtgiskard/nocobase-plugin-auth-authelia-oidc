import esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const packageName = '@nocobase/plugin-auth-oidc-external';

await esbuild.build({
  entryPoints: ['src/client-v2/index.tsx'],
  bundle: true,
  outfile: 'dist/client/index.js',
  format: 'iife',
  globalName: '__NocoBaseExternalOIDCClient',
  platform: 'browser',
  target: ['es2020'],
  external: ['@nocobase/client', '@nocobase/plugin-auth/client', 'antd', 'react', 'react-dom', 'react/jsx-runtime'],
});

const deps = ['@nocobase/client', '@nocobase/plugin-auth/client', 'antd', 'react/jsx-runtime'];
const params = ['nocobaseClient', 'AuthPluginModule', 'antd', 'jsxRuntime'];
const requireShim = [
  '  var require = function(name) {',
  '    if (name === "@nocobase/client") return nocobaseClient;',
  '    if (name === "@nocobase/plugin-auth/client") return AuthPluginModule;',
  '    if (name === "antd") return antd;',
  '    if (name === "react/jsx-runtime") return jsxRuntime;',
  '    throw new Error("Cannot require " + name);',
  '  };',
].join('\n');
const bundle = readFileSync('dist/client/index.js', 'utf8');
writeFileSync(
  'dist/client/index.js',
  `define("${packageName}", ${JSON.stringify(deps)}, function(${params.join(', ')}) {\n${requireShim}\n${bundle}\n  return __NocoBaseExternalOIDCClient;\n});\n`,
);
