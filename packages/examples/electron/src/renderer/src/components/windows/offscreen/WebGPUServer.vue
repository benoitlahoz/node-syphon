<script lang="ts">
export default {
  name: 'WebGPUServer',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ThreeExampleWebGLDecalsOffscreen } from '../../../three/three-example-webgl-decals_offscreen';

const canvasRef = ref<HTMLCanvasElement | undefined>();
let example: ThreeExampleWebGLDecalsOffscreen;

onMounted(async () => {
  const canvas: HTMLCanvasElement | undefined = canvasRef.value;
  if (!canvas) {
    throw new Error(`Canvas element may not be mounted yet.`);
  }

  example = new ThreeExampleWebGLDecalsOffscreen(canvas, '42px', false); // retina: true
});

onBeforeUnmount(() => {
  if (example) example.dispose();
});
</script>

<template lang="pug">
.w-full.h-full.flex.flex-col.text-sm.overflow-hidden
  .bg-background-dark
    .titlebar.w-full.font-semibold (Not WebGPU for the time being) Offscreen
  .bg-background.w-full.flex-1.flex.flex-col
    .w-full.flex.flex-1.bg-black.relative
      canvas(
        ref="canvasRef",
      ).w-full.overflow-hidden
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
