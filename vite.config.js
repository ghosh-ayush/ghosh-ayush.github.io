import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // GitHub Pages for this repo serves the master branch root as static files, so
  // the BUILT site has to live at the repo root. That means the source entry
  // cannot also be ./index.html - it lives in app/ instead, and `npm run deploy`
  // copies the build output over the root. See README "Deployment".
  root: path.join(ROOT, 'app'),
  publicDir: path.join(ROOT, 'public'),
  base: '/',
  plugins: [react()],
  build: {
    outDir: path.join(ROOT, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    assetsInlineLimit: 2048,
  },
  server: {
    port: 5173,
    fs: {
      // src/ and portfolio-data.json sit above the Vite root.
      allow: [ROOT],
    },
  },
  preview: {
    port: 4173,
  },
});
