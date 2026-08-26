import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@icons': path.resolve(__dirname, 'src/ui/icons/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 184 hand-drawn glyphs as raw path data. Split out so a screen using
          // three of them does not put all 345kB in the entry bundle.
          'koboyo-icons': ['./src/ui/icons/koboyo-data.ts'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
