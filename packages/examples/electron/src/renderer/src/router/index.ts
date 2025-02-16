import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    alias: '/index.html',
    component: () => import('@/components/windows/SimpleGLClient.vue'),
  },
  {
    path: '/gl-server',
    component: () => import('@/components/windows/SimpleGLServer.vue'),
  },
  {
    path: '/metal-client',
    component: () => import('@/components/windows/SimpleMetalClient.vue'),
  },
  {
    path: '/metal-server',
    component: () => import('@/components/windows/SimpleMetalServer.vue'),
  },
  {
    path: '/offscreen-server',
    component: () => import('@/components/windows/OffscreenGLServer.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
