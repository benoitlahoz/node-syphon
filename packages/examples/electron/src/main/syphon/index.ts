import { ipcMain, webContents } from 'electron';
import {
  SyphonServerDescription,
  SyphonServerDescriptionUUIDKey,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel,
} from 'node-syphon';
import { ElectronSyphonDirectory } from './modules/electron-syphon.directory';
import { ElectronSyphonGLClient } from './modules/electron-syphon.gl-client';
import { ElectronSyphonGLServer } from './modules/electron-syphon.gl-server';
import { ElectronSyphonMetalServer } from './modules/electron-syphon.metal-server';
import { ElectronSyphonMetalClient } from './modules/electron-syphon.metal-client';

let directory: ElectronSyphonDirectory;

let glClient: ElectronSyphonGLClient | null;
let glServer: ElectronSyphonGLServer | null;

let metalClient: ElectronSyphonMetalClient | null;
let metalServer: ElectronSyphonMetalServer | null;

export const bootstrapSyphon = () => {
  setupDirectory();
};

export const closeSyphon = () => {
  directory.dispose();

  if (glClient) {
    glClient.dispose();
  }
  if (metalClient) {
    metalClient.dispose();
  }
  if (glServer) {
    glServer.dispose();
  }
  if (metalServer) {
    metalServer.dispose();
  }
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
          if (metalClient) {
            metalClient.dispose();
            metalClient = null;
          }

          if (!glClient) {
            glClient = new ElectronSyphonGLClient();
          }
          glClient.connect(server);
          break;
        }
        case 'metal': {
          if (glClient) {
            console.log('Will dispose GL, switching to metal');
            glClient.dispose();
            glClient = null;
          }

          if (!metalClient) {
            metalClient = new ElectronSyphonMetalClient();
          }
          metalClient.connect(server);
          break;
        }
      }

      return server;
    },
  );

  // Client will pull the frame at its own pace (requestAnimationFrame).
  ipcMain.handle('get-frame', (_event: Electron.IpcMainInvokeEvent, uuid: string) => {
    if (!glClient && !metalClient) {
      return new Error(`Trying to get a frame from a client that is not connected.`);
    }

    if (glClient) {
      if (glClient.serverUUID !== uuid) {
        return new Error(
          `Connected server is not the same as the one from which a frame is requested.`,
        );
      }

      return glClient.frame;
    } else if (metalClient) {
      if (metalClient.serverUUID !== uuid) {
        return new Error(
          `Connected server is not the same as the one from which a frame is requested.`,
        );
      }

      return metalClient.frame;
    }

    return;
  });

  ipcMain.handle(
    'create-server',
    (_event: Electron.IpcMainInvokeEvent, name: string, type: 'metal' | 'gl') => {
      switch (type) {
        case 'gl': {
          if (!glServer) {
            glServer = new ElectronSyphonGLServer(name);
          }
          break;
        }
        case 'metal': {
          if (!metalServer) {
            metalServer = new ElectronSyphonMetalServer(name);
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
      glServer!.publishImageData(frame);
      return true;
    },
  );

  ipcMain.handle(
    'publish-frame-metal',
    (
      _event: Electron.IpcMainInvokeEvent,
      frame: { data: Uint8ClampedArray; width: number; height: number },
    ) => {
      metalServer!.publishImageData(frame);
      return true;
    },
  );

  directory.listen();
};
