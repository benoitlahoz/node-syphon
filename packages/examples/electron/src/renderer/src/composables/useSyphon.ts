import type { IpcRendererEvent } from 'electron';
import {
  SyphonServerDirectoryListenerChannel,
  SyphonServerDescription,
  SyphonServerDescriptionUUIDKey,
  SyphonFrameData,
} from 'node-syphon/universal';
import { onBeforeMount, onBeforeUnmount, ref } from 'vue';
import { MetalDataChannels, OpenGLDataChannels, ServerDirectoryChannels } from '@/common/channels';

const ipcOn = window.electron.ipcRenderer.on;
const ipcInvoke = window.electron.ipcRenderer.invoke;
const ipcRemove = window.electron.ipcRenderer.removeAllListeners;

export const useSyphon = () => {
  const servers = ref<SyphonServerDescription[]>([]);

  const serverByUUID = async (uuid: string) => {
    // Update existing servers.
    servers.value = await ipcInvoke(ServerDirectoryChannels.GetServers);
    return servers.value.find(
      (desc: SyphonServerDescription) => desc[SyphonServerDescriptionUUIDKey] === uuid,
    );
  };

  // ------------------------------------------------ //
  // --------------------- OpenGL ------------------- //
  // ------------------------------------------------ //

  const connectOpenGLDataServer = async (
    uuid: string,
  ): Promise<SyphonServerDescription | Error> => {
    // Update existing servers.
    servers.value = await ipcInvoke(ServerDirectoryChannels.GetServers);
    return await ipcInvoke(OpenGLDataChannels.ConnectServer, uuid);
  };

  const createOpenGLDataServer = async (name: string): Promise<Error | SyphonServerDescription> => {
    return await ipcInvoke(OpenGLDataChannels.CreateServer, name);
  };

  const destroyOpenGLDataServer = async (
    name: string,
  ): Promise<Error | SyphonServerDescription> => {
    return await ipcInvoke(OpenGLDataChannels.DestroyServer, name);
  };

  const publishOpenGLData = async (frame: {
    server: string;
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }) => {
    return await ipcInvoke(OpenGLDataChannels.PublishFrame, frame);
  };

  const pullOpenGLFrame = async (uuid: string): Promise<SyphonFrameData | undefined> => {
    return await ipcInvoke(OpenGLDataChannels.PullFrame, uuid);
  };

  // ------------------------------------------------ //
  // --------------------- Metal -------------------- //
  // ------------------------------------------------ //

  const connectMetalDataServer = async (uuid: string): Promise<SyphonServerDescription | Error> => {
    // Update existing servers.
    servers.value = await ipcInvoke(ServerDirectoryChannels.GetServers);
    return await ipcInvoke(MetalDataChannels.ConnectServer, uuid);
  };

  const createMetalDataServer = async (name: string): Promise<Error | SyphonServerDescription> => {
    return await ipcInvoke(MetalDataChannels.CreateServer, name);
  };

  const destroyMetalDataServer = async (name: string): Promise<Error | SyphonServerDescription> => {
    return await ipcInvoke(MetalDataChannels.DestroyServer, name);
  };

  const publishMetalData = async (frame: {
    server: string;
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }): Promise<undefined | Error> => {
    return await ipcInvoke(MetalDataChannels.PublishFrame, frame);
  };

  const pullMetalFrame = async (uuid: string): Promise<SyphonFrameData | undefined> => {
    return await ipcInvoke(MetalDataChannels.PullFrame, uuid);
  };

  // ------------------------------------------------ //
  // -------------------- Internal ------------------ //
  // ------------------------------------------------ //

  onBeforeMount(async () => {
    // Get already running servers.
    servers.value = await ipcInvoke(ServerDirectoryChannels.GetServers);

    ipcOn(SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification, _onAnnounce);
    ipcOn(SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification, _onRetire);
  });

  onBeforeUnmount(() => {
    ipcRemove(SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification);
    ipcRemove(SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification);
  });

  const _onAnnounce = (
    _event: IpcRendererEvent,
    data: { message: SyphonServerDescription; servers: SyphonServerDescription[] },
  ): SyphonServerDescription => {
    servers.value = data.servers;
    return data.message;
  };

  const _onRetire = (
    _event: IpcRendererEvent,
    data: { message: SyphonServerDescription; servers: SyphonServerDescription[] },
  ): SyphonServerDescription => {
    servers.value = data.servers;
    return data.message;
  };

  return {
    servers,
    serverByUUID,

    OpenGL: {
      connectDataServer: connectOpenGLDataServer,
      createDataServer: createOpenGLDataServer,
      publishData: publishOpenGLData,
      destroyDataServer: destroyOpenGLDataServer,
      pullFrame: pullOpenGLFrame,
    },
    Metal: {
      connectDataServer: connectMetalDataServer,
      createDataServer: createMetalDataServer,
      publishData: publishMetalData,
      destroyDataServer: destroyMetalDataServer,
      pullFrame: pullMetalFrame,
    },
  };
};
