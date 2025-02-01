import {
  SyphonServerDirectoryListenerChannel,
  SyphonServerDescription,
  SyphonServerDescriptionAppNameKey,
  SyphonServerDescriptionNameKey,
  SyphonServerDescriptionUUIDKey,
} from 'node-syphon/universal';
import { onBeforeMount, ref } from 'vue';

export const useSyphon = () => {
  const ipcOn = window.electron.ipcRenderer.on;
  const ipcInvoke = window.electron.ipcRenderer.invoke;

  const servers = ref<SyphonServerDescription[]>([]);

  onBeforeMount(async () => {
    // Get already running servers.

    servers.value = await ipcInvoke('get-servers');

    // Subcribe to announcing servers.

    ipcOn(
      SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
      (_, payload: { message: SyphonServerDescription; servers: SyphonServerDescription[] }) => {
        console.log(
          `Server with name '${payload.message[SyphonServerDescriptionAppNameKey]}${payload.message[SyphonServerDescriptionNameKey] ? ` - ${payload.message[SyphonServerDescriptionNameKey]}` : ''}' connected.`,
        );
        servers.value = payload.servers;
      },
    );

    // Subcribe to retiring servers.

    ipcOn(
      SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
      (_, payload: { message: SyphonServerDescription; servers: SyphonServerDescription[] }) => {
        console.log(
          `Server with name '${payload.message[SyphonServerDescriptionAppNameKey]}' disconnected.`,
        );
        servers.value = payload.servers;
      },
    );
  });

  const serverByUUID = (uuid: string) => {
    return servers.value.find(
      (desc: SyphonServerDescription) => desc[SyphonServerDescriptionUUIDKey] === uuid,
    );
  };

  const connectToServer = async (
    uuid: string,
    type: 'gl' | 'metal',
  ): Promise<SyphonServerDescription | Error> => {
    // Update existing servers.
    servers.value = await ipcInvoke('get-servers');

    // Try to connect to server.
    const serverOrError: SyphonServerDescription | Error = await ipcInvoke(
      'connect-server',
      uuid,
      type,
    );
    return serverOrError;
  };

  const createServer = async (name: string, type: 'gl' | 'metal'): Promise<boolean> => {
    const res = await ipcInvoke('create-server', name, type);
    return res;
  };

  const publishFrameGL = async (frame: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }) => {
    /* const res = */ await ipcInvoke('publish-frame-gl', frame);
  };

  const publishFrameMetal = async (frame: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }) => {
    /* const res = */ await ipcInvoke('publish-frame-metal', frame);
  };

  return {
    servers,
    serverByUUID,
    connectToServer,
    createServer,
    publishFrameGL,
    publishFrameMetal,
  };
};
