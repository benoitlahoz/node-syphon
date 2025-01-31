import { ipcMain, webContents } from 'electron';
import {
  SyphonServerDescription,
  SyphonServerDescriptionUUIDKey,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel,
} from 'node-syphon';
import { ElectronSyphonGLClient } from './modules/electron-syphon.gl-client';
import { ElectronSyphonGLServer } from './modules/electron-syphon.gl-server';
import { ElectronSyphonMetalServer } from './modules/electron-syphon.metal-server';

let directory: SyphonServerDirectory;

let glClient: ElectronSyphonGLClient;
let glServer: ElectronSyphonGLServer;

let metalServer: ElectronSyphonMetalServer;

export const bootstrapSyphon = () => {
  setupDirectory();
};

export const closeSyphon = () => {
  directory.dispose();
};

const setupDirectory = () => {
  directory = new SyphonServerDirectory();

  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
    (message: any) => {
      console.log('Received info', message);
      const contents = webContents.getAllWebContents();
      for (const webContent of contents) {
        webContent.send(SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification, {
          message,
          servers: directory.servers,
        });
      }
    },
  );

  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification,
    (message: any) => {
      console.log('Received error', message);
      const contents = webContents.getAllWebContents();
      for (const webContent of contents) {
        webContent.send(SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification, {
          message,
          servers: directory.servers,
        });
      }
    },
  );

  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
    (server: any) => {
      const contents = webContents.getAllWebContents();
      for (const webContent of contents) {
        webContent.send(SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification, {
          server,
          servers: directory.servers,
        });
      }
    },
  );

  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
    (server: any) => {
      const contents = webContents.getAllWebContents();
      for (const webContent of contents) {
        webContent.send(SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification, {
          server,
          servers: directory.servers,
        });
      }
    },
  );

  ipcMain.handle('get-servers', async (_event: Electron.IpcMainInvokeEvent) => {
    return directory.servers;
  });

  ipcMain.handle(
    'connect-server',

    //  TODO: type for SyphonServerDescriptionUUIDKey in 'node-syphon'.

    async (_event: Electron.IpcMainInvokeEvent, uuid: string) => {
      const server = directory.servers.find(
        (description: SyphonServerDescription) =>
          (description[SyphonServerDescriptionUUIDKey] = uuid),
      );

      if (!server) {
        return new Error(`No server to connect with uuid '${uuid}'.`);
      }

      if (!glClient) {
        glClient = new ElectronSyphonGLClient();
      }
      glClient.connect(server);

      return server;
    },
  );

  // Client will pull the frame at its own pace (requestAnimationFrame).
  ipcMain.handle('get-frame', (_event: Electron.IpcMainInvokeEvent, uuid: string) => {
    if (!glClient) {
      return new Error(`Trying to get a frame from a client that is not connected.`);
    }

    if (glClient.serverUUID !== uuid) {
      return new Error(
        `Connected server is not the same as the one from which a frame is requested.`,
      );
    }

    return glClient.frame;
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
      glServer.publishImageData(frame);
      return true;
    },
  );

  ipcMain.handle(
    'publish-frame-metal',
    (
      _event: Electron.IpcMainInvokeEvent,
      frame: { data: Uint8ClampedArray; width: number; height: number },
    ) => {
      metalServer.publishImageData(frame);
      return true;
    },
  );

  directory.listen();
};
