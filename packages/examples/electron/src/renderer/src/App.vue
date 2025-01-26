<script setup lang="ts">
import type { SyphonServerDescription } from 'node-syphon/universal';
import {
  SyphonServerDirectoryListenerChannel,
  SyphonServerDescriptionAppNameKey,
  SyphonServerDescriptionUUIDKey,
} from 'node-syphon/universal';
import { onMounted, ref } from 'vue';
import { useColorMode } from '@vueuse/core';
import type { SyphonGLFrameDTO } from '@/types';
import {
  Select as SelectMain,
  SelectContent,
  SelectGroup,
  SelectItem,
  // SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

useColorMode();

const ipcOn = window.electron.ipcRenderer.on;
const ipcInvoke = window.electron.ipcRenderer.invoke;

const servers = ref<SyphonServerDescription[]>([]);

const canvasRef = ref();

onMounted(async () => {
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

  // Subcribe to new frame.

  ipcOn('new-frame', (_, payload: SyphonGLFrameDTO) => {
    const canvas = canvasRef.value;
    const data = new ImageData(new Uint8ClampedArray(payload.data), payload.width, payload.height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(data, 0, 0);
  });
});

const serverByUUID = (uuid: string) => {
  return servers.value.find(
    (desc: SyphonServerDescription) => desc[SyphonServerDescriptionUUIDKey] === uuid,
  );
};

const onChange = async (uuid: string) => {
  const serverDescription = serverByUUID(uuid);

  if (!serverDescription) {
    console.error(`Server withh UUID '${uuid}' doesn't exist.`);
    return;
  }

  console.log(`Connecting to server '${serverDescription[SyphonServerDescriptionAppNameKey]}'.`);

  const res = await ipcInvoke('connect-server', uuid);
  console.log('Result from main', res);

  console.log(`Connected to server '${serverDescription[SyphonServerDescriptionAppNameKey]}'.`);
};
</script>

<template lang="pug">
.bg-background.w-full.h-full.flex.flex-col.p-4.text-sm
  .w-full
    select-main(
      @update:model-value="onChange"
    )
      select-trigger(
        class="w-[300px]"
      ) 
        select-value(
          placeholder="Select a server..."
        )
      select-content
        select-group 
          select-item(
            v-for="server in servers",
            :key="server[SyphonServerDescriptionUUIDKey]",
            :value="server[SyphonServerDescriptionUUIDKey]"
          ) {{ server[SyphonServerDescriptionAppNameKey] }}
  .w-full.flex.flex-1.pt-4 
    canvas(
      ref="canvasRef"
    ).bg-black.w-full.grow-1
</template>

<style scoped></style>
