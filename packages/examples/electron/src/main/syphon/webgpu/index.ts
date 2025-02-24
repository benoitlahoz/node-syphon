// https://github.com/electron/electron/pull/42001#issuecomment-2089032620
// https://github.com/electron/electron/pull/42001#issuecomment-2144319975
// https://stackoverflow.com/questions/77411785/inrterop-between-webgl2-and-webgpu

import { BrowserWindow } from 'electron';
import { WebGPUOffscreenRoutes } from '@/common/routes';
import { createWindow } from '../../window';

let clientWindow: BrowserWindow;

export const createWebGPUOffscreen = () => {
  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.close();
    clientWindow.destroy();
  }

  clientWindow = createWindow(WebGPUOffscreenRoutes.client, 900, 600);
};
