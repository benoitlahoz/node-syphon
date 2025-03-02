<script lang="ts">
export default {
  name: 'WebRTCReceiver',
};
</script>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { WindowRTCEvent } from 'electron-window-rtc/renderer';
import { WindowRTCPeerConnection, defineIpc } from 'electron-window-rtc/renderer';

defineIpc(window.electron.ipcRenderer);

let peerWindowConnection: WindowRTCPeerConnection | null = null;
const videoRef = ref<HTMLVideoElement | undefined>();
const ratio = ref(window.devicePixelRatio);

const streamWidth = ref(0);
const streamHeight = ref(0);

onMounted(async () => {
  if (peerWindowConnection) {
    peerWindowConnection.dispose();
    peerWindowConnection = null;
  }

  peerWindowConnection = await WindowRTCPeerConnection.with('OffscreenRendererController');
  // await peerWindowConnection.requestOffer();
  peerWindowConnection.on('track', async (event: WindowRTCEvent) => {
    if (peerWindowConnection) {
      const video = videoRef.value;
      if (!video) {
        throw new Error(`Video element may not be mounted yet on '${peerWindowConnection.name}'`);
      }

      const trackEvent: RTCTrackEvent = event.payload;
      const streams = trackEvent.streams;
      for (const stream of streams) {
        // If multiple streams, keep only the last one.
        video.srcObject = null;
        video.srcObject = stream;
      }

      video.oncanplay = async () => {
        video.play();
      };
    }
  });
});

const onResize = () => {
  const video = videoRef.value!;
  const { videoWidth, videoHeight } = video;
  streamWidth.value = videoWidth;
  streamHeight.value = videoHeight;
};
</script>

<template lang="pug">
.w-full.h-full.flex.flex-col.text-sm.relative.bg-black
  video(
    ref="videoRef",
    :style="`width: ${900 * ratio}px; height: ${600 * ratio}px;`",
    :controls="false",
    :muted="true",
    @resize="onResize"
  )
  .absolute.bottom-2.left-2.right-2.bg-warning.text-xs.flex.flex-col.align-center.justify-center.rounded.py-2 
    .flex.align-center.justify-center.font-bold Stream size is changing before to stabilize.
    .flex.align-center.justify-center.text-warning-foreground
      .mr-2 Stream width: 
        span.font-bold {{ streamWidth }}px
      .ml-2 Stream height: 
        span.font-bold {{ streamHeight }}px
</template>

<style scoped>
.titlebar {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: drag;
}

video {
  width: 100%;
  height: 100%;
  min-width: 100%;
  min-height: 100%;
}
</style>
