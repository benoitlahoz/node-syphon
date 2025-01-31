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
    path: '/metal-server',
    component: () => import('@/components/windows/SimpleMetalServer.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
