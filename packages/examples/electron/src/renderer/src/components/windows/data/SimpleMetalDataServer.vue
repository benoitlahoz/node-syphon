<script lang="ts">
export default {
  name: 'SimpleMetalDataServer',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { SyphonServerDescription } from 'node-syphon/universal';
import { SyphonServerDescriptionNameKey } from 'node-syphon/universal';
import { useSyphon } from '@/composables/useSyphon';

import { ThreeExampleHelpers } from '../../../three/three-example-helpers';

const { Metal } = useSyphon();

const canvasRef = ref<HTMLCanvasElement | undefined>();
let example: ThreeExampleHelpers;
const server = ref<SyphonServerDescription | undefined>();

onMounted(async () => {
  console.log('MOUNT');
  const serverOrError = await Metal.createDataServer('ThreeJS Metal');
  if (serverOrError instanceof Error) {
    throw serverOrError;
  }
  server.value = serverOrError;
  console.log('AFTER');

  const canvas: HTMLCanvasElement | undefined = canvasRef.value;
  if (!canvas) {
    throw new Error(`Canvas element may not be mounted yet.`);
  }

  example = new ThreeExampleHelpers(canvas);
  console.log('EX', example);
  example.ondraw = async (frame: { data: Uint8ClampedArray; width: number; height: number }) => {
    console.log('DRAW');
    await Metal.publishData({
      server: server.value![SyphonServerDescriptionNameKey],
      ...frame,
    });
  };
});

onBeforeUnmount(() => {
  if (example) example.dispose();
  if (server.value) {
    Metal.destroyDataServer(server.value[SyphonServerDescriptionNameKey]);
  }
});
</script>

<template lang="pug">
.w-full.h-full.flex.flex-col.text-sm
  .bg-background-dark
    .titlebar.w-full.font-semibold Electron Simple Server (Metal - data)
  .bg-background.w-full.flex-1.flex.flex-col
    .w-full.flex.flex-1.bg-black.overflow-hidden
      canvas(
        ref="canvasRef"
      ).w-full
</template>

<style scoped>
.titlebar {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: drag;
}
</style>
