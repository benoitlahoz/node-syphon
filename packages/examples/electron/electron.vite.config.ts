import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
// import vueDevTools from 'vite-plugin-vue-devtools';
import autoprefixer from 'autoprefixer';
// @ts-ignore Module resolution.
import tailwind from 'tailwindcss';

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@/common': resolve('src/common'),
      },
    },
    plugins: [
      externalizeDepsPlugin({
        exclude: ['electron-window-rtc'],
      }),
    ],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@/common': resolve('src/common'),
        '@/renderer': resolve('src/renderer/src'),
        '@/components': resolve('src/renderer/src/components'),
        '@/composables': resolve('src/renderer/src/composables'),
        '@/assets': resolve('src/renderer/src/assets'),
        '@/lib': resolve('src/renderer/src/lib'),
      },
    },
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
    // @ts-ignore Unknown error.
    plugins: [vue(), svgLoader() /*, vueDevTools() */],
  },
});
