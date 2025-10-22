import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/index.tsx'),
        popup: resolve(__dirname, 'src/popup/index.tsx'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return '[name].js';
        },
        assetFileNames: 'index.[ext]',
        format: 'iife',
        // Prevent code splitting - inline everything into entry chunks
        inlineDynamicImports: false,
      },
      // Prevent Vite from creating shared chunks
      external: [],
    },
    minify: false,
    sourcemap: false,
    cssCodeSplit: false,
    // Force single chunk per entry
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
