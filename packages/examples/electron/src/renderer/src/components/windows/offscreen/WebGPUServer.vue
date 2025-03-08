<script lang="ts">
export default {
  name: 'WebGPUServer',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import triangleVertWGSL from '../shaders/triangle.vert.wgsl?raw';
import redFragWGSL from '../shaders/red.frag.wgsl?raw';

const devicePixelRatio = window.devicePixelRatio;
const canvasRef = ref<HTMLCanvasElement | undefined>();
let context: GPUCanvasContext;
let adapter;
let device;
let presentationFormat;
let pipeline;

const width = ref(0);
const height = ref(0);

onMounted(async () => {
  const canvas: HTMLCanvasElement | undefined = canvasRef.value;
  if (!canvas) {
    throw new Error(`Canvas element may not be mounted yet.`);
  }

  adapter = await navigator.gpu.requestAdapter();
  device = await adapter.requestDevice();
  presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context = canvas.getContext('webgpu') as GPUCanvasContext;
  context.configure({
    device,
    format: presentationFormat,
  });

  pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: triangleVertWGSL,
      }),
    },
    fragment: {
      module: device.createShaderModule({
        code: redFragWGSL,
      }),
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  width.value = canvas.clientWidth * devicePixelRatio;
  height.value = canvas.clientHeight * devicePixelRatio;
  canvas.width = width.value;
  canvas.height = height.value;

  requestAnimationFrame(onFrame);
});

const onFrame = () => {
  const commandEncoder = device.createCommandEncoder();
  const textureView = context.getCurrentTexture().createView();
  console.log(context.getCurrentTexture());

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: textureView,
        clearValue: [0, 0, 0, 0], // Clear to transparent
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(onFrame);
};

onBeforeUnmount(() => {});
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
