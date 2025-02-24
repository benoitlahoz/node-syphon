import type { IpcMainInvokeEvent } from 'electron';
import { BrowserWindow, ipcMain } from 'electron';
import { SyphonServerDescription, SyphonServerDescriptionUUIDKey } from 'node-syphon';
import { MetalDataRoutes } from '@/common/routes';
import { MetalDataChannels } from '@/common/channels';
import {
  DisconnectedClientFrameError,
  NotSameServerError,
  ServerNotExistError,
} from '@/common/errors';
import type { ElectronSyphonDirectory } from '../electron-syphon.directory';
import { ElectronSyphonMetalClient } from './electron-syphon.metal-client';
import { ElectronSyphonMetalServer } from './electron-syphon.metal-server';
import { createWindow } from '../../window';

let clientWindow: BrowserWindow;
let serverWindow: BrowserWindow;

let directory: ElectronSyphonDirectory;

let client: ElectronSyphonMetalClient | null;
let server: ElectronSyphonMetalServer | null;

export const createMetalDataClient = (serverDirectory: ElectronSyphonDirectory) => {
  if (!directory) directory = serverDirectory;

  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.close();
    clientWindow.destroy();
  }

  ipcMain.handle(MetalDataChannels.ConnectServer, handleConnectServer);
  ipcMain.handle(MetalDataChannels.PullFrame, handlePullFrame);
  ipcMain.on(MetalDataChannels.OpenServerWindow, handleOpenServerWindow);

  clientWindow = createWindow(MetalDataRoutes.client);
  clientWindow.on('close', () => {
    ipcMain.removeHandler(MetalDataChannels.ConnectServer);
    ipcMain.removeHandler(MetalDataChannels.PullFrame);
    ipcMain.removeListener(MetalDataChannels.OpenServerWindow, handleOpenServerWindow);
    if (client) {
      client.dispose();
      client = null;
    }
  });
};

const createMetalDataServer = (serverDirectory?: ElectronSyphonDirectory) => {
  if (!directory && serverDirectory) directory = serverDirectory;

  if (serverWindow && !serverWindow.isDestroyed()) {
    serverWindow.close();
    serverWindow.destroy();
  }

  ipcMain.handle(MetalDataChannels.CreateServer, handleCreateServer);
  ipcMain.handle(MetalDataChannels.PublishFrame, handlePublishData);
  ipcMain.handle(MetalDataChannels.DestroyServer, handleDestroyServer);

  serverWindow = createWindow(MetalDataRoutes.server);
  serverWindow.on('close', () => {
    ipcMain.removeHandler(MetalDataChannels.CreateServer);
    ipcMain.removeHandler(MetalDataChannels.PublishFrame);
    ipcMain.removeHandler(MetalDataChannels.DestroyServer);
    if (server) {
      server.dispose();
      server = null;
    }
  });
};

// ------------------------------------------------ //
// ---------------- Client handlers --------------- //
// ------------------------------------------------ //

const handleConnectServer = async (_event: IpcMainInvokeEvent, uuid: string) => {
  const existing = directory.servers.find(
    (description: SyphonServerDescription) => (description[SyphonServerDescriptionUUIDKey] = uuid),
  );

  if (!existing) {
    return new ServerNotExistError(uuid);
  }

  if (!client) {
    client = new ElectronSyphonMetalClient();
  }

  client.connect(existing);
  return existing;
};

const handlePullFrame = async (_event: IpcMainInvokeEvent, uuid: string) => {
  // Client will pull the frame at its own pace (requestAnimationFrame).

  if (!client) {
    return new DisconnectedClientFrameError();
  }

  if (client.serverUUID !== uuid) {
    return new NotSameServerError();
  }

  return client.frame;
};

const handleOpenServerWindow = () => {
  if (!serverWindow || serverWindow.isDestroyed()) {
    createMetalDataServer();
    const pos = serverWindow.getPosition();
    serverWindow.setPosition(pos[0] - 50, pos[1] - 50);
  }
};

// ------------------------------------------------ //
// ---------------- Server handlers --------------- //
// ------------------------------------------------ //

const handleCreateServer = async (_event: IpcMainInvokeEvent, name: string) => {
  if (!server) {
    try {
      server = await ElectronSyphonMetalServer.withName(name);
      return server.description;
    } catch (err: unknown) {
      return err;
    }
  }
  return new Error(`A server was already created with this name.`);
};

const handlePublishData = async (
  _event: IpcMainInvokeEvent,
  frame: { data: Uint8ClampedArray; width: number; height: number },
) => {
  if (!server) {
    return new Error(`Server was not created before publishing frame data.`);
  }
  server.publishImageData(frame);
  return;
};

const handleDestroyServer = async (_event: IpcMainInvokeEvent, name: string) => {
  if (!server || server.name !== name) {
    return new Error(`Server could not be found and can't be destroyed.`);
  }
  server.dispose();
  server = null;
  return;
};
