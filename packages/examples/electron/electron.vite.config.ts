import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
// import vueDevTools from 'vite-plugin-vue-devtools';
import autoprefixer from 'autoprefixer';
// @ts-ignore Module resolution.
import tailwind from 'tailwindcss';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@/renderer': resolve('src/renderer/src'),
        '@/components': resolve('src/renderer/src/components'),
        '@/lib': resolve('src/renderer/src/lib'),
      },
    },
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
    // @ts-ignore Unknown error.
    plugins: [vue() /*, vueDevTools() */],
  },
});
