import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/server/index.ts', 'src/client-v2/index.tsx'],
  external: [
    '@nocobase/auth',
    '@nocobase/client',
    '@nocobase/plugin-auth',
    '@nocobase/server',
    'antd',
    'react',
    'react-dom',
    'react/jsx-runtime',
  ],
  format: ['cjs'],
  noExternal: ['openid-client'],
  outDir: 'dist',
  splitting: false,
});
