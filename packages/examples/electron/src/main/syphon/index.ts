// import os from 'os';
// import fs from 'fs';
import { join } from 'path';
import { BrowserWindow, ipcMain, screen } from 'electron';
import {
  SyphonOpenGLServer,
  SyphonServerDescription,
  SyphonServerDescriptionUUIDKey,
} from 'node-syphon';
import { ElectronSyphonDirectory } from './modules/electron-syphon.directory';
import { ElectronSyphonGLClient } from './modules/opengl-data/electron-syphon.gl-client';
import { ElectronSyphonGLServer } from './modules/opengl-data/electron-syphon.gl-server';
import { ElectronSyphonMetalServer } from './modules/metal-data/electron-syphon.metal-server';
import { ElectronSyphonMetalClient } from './modules/metal-data/electron-syphon.metal-client';

let directory: ElectronSyphonDirectory;

let glDataClient: ElectronSyphonGLClient | null;
let glDataServer: ElectronSyphonGLServer | null;
let metalDataClient: ElectronSyphonMetalClient | null;
let metalDataServer: ElectronSyphonMetalServer | null;

let offscreenWindow: BrowserWindow | null;
let offscreenServer: SyphonOpenGLServer | null;

export const bootstrapSyphon = () => {
  setupDirectory();
};

export const closeSyphon = (closeDirectory = true) => {
  if (closeDirectory) directory.dispose();

  closeGLDataClient();
  closeGLDataServer();
  closeMetalDataClient();
  closeMetalDataServer();
  closeOffscreenServer();
};

export const closeGLDataClient = () => {
  if (glDataClient) {
    glDataClient.dispose();
    glDataClient = null;
  }
};

export const closeGLDataServer = () => {
  if (glDataServer) {
    glDataServer.dispose();
    glDataServer = null;
  }
};

export const closeMetalDataClient = () => {
  if (metalDataClient) {
    metalDataClient.dispose();
    metalDataClient = null;
  }
};

export const closeMetalDataServer = () => {
  if (metalDataServer) {
    metalDataServer.dispose();
    metalDataServer = null;
  }
};

export const closeOffscreenServer = () => {
  if (offscreenServer) {
    offscreenServer.dispose();
    offscreenServer = null;
  }

  if (offscreenWindow) {
    offscreenWindow.close();
    offscreenWindow = null;
  }
};

// https://stackoverflow.com/questions/55994212/how-use-the-returned-buffer-of-electronjs-function-getnativewindowhandle-i
/*
function getNativeWindowHandle_Int(win) {
  let hbuf = win.getNativeWindowHandle();

  if (os.endianness() == 'LE') {
    console.log('ENDIAN LE');
    return hbuf.readInt32LE();
  } else {
    console.log('ENDIAN BE');
    return hbuf.readInt32BE();
  }
}
*/
export const createTextureServer = () => {
  offscreenWindow = new BrowserWindow({
    width: 1920 / screen.getPrimaryDisplay().scaleFactor,
    height: 1080 / screen.getPrimaryDisplay().scaleFactor,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false,
      backgroundThrottling: false,
      offscreen: {
        useSharedTexture: true,
      },
    },
  });

  offscreenWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/offscreen-server`);
  // const textureServer = new ElectronSyphonGLServer('Handle');
  offscreenServer = new SyphonOpenGLServer('Handle');
  offscreenWindow.webContents.on('paint', (event: any, _size: any, _image) => {
    const tex = event.texture;
    if (offscreenServer && tex) {
      const handle = tex.textureInfo.sharedTextureHandle;

      // FIXME: Buffer is cloned and can't access IOSurfaceRef.
      /*
      textureServer.publishSurfaceHandle({
        texture: handle,
        width: tex.textureInfo.codedSize.width,
        height: tex.textureInfo.codedSize.height,
      });
      */

      offscreenServer.publishSurfaceHandle(
        handle,
        'GL_TEXTURE_RECTANGLE_EXT',
        tex.textureInfo.visibleRect,
        tex.textureInfo.codedSize,
        true,
      );

      tex.release();
    }
  });
};

const setupDirectory = () => {
  directory = new ElectronSyphonDirectory();

  ipcMain.handle('get-servers', async (_event: Electron.IpcMainInvokeEvent) => {
    return directory.servers;
  });

  ipcMain.handle(
    'connect-server',

    //  TODO: type for SyphonServerDescriptionUUIDKey, etc. in 'node-syphon'.

    async (_event: Electron.IpcMainInvokeEvent, uuid: string, type: 'metal' | 'gl') => {
      const server = directory.servers.find(
        (description: SyphonServerDescription) =>
          (description[SyphonServerDescriptionUUIDKey] = uuid),
      );

      if (!server) {
        return new Error(`No server to connect with uuid '${uuid}'.`);
      }

      switch (type) {
        // FIXME: Not disposed correctly when switching from renderer. Frames are still flowing.

        case 'gl': {
          if (metalDataClient) {
            metalDataClient.dispose();
            metalDataClient = null;
          }

          if (!glDataClient) {
            glDataClient = new ElectronSyphonGLClient();
          }
          glDataClient.connect(server);
          break;
        }
        case 'metal': {
          if (glDataClient) {
            console.log('Will dispose GL, switching to metal');
            glDataClient.dispose();
            glDataClient = null;
          }

          if (!metalDataClient) {
            metalDataClient = new ElectronSyphonMetalClient();
          }
          metalDataClient.connect(server);
          break;
        }
      }

      return server;
    },
  );

  // Client will pull the frame at its own pace (requestAnimationFrame).
  ipcMain.handle('get-frame', (_event: Electron.IpcMainInvokeEvent, uuid: string) => {
    if (!glDataClient && !metalDataClient) {
      return new Error(`Trying to get a frame from a client that is not connected.`);
    }

    if (glDataClient) {
      if (glDataClient.serverUUID !== uuid) {
        return new Error(
          `Connected server is not the same as the one from which a frame is requested.`,
        );
      }

      return glDataClient.frame;
    } else if (metalDataClient) {
      if (metalDataClient.serverUUID !== uuid) {
        return new Error(
          `Connected server is not the same as the one from which a frame is requested.`,
        );
      }

      return metalDataClient.frame;
    }

    return;
  });

  ipcMain.handle(
    'create-server',
    (_event: Electron.IpcMainInvokeEvent, name: string, type: 'metal' | 'gl' | 'osr') => {
      switch (type) {
        case 'gl': {
          if (!glDataServer) {
            glDataServer = new ElectronSyphonGLServer(name);
          }
          break;
        }
        case 'metal': {
          if (!metalDataServer) {
            metalDataServer = new ElectronSyphonMetalServer(name);
          }
          break;
        }
        case 'osr': {
          if (!offscreenServer) {
            console.log('TEXXXX');
            createTextureServer();
          }
          break;
        }
      }

      return true;
    },
  );

  ipcMain.handle(
    'publish-frame-gl',
    (
      _event: Electron.IpcMainInvokeEvent,
      frame: { data: Uint8ClampedArray; width: number; height: number },
    ) => {
      glDataServer!.publishImageData(frame);
      return true;
    },
  );

  ipcMain.handle(
    'publish-frame-metal',
    (
      _event: Electron.IpcMainInvokeEvent,
      frame: { data: Uint8ClampedArray; width: number; height: number },
    ) => {
      metalDataServer!.publishImageData(frame);
      return true;
    },
  );

  directory.listen();
};
