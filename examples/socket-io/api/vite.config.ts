import { builtinModules } from 'module';
import path from 'node:path';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: 'example-socket-io-server',
      formats: ['es', 'cjs'],
    },
    minify: 'terser',
    rollupOptions: {
      external: [
        'bindings',
        'node-syphon',
        'socket.io',
        'socket.io-client',
        'vue',
        ...builtinModules,
      ],
    },
    outDir: path.resolve(__dirname, 'dist'),
  },
  plugins: [globals(), builtins()],
});
