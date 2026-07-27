import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Deployed at the domain root (user GitHub Pages site), so assets resolve from '/'.
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    // Logos are small enough after optimisation that inlining them would just
    // bloat the HTML; keep them as separate cacheable files.
    assetsInlineLimit: 2048,
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
