import { ipcMain, webContents } from 'electron';
import {
  SyphonServerDescription,
  SyphonServerDescriptionUUIDKey,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel,
} from 'node-syphon';
import type { SyphonGLFrameDTO } from '@/types';
import { ElectronSyphonGLClient } from './modules/electron-syphon.gl-client';

let directory: SyphonServerDirectory;
let client: ElectronSyphonGLClient;

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
      console.log('Server announce', server);
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
      console.log('Server retire', server);
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
        console.log(`No server to connect with uuid '${uuid}'.`);
        return false;
      }

      if (!client) {
        client = new ElectronSyphonGLClient();
      }
      client.connect(server);

      return true;
    },
  );

  directory.listen();
};
