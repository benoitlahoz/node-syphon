import { builtinModules } from 'module';
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/server-directory.process/index.ts'),
      fileName: 'server-directory-process',
      formats: ['es', 'cjs'], // Was working in Electron dev with cjs.
    },
    minify: 'terser',
    rollupOptions: {
      external: ['bindings', 'node-addon-api', 'findup-sync', ...builtinModules],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [dts()],
});
