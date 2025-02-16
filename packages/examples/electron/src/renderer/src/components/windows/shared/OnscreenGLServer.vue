<script lang="ts">
export default {
  name: 'OnscreenGLServer',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useSyphon } from '@/composables/useSyphon';

const { createServer } = useSyphon();

const canvasRef = ref<HTMLCanvasElement | undefined>();

onMounted(async () => {
  await createServer('Handle', 'osr');
});

onBeforeUnmount(() => {});
</script>

<template lang="pug">
.w-full.h-full.flex.flex-col.text-sm
  .bg-background-dark
    .titlebar.w-full.font-semibold Electron Simple Server (OpenGL - shared)
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
