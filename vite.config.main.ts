import { builtinModules } from 'module';
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/main/index.ts'),
      fileName: 'node-syphon',
      formats: ['es', 'cjs'],
    },
    minify: 'terser',
    rollupOptions: {
      external: ['bindings', 'node-addon-api', ...builtinModules],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['events'],
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'build/Release/syphon.node',
          dest: 'bin',
        },
      ],
    }),
    dts(),
  ],
});
