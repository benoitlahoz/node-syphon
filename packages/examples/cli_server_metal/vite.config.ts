import { builtinModules } from 'module';
import path from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    minify: 'terser',
    rollupOptions: {
      external: ['node-syphon', ...builtinModules],
    },
    outDir: path.resolve(__dirname, 'dist'),
  },
});
