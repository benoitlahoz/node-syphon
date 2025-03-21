import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/main/universal.ts'),
      fileName: 'node-syphon-universal',
      formats: ['es', 'cjs'],
    },
    minify: 'terser',
  },
  optimizeDeps: {
    exclude: ['events'],
  },
  plugins: [dts()],
});
