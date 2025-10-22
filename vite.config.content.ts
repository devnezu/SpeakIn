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
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.tsx'),
      output: {
        entryFileNames: 'content.js',
        assetFileNames: 'index.[ext]',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    minify: false,
    sourcemap: false,
    cssCodeSplit: false,
  },
});
