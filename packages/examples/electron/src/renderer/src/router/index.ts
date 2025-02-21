import { MetalDataRoutes, OpenGLDataRoutes } from '@/common/routes';
import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    alias: ['/index.html', OpenGLDataRoutes.client],
    component: () => import('@/components/windows/data/SimpleGLDataClient.vue'),
  },
  {
    path: OpenGLDataRoutes.server,
    component: () => import('@/components/windows/data/SimpleGLDataServer.vue'),
  },
  {
    path: MetalDataRoutes.client,
    component: () => import('@/components/windows/data/SimpleMetalDataClient.vue'),
  },
  {
    path: MetalDataRoutes.server,
    component: () => import('@/components/windows/data/SimpleMetalDataServer.vue'),
  },
  /*
  {
    path: '/web-gpu-client',
    component: () => import('@/components/windows/data/WebGPUClient.vue'),
  },
  {
    path: '/onscreen-server',
    component: () => import('@/components/windows/shared/OnscreenGLServer.vue'),
  },
  {
    path: '/offscreen-server',
    component: () => import('@/components/windows/shared/OffscreenGLServer.vue'),
  },
  */
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
