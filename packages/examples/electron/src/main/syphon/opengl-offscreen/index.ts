import type { WebContentsPaintEventParams } from 'electron';
import { BrowserWindow } from 'electron';
import { SyphonOpenGLServer } from 'node-syphon';
import { OpenGLOffscreenRoutes } from '@/common/routes';
import { createOffscreenWindow, createWindow } from '../../window';

let clientWindow: BrowserWindow;
let serverWindow: BrowserWindow;

let server: SyphonOpenGLServer;

export const createOpenGLOffscreen = () => {
  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.close();
    clientWindow.destroy();
  }

  clientWindow = createWindow(OpenGLOffscreenRoutes.client, 400, 100);
  serverWindow = createOffscreenWindow(OpenGLOffscreenRoutes.server);
  server = new SyphonOpenGLServer('OpenGL Offscreen');

  clientWindow.on('close', () => {
    server.dispose();
  });

  serverWindow.webContents.on('paint', handlePaint);
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
