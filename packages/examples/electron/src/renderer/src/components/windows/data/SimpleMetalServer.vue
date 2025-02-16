<script lang="ts">
export default {
  name: 'SimpleMetalServer',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useSyphon } from '@/composables/useSyphon';

import { ThreeExampleHelpers } from '../../../three/three-example-helpers';

const { createServer, publishFrameMetal } = useSyphon();

const canvasRef = ref<HTMLCanvasElement | undefined>();
let example: ThreeExampleHelpers;

onMounted(async () => {
  await createServer('ThreeJS Metal', 'metal');

  const canvas: HTMLCanvasElement | undefined = canvasRef.value;
  if (!canvas) {
    throw new Error(`Canvas element may not be mounted yet.`);
  }

  example = new ThreeExampleHelpers(canvas);
  example.ondraw = async (frame: { data: Uint8ClampedArray; width: number; height: number }) => {
    await publishFrameMetal(frame);
  };
});

onBeforeUnmount(() => {
  if (example) example.dispose();
  // TODO: Destroy server.
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
