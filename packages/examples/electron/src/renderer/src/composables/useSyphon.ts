import {
  SyphonServerDirectoryListenerChannel,
  SyphonServerDescription,
  SyphonServerDescriptionAppNameKey,
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
          `Server with name '${payload.server[SyphonServerDescriptionAppNameKey]}' connected.`,
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

  return {
    servers,
    serverByUUID,
    connectToServer,
  };
};
