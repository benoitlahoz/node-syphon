import type { IpcMainInvokeEvent } from 'electron';
import { BrowserWindow, ipcMain } from 'electron';
import { SyphonServerDescription, SyphonServerDescriptionUUIDKey } from 'node-syphon';
import { OpenGLDataRoutes } from '@/common/routes';
import { OpenGLDataChannels } from '@/common/channels';
import {
  DisconnectedClientFrameError,
  NotSameServerError,
  ServerNotExistError,
} from '@/common/errors';
import type { ElectronSyphonDirectory } from '../electron-syphon.directory';
import { ElectronSyphonGLClient } from './electron-syphon.gl-client';
import { ElectronSyphonGLServer } from './electron-syphon.gl-server';
import { createWindow } from '../../window';

let clientWindow: BrowserWindow;
let serverWindow: BrowserWindow;

let directory: ElectronSyphonDirectory;

let client: ElectronSyphonGLClient | null;
let server: ElectronSyphonGLServer | null;

export const createOpenGLDataClient = (serverDirectory: ElectronSyphonDirectory) => {
  if (!directory) directory = serverDirectory;

  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.close();
    clientWindow.destroy();
  }

  ipcMain.handle(OpenGLDataChannels.ConnectServer, handleConnectServer);
  ipcMain.handle(OpenGLDataChannels.PullFrame, handlePullFrame);
  ipcMain.on(OpenGLDataChannels.OpenServerWindow, handleOpenServerWindow);

  clientWindow = createWindow(OpenGLDataRoutes.client);
  clientWindow.on('close', () => {
    ipcMain.removeHandler(OpenGLDataChannels.ConnectServer);
    ipcMain.removeHandler(OpenGLDataChannels.PullFrame);
    ipcMain.removeListener(OpenGLDataChannels.OpenServerWindow, handleOpenServerWindow);
    if (client) {
      client.dispose();
      client = null;
    }
  });
};

export const createOpenGLDataServer = (serverDirectory?: ElectronSyphonDirectory) => {
  if (!directory && serverDirectory) directory = serverDirectory;

  if (serverWindow && !serverWindow.isDestroyed()) {
    serverWindow.close();
    serverWindow.destroy();
  }

  ipcMain.handle(OpenGLDataChannels.CreateServer, handleCreateServer);
  ipcMain.handle(OpenGLDataChannels.PublishFrame, handlePublishData);
  ipcMain.handle(OpenGLDataChannels.DestroyServer, handleDestroyServer);

  serverWindow = createWindow(OpenGLDataRoutes.server);
  serverWindow.on('close', () => {
    ipcMain.removeHandler(OpenGLDataChannels.CreateServer);
    ipcMain.removeHandler(OpenGLDataChannels.PublishFrame);
    ipcMain.removeHandler(OpenGLDataChannels.DestroyServer);
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
    client = new ElectronSyphonGLClient();
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
    createOpenGLDataServer();
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
      server = await ElectronSyphonGLServer.withName(name);
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
