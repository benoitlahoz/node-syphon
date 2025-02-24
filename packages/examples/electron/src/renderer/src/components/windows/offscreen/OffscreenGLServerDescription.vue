<script lang="ts">
export default {
  name: 'OffscreenGLServerDescription',
};
</script>

<script setup lang="ts"></script>

<template lang="pug">
.w-full.h-full.flex.flex-col.text-sm
  .bg-background-dark
    .titlebar.w-full.font-semibold OpenGL Offscreen
  .bg-background.w-full.flex-1.flex.flex-col
    .w-full.flex.flex-col.flex-1.bg-warning.overflow-hidden.items-center.justify-center
      .text-lg.font-bold.text-white OpenGL Offscreen Rendering
      .mt-2.text-warning-foreground Open a 
        span.font-bold Syphon Client 
        span &nbsp;to see window rendered offscreen.
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
