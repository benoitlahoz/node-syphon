import { ipcMain, webContents } from 'electron';
import {
  SyphonServerDescription,
  SyphonServerDescriptionUUIDKey,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel,
} from 'node-syphon';
import { ElectronSyphonGLClient } from './modules/electron-syphon.gl-client';
import { ElectronSyphonGLServer } from './modules/electron-syphon.gl-server';

let directory: SyphonServerDirectory;
let client: ElectronSyphonGLClient;
let server: ElectronSyphonGLServer;

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

      if (!client) {
        client = new ElectronSyphonGLClient();
      }
      client.connect(server);

      return server;
    },
  );

  // Client will pull the frame at its own pace (requestAnimationFrame).
  ipcMain.handle('get-frame', (_event: Electron.IpcMainInvokeEvent, uuid: string) => {
    if (!client) {
      return new Error(`Trying to get a frame from a client that is not connected.`);
    }

    if (client.serverUUID !== uuid) {
      return new Error(
        `Connected server is not the same as the one from which a frame is requested.`,
      );
    }

    return client.frame;
  });

  ipcMain.handle('create-server', (_event: Electron.IpcMainInvokeEvent, name: string) => {
    console.log('Create server', name);
    if (!server) {
      server = new ElectronSyphonGLServer(name);
    }
    return true;
  });

  ipcMain.handle(
    'publish-frame',
    (
      _event: Electron.IpcMainInvokeEvent,
      frame: { data: Uint8ClampedArray; width: number; height: number },
    ) => {
      server.publishFrameData(frame);
      return true;
    },
  );

  directory.listen();
};
