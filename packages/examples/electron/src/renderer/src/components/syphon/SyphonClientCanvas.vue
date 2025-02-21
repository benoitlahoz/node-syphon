<script lang="ts">
export default {
  name: 'SyphonClientCanvas',
};
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { SyphonServerDescription } from 'node-syphon/universal';
import { SyphonServerDescriptionUUIDKey } from 'node-syphon/universal';
import { useSyphon } from '../../composables/useSyphon';
import WorkerURL from './workers/simple-client.worker?url';

const { OpenGL, Metal } = useSyphon();

const { server, type = 'gl' } = defineProps<{
  server?: SyphonServerDescription;
  type?: 'gl' | 'metal';
}>();
const emit = defineEmits(['fps', 'resize']);

const canvasRef = ref<HTMLCanvasElement>();
let offscreenCanvas: OffscreenCanvas;
let worker;
let animationFrameReqId;

const width = ref<number>(0);
const height = ref<number>(0);

let getFrame;

watch(
  () => [width.value, height.value],
  () => {
    emit('resize', { width: width.value, height: height.value });
  },
);

watch(
  () => [server],
  async () => {
    if (server) {
      // Cancel previous animation frame.
      if (animationFrameReqId) cancelAnimationFrame(animationFrameReqId);

      const serverOrError =
        type === 'gl'
          ? await OpenGL.connectDataServer(server[SyphonServerDescriptionUUIDKey])
          : await Metal.connectDataServer(server[SyphonServerDescriptionUUIDKey]);

      if (serverOrError instanceof Error) {
        console.error(serverOrError);
        return;
      }

      if (!offscreenCanvas) {
        throw new Error('Canvas was not mounted yet.');
      }

      getFrame = type === 'gl' ? pullOpenGLFrame : pullMetalFrame;

      if (!worker) {
        worker = new Worker(WorkerURL);
        await worker.postMessage({ cmd: 'init', canvas: offscreenCanvas }, [offscreenCanvas]);
        worker.onmessage = (event: any) => {
          switch (event.data.type) {
            case 'fps': {
              emit('fps', event.data.payload);
              break;
            }
          }
        };
      }

      // Start getting frames.
      animationFrameReqId = requestAnimationFrame(getFrame);
    }
  },
  { immediate: true },
);

onMounted(async () => {
  const canvas: HTMLCanvasElement = canvasRef.value!;
  offscreenCanvas = canvas.transferControlToOffscreen();
});

onBeforeUnmount(() => {
  if (worker) {
    worker.terminate();
  }
});

const pullOpenGLFrame = async () => {
  // Pull frame from main process on specific server.
  const frame = await OpenGL.pullFrame(server!.SyphonServerDescriptionUUIDKey)!;

  if (frame) {
    width.value = frame.width;
    height.value = frame.height;

    await worker.postMessage({ buffer: frame.buffer, width: width.value, height: height.value });
  }

  animationFrameReqId = requestAnimationFrame(getFrame);
};

const pullMetalFrame = async () => {
  // Pull frame from main process on specific server.
  const frame = await Metal.pullFrame(server!.SyphonServerDescriptionUUIDKey)!;

  if (frame) {
    width.value = frame.width;
    height.value = frame.height;

    await worker.postMessage({ buffer: frame.buffer, width: width.value, height: height.value });
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
