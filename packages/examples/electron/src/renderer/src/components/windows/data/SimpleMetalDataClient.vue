<script lang="ts">
export default {
  name: 'SimpleMetalDataClient',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import type { SyphonServerDescription } from 'node-syphon/universal';
import {
  SyphonServerDescriptionNameKey,
  SyphonServerDescriptionAppNameKey,
  SyphonServerDescriptionUUIDKey,
} from 'node-syphon/universal';
import { MetalDataChannels } from '@/common/channels';
import { useSyphon } from '@/composables/useSyphon';

import {
  Select as SelectMain,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { default as SyphonClientCanvas } from '@/components/syphon/SyphonClientCanvas.vue';
import { HardDriveUpload } from 'lucide-vue-next';

const ipcSend = window.electron.ipcRenderer.send;

const { servers, serverByUUID } = useSyphon();
const serverDescription = ref<SyphonServerDescription>();

const fps = ref(0);
const width = ref(0);
const height = ref(0);

const onChange = async (uuid: string) => {
  serverDescription.value = await serverByUUID(uuid);
};

const onFpsChange = (value: number) => {
  fps.value = value;
};

const onResize = (value: { width: number; height: number }) => {
  width.value = value.width;
  height.value = value.height;
};

const openSimpleServer = () => {
  ipcSend(MetalDataChannels.OpenServerWindow);
};
</script>

<template lang="pug">
.w-full.h-full.flex.flex-col.text-sm
  .bg-background-dark
    .titlebar.w-full.relative
      .flex-1.flex.items-center(
        style="padding-left: 75px; margin-right: -66px;"
      )
      .font-semibold Electron Simple Client (Metal - data)
      .flex-1.flex.justify-end.pr-4 
        hard-drive-upload(
          :size="14",
          @click="openSimpleServer"
        ).no-drag.titlebar-icon
    .w-full.p-3.flex.items-center
      select-main(
        @update:model-value="onChange"
      )
        select-trigger(
          class="w-[30%]"
        ) 
          select-value(
            placeholder="Select a server..."
          )
        select-content
          select-group 
            select-item(
              v-for="server in servers",
              :key="server[SyphonServerDescriptionUUIDKey]",
              :value="server[SyphonServerDescriptionUUIDKey]"
            ) {{ server[SyphonServerDescriptionAppNameKey] }} {{ server[SyphonServerDescriptionNameKey] ? ` - ${server[SyphonServerDescriptionNameKey]}` : '' }}

      .rounded.border.border-input.h-10.flex.items-center.justify-center.ml-4.mr-4.text-sm.text-background.font-semibold.console(
        class="w-[30%]"
      ) {{ width }} x {{ height }} : {{ fps }} FPS
  .bg-background.w-full.flex-1.flex.flex-col
    .w-full.flex.flex-1.bg-black.overflow-hidden
      syphon-client-canvas(
        :server="serverDescription",
        type="metal",
        @fps="onFpsChange",
        @resize="onResize"
      ).w-full
</template>

<style scoped>
.titlebar {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
}

.console {
  background: rgb(179, 180, 127);
}

.no-drag {
  -webkit-app-region: no-drag;
  pointer-events: all;
}

.titlebar-icon:hover {
  color: rgb(179, 180, 127);
}
</style>
