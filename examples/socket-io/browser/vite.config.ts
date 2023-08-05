import { builtinModules } from 'module';
import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const PACKAGE_ROOT = __dirname;

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.MODE,
  // logLevel: 'silent',
  root: PACKAGE_ROOT,
  build: {
    commonjsOptions: {
      ignoreDynamicRequires: false, // true,
    },
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    minify: 'terser',
    rollupOptions: {
      input: path.join(PACKAGE_ROOT, 'index.html'),
      external: [
        'bindings',
        'node-syphon',
        'socket.io',
        'socket.io-client',
        'vue',
        ...builtinModules,
      ],
    },
  },
  plugins: [vue()],
});
