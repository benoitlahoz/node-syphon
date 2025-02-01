<script lang="ts">
export default {
  name: 'SimpleGLServer',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useSyphon } from '@/composables/useSyphon';

import { ThreeExampleHelpers } from '../../three/three-example-helpers';

const { createServer, publishFrameGL } = useSyphon();

const canvasRef = ref<HTMLCanvasElement | undefined>();
let example: ThreeExampleHelpers;

onMounted(async () => {
  await createServer('ThreeJS OpenGL', 'gl');

  const canvas: HTMLCanvasElement | undefined = canvasRef.value;
  if (!canvas) {
    throw new Error(`Canvas element may not be mounted yet.`);
  }

  example = new ThreeExampleHelpers(canvas);
  example.ondraw = async (frame: { data: Uint8ClampedArray; width: number; height: number }) => {
    await publishFrameGL(frame);
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
    .titlebar.w-full.font-semibold Electron Simple Server (OpenGL)
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
