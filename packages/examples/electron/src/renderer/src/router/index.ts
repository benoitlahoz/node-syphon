import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    alias: '/index.html',
    component: () => import('@/components/windows/SimpleClient.vue'),
  },
  {
    path: '/server',
    component: () => import('@/components/windows/SimpleServer.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
