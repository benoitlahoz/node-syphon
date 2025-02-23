<script lang="ts">
export default {
  name: 'OffscreenGLServer',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ThreeExampleHelpersOffscreen } from '../../../three/three-example-helpers_offscreen';

const canvasRef = ref<HTMLCanvasElement | undefined>();
let example: ThreeExampleHelpersOffscreen;

onMounted(async () => {
  const canvas: HTMLCanvasElement | undefined = canvasRef.value;
  if (!canvas) {
    throw new Error(`Canvas element may not be mounted yet.`);
  }

  example = new ThreeExampleHelpersOffscreen(canvas);
});

onBeforeUnmount(() => {
  if (example) example.dispose();
});
</script>

<template lang="pug">
.w-full.h-full.flex.flex-col
  .bg-background.w-full.flex-1.flex.flex-col
    .w-full.flex.flex-1.bg-black.overflow-hidden
      canvas(
        ref="canvasRef"
      ).w-full
</template>
