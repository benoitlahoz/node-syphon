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
      (_, payload: { server: SyphonServerDescription; servers: SyphonServerDescription[] }) => {
        console.log(
          `Server with name '${payload.server[SyphonServerDescriptionAppNameKey]}${payload.server[SyphonServerDescriptionNameKey] ? ` - ${payload.server[SyphonServerDescriptionNameKey]}` : ''}' connected.`,
        );
        servers.value = payload.servers;
      },
    );

    // Subcribe to retiring servers.

    ipcOn(
      SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
      (_, payload: { server: SyphonServerDescription; servers: SyphonServerDescription[] }) => {
        console.log(
          `Server with name '${payload.server[SyphonServerDescriptionAppNameKey]}' disconnected.`,
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

  const connectToServer = async (uuid: string): Promise<SyphonServerDescription | Error> => {
    // Update existing servers.
    servers.value = await ipcInvoke('get-servers');

    // Try to connect to server.
    const serverOrError: SyphonServerDescription | Error = await ipcInvoke('connect-server', uuid);
    return serverOrError;
  };

  const createServer = async (name: string) => {
    const res = await ipcInvoke('create-server', name);
    console.log('Result', res);
  };

  const publishFrame = async (frame: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }) => {
    /* const res = */ await ipcInvoke('publish-frame', frame);
  };

  return {
    servers,
    serverByUUID,
    connectToServer,
    createServer,
    publishFrame,
  };
};
