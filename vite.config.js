import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        caseStudies: resolve(__dirname, 'case-studies.html'),
        experience: resolve(__dirname, 'experience.html'),
        credentials: resolve(__dirname, 'credentials.html'),
        skills: resolve(__dirname, 'skills.html')
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  server: {
    port: 5173,
  },
});
