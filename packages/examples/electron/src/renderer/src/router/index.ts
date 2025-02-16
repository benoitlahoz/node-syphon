import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    alias: '/index.html',
    component: () => import('@/components/windows/shared/WebGPUClient.vue'),
  },
  {
    path: '/gl-client',
    component: () => import('@/components/windows/data/SimpleGLClient.vue'),
  },
  {
    path: '/gl-server',
    component: () => import('@/components/windows/data/SimpleGLServer.vue'),
  },
  {
    path: '/metal-client',
    component: () => import('@/components/windows/data/SimpleMetalClient.vue'),
  },
  {
    path: '/metal-server',
    component: () => import('@/components/windows/data/SimpleMetalServer.vue'),
  },
  {
    path: '/onscreen-server',
    component: () => import('@/components/windows/shared/OnscreenGLServer.vue'),
  },
  {
    path: '/offscreen-server',
    component: () => import('@/components/windows/shared/OffscreenGLServer.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
