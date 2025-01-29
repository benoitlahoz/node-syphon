<script lang="ts">
export default {
  name: 'SyphonCanvas',
};
</script>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  SyphonServerDescriptionUUIDKey,
  type SyphonFrameData,
  type SyphonServerDescription,
} from 'node-syphon/universal';
import { useSyphon } from '../../composables/useSyphon';

const ipcInvoke = window.electron.ipcRenderer.invoke;

const { connectToServer } = useSyphon();

const { server } = defineProps<{ server?: SyphonServerDescription }>();

const canvasRef = ref<HTMLCanvasElement>();
const width = ref<number>(0);
const height = ref<number>(0);

let animationFrameReqId;

watch(
  () => [server],
  async () => {
    if (server) {
      // Cancel previous animation frame.
      if (animationFrameReqId) cancelAnimationFrame(animationFrameReqId);

      const serverOrError = await connectToServer(server[SyphonServerDescriptionUUIDKey]);

      if (serverOrError instanceof Error) {
        console.error(serverOrError);
        return;
      }

      // Start getting frames.
      animationFrameReqId = requestAnimationFrame(getFrame);
    }
  },
  { immediate: true },
);

const getFrame = async () => {
  // Pull frame from main process on specific server.

  const frame: SyphonFrameData | undefined = await ipcInvoke(
    'get-frame',
    server!.SyphonServerDescriptionUUIDKey,
  );

  if (frame) {
    width.value = frame.width;
    height.value = frame.height;
    const data = new ImageData(new Uint8ClampedArray(frame.buffer), frame.width, frame.height);

    const canvas: HTMLCanvasElement = canvasRef.value!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(data, 0, 0);
  }

  animationFrameReqId = requestAnimationFrame(getFrame);
};
</script>

<template lang="pug">
canvas(
  ref="canvasRef",
  :width="width",
  :height="height"
)
</template>

<style scoped>
/* FIXME: Very ugly way to flip vertically. */
canvas {
  transform: scaleY(-1);
}
</style>
