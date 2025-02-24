import {
  MetalDataRoutes,
  OpenGLDataRoutes,
  OpenGLOffscreenRoutes,
  WebGPUOffscreenRoutes,
  WebRTCOffscreenRoutes,
} from '@/common/routes';
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
  {
    path: OpenGLOffscreenRoutes.client,
    component: () => import('@/components/windows/offscreen/OffscreenGLServerDescription.vue'),
  },
  {
    path: OpenGLOffscreenRoutes.server,
    component: () => import('@/components/windows/offscreen/OffscreenGLServer.vue'),
  },
  {
    path: WebRTCOffscreenRoutes.client,
    component: () => import('@/components/windows/offscreen/WebRTCSender.vue'),
  },
  {
    path: WebRTCOffscreenRoutes.server,
    component: () => import('@/components/windows/offscreen/WebRTCReceiver.vue'),
  },
  {
    path: WebGPUOffscreenRoutes.client,
    component: () => import('@/components/windows/offscreen/WebGPUServer.vue'),
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
