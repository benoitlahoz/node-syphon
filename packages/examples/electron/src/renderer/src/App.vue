<script setup lang="ts">
import type { SyphonServerDescription, SyphonFrameData } from 'node-syphon/universal';
import {
  SyphonServerDirectoryListenerChannel,
  SyphonServerDescriptionAppNameKey,
  SyphonServerDescriptionUUIDKey,
} from 'node-syphon/universal';
import { onMounted, ref } from 'vue';
import { useColorMode } from '@vueuse/core';
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
const width = ref(320);
const height = ref(240);

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
});

const getFrame = async () => {
  // TODO: frame from specific server.
  const frame: SyphonFrameData | undefined = await ipcInvoke('get-frame');

  if (frame) {
    width.value = frame.width;
    height.value = frame.height;
    const data = new ImageData(new Uint8ClampedArray(frame.buffer), frame.width, frame.height);

    const canvas: HTMLCanvasElement = canvasRef.value;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.save();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(data, 0, 0);
      ctx.restore();
    }
  }

  requestAnimationFrame(getFrame);
};

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

  // Start getting frames.
  await getFrame();
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
  .w-full.flex.flex-1.mt-4.bg-black.overflow-hidden
    canvas(
      ref="canvasRef",
      :width="width",
      :height="height"
    ).w-full
</template>

<style scoped>
/* FIXME: Very ugly way to flip. */
canvas {
  transform: scaleY(-1);
}
</style>
