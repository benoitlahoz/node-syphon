import type { WebContentsPaintEventParams } from 'electron';
import { BrowserWindow, app, screen } from 'electron';
import { SyphonOpenGLServer } from 'node-syphon';
import { WindowRTCMain } from 'electron-window-rtc';
import { WebRTCOffscreenRoutes } from '@/common/routes';
import { createOffscreenWindow, createWindow } from '../../window';

let clientWindow: BrowserWindow;
let serverWindow: BrowserWindow;

let server: SyphonOpenGLServer;

export const createWebRTCOffscreen = () => {
  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.close();
    clientWindow.destroy();
  }

  serverWindow = createOffscreenWindow(WebRTCOffscreenRoutes.server, 900, 600);
  clientWindow = createWindow(WebRTCOffscreenRoutes.client);

  WindowRTCMain.register('OffscreenRendererController', clientWindow);
  WindowRTCMain.register('OffscreenRenderer', serverWindow);

  server = new SyphonOpenGLServer('OpenGL WebRTC Offscreen');

  clientWindow.on('resize', () => {
    if (clientWindow && serverWindow && !serverWindow.isDestroyed()) {
      const clientSize = clientWindow.getSize();

      const width = clientSize[0] / screen.getPrimaryDisplay().scaleFactor;
      const height = clientSize[1] / screen.getPrimaryDisplay().scaleFactor;

      serverWindow.setSize(Math.round(width), Math.round(height));
    }
  });

  clientWindow.on('close', () => {
    server.dispose();

    // WindowRTCMain.unregister('OffscreenRendererController');
    // WindowRTCMain.unregister('OffscreenRenderer');
  });

  serverWindow.webContents.on('paint', handlePaint);

  app.on('before-quit', () => {
    // TODO: isRegistered in electron-window-rtc.
    // WindowRTCMain.dispose();
  });
};

const handlePaint = (event: WebContentsPaintEventParams) => {
  const texture = event.texture;

  if (server && texture) {
    const handle = texture.textureInfo.sharedTextureHandle;

    server.publishSurfaceHandle(
      handle,
      'GL_TEXTURE_RECTANGLE_EXT',
      texture.textureInfo.visibleRect,
      texture.textureInfo.codedSize,
      true,
    );

    texture.release();
  }
};
