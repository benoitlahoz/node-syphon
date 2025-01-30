<script lang="ts">
export default {
  name: 'SyphonCanvas',
};
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  SyphonServerDescriptionUUIDKey,
  type SyphonFrameData,
  type SyphonServerDescription,
} from 'node-syphon/universal';
import { useSyphon } from '../../composables/useSyphon';
import WorkerURL from './workers/offscreen-canvas.worker?url';

const ipcInvoke = window.electron.ipcRenderer.invoke;

const { connectToServer } = useSyphon();

const { server } = defineProps<{ server?: SyphonServerDescription }>();
const emit = defineEmits(['fps', 'resize']);

const canvasRef = ref<HTMLCanvasElement>();
let offscreenCanvas: OffscreenCanvas;
let worker;
let animationFrameReqId;

const width = ref<number>(0);
const height = ref<number>(0);

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

      const serverOrError = await connectToServer(server[SyphonServerDescriptionUUIDKey]);

      if (serverOrError instanceof Error) {
        console.error(serverOrError);
        return;
      }

      if (!offscreenCanvas) {
        console.error('Canvas was not mounted yet.');
      }

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
  worker.terminate();
});

const getFrame = async () => {
  // Pull frame from main process on specific server.

  const frame: SyphonFrameData | undefined = await ipcInvoke(
    'get-frame',
    server!.SyphonServerDescriptionUUIDKey,
  );

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
