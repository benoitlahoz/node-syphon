<script setup lang="ts">
import type { SyphonServerDescription } from 'node-syphon/universal';
import {
  SyphonServerDescriptionAppNameKey,
  SyphonServerDescriptionUUIDKey,
} from 'node-syphon/universal';
import { ref } from 'vue';
import { useColorMode } from '@vueuse/core';
import { useSyphon } from './composables/useSyphon';
import {
  Select as SelectMain,
  SelectContent,
  SelectGroup,
  SelectItem,
  // SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { default as SyphonCanvas } from '@/components/syphon/SyphonCanvas.vue';

useColorMode();

const { servers, serverByUUID } = useSyphon();
const serverDescription = ref<SyphonServerDescription>();

const onChange = async (uuid: string) => {
  serverDescription.value = serverByUUID(uuid);
};
</script>

<template lang="pug">
.bg-background.w-full.h-full.flex.flex-col.p-4.text-sm
  .w-full
    select-main(
      @update:model-value="onChange"
    )
      select-trigger(
        class="w-[300px]"
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
          ) {{ server[SyphonServerDescriptionAppNameKey] }}
  .w-full.flex.flex-1.mt-4.bg-black.overflow-hidden
    syphon-canvas(
      :server="serverDescription"
    ).w-full
</template>
