<script lang="ts">
export default {
  name: 'WebRTCSender',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { WindowRTCPeerConnection, defineIpc } from 'electron-window-rtc/renderer';
import { ThreeExampleWebGLDecalsOffscreen } from '../../../three/three-example-webgl-decals_offscreen';
import { nextTick } from 'vue';

defineIpc(window.electron.ipcRenderer);

let peerWindowConnection: WindowRTCPeerConnection | null = null;
const canvasRef = ref<HTMLCanvasElement | undefined>();
let example: ThreeExampleWebGLDecalsOffscreen;

onMounted(async () => {
  if (peerWindowConnection) {
    peerWindowConnection.dispose();
    peerWindowConnection = null;
  }
  peerWindowConnection = await WindowRTCPeerConnection.with('OffscreenRenderer');

  const canvas: HTMLCanvasElement | undefined = canvasRef.value;
  if (!canvas) {
    throw new Error(`Canvas element may not be mounted yet.`);
  }

  example = new ThreeExampleWebGLDecalsOffscreen(canvas, '38px', false); // retina: true
  nextTick(async () => {
    // Set constraints on next tick.

    const stream = canvas.captureStream(240);

    const str: MediaStream = new MediaStream();
    const track: MediaStreamTrack = stream.getVideoTracks()[0];

    // We want to be able to receive up to this size.
    await track.applyConstraints({
      advanced: [{ width: 1800, height: 1200 }],
    });

    str.addTrack(track);
    await peerWindowConnection!.addStream(str, { video: 20000, audio: 1000 });
  });
});

onBeforeUnmount(() => {
  if (example) example.dispose();
});
</script>

<template lang="pug">
.w-full.h-full.flex.flex-col.text-sm.overflow-hidden
  .bg-background-dark
    .titlebar.w-full.font-semibold WebRTC Offscreen
  .bg-background.w-full.flex-1.flex.flex-col
    .w-full.flex.flex-1.bg-black.relative
      canvas(
        ref="canvasRef",
      ).w-full.overflow-hidden
    .absolute.bottom-2.left-2.right-2.bg-warning.text-lg.flex.flex-col.items-center.justify-center.rounded.py-2
        .font-bold Canvas is sent to Offscreen rendered window
        .text-warning-foreground.flex.items-center.justify-center.text-sm
          div thanks to the&nbsp;
          div
            a(
              href="https://github.com/benoitlahoz/electron-window-rtc",
              target="_blank"
            ).underline.text-underline-offset-8
              pre electron-window-rtc
          div &nbsp;package.
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
