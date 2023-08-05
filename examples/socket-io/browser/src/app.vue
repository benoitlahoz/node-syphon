<script setup lang="ts">
import { Socket } from 'socket.io-client';
import { nextTick, ref, onMounted, onBeforeUnmount } from 'vue';
import type { Ref, PropType } from 'vue';
import { Messages } from '../../common';

const props = defineProps({
  socket: {
    type: Object as PropType<Socket>,
  },
});

const serversDirectory: Ref<Array<any>> = ref([]);

onMounted(() => {
  nextTick(() => {
    // console.log(props.socket.connected);
    props.socket.on(Messages.AllServers, fillServers);
    props.socket.on(Messages.ServerAnnounced, onAnnounce);
    props.socket.on(Messages.ServerRetired, onRetire);
    props.socket.on(Messages.ServerUpdated, onUpdate);

    if (props.socket.connected) {
      fetchServers();
    } else {
      props.socket.on('connect', () => {
        // console.log(props.socket.connected);
        fetchServers();
      });
    }
  });
});

onBeforeUnmount(() => {
  props.socket.off(Messages.AllServers, fillServers);
});

const fetchServers = () => {
  props.socket.emit(Messages.GetAllServers, fillServers);
};

const fillServers = (servers: any) => {
  console.log('fill', servers);
  nextTick(() => {
    serversDirectory.value = servers;
  });
};

const onAnnounce = (server: any) => {
  // Check if the server wasn't recorded yet, even if it disappeared in the meantime (TODO)
  const found = serversDirectory.value.find(
    (s: any) => s.SyphonServerDescriptionUUIDKey === server.SyphonServerDescriptionUUIDKey
  );
  if (found) {
    console.log('TODO: Check if the server was recorded yet.');
    return;
  }

  // Add the new server to our directory.
  serversDirectory.value.push(server);
};

const onRetire = (server: any) => {
  const found = serversDirectory.value.find(
    (s: any) => s.SyphonServerDescriptionUUIDKey === server.SyphonServerDescriptionUUIDKey
  );

  if (found) {
    console.warn('TODO: Make the server disconnected instead of deleting it.');
    const index = serversDirectory.value.indexOf(found);
    serversDirectory.value.splice(index, 1);
    return;
  }
};

const onUpdate = (server: any) => {
  console.log('Update', server);
};
</script>
<template lang="pug">
.container 
  .sidebar 
    .header 
      h2 node-syphon
    .server-button(v-for="server in serversDirectory", :data-syphon-server="server.SyphonServerDescriptionUUIDKey") 
      | {{ server.SyphonServerDescriptionAppNameKey }}{{ server.SyphonServerDescriptionNameKey.trim().length> 0 ? ` - ${server.SyphonServerDescriptionNameKey.trim()}` : '' }}
  .main-content
    .card 
      .header
        h1 node-syphon
      .content 
        div An experimental package to produce and listen to Syphon Framework servers. Even if designed mainly to work with Electron applications, it can be used to stream images to / from a server running on macOS and using Syphon for its own purposes.
        .separator 
        div Something here
</template>
<style lang="sass">
@import url(https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Mulish:wght@300;400;500;600;700;800;900&display=swap)

@font-family: 'Montserrat', sans-serif
@font-family: 'Mulish', sans-serif

$space-small: 0.5rem
$space-medium: 1rem
$space-large: 1.5rem

$border-radius: 0.5rem
$line-height: 1.8em

html,
body,
#app
  background: rgb(18, 21, 26)
  color: white
  font-family: 'Montserrat'
  font-size: 14px
  height: 100%
  margin: 0
  padding: 0

h1, h2, h3, h4
  font-family: 'Mulish'
  margin: 0
  padding: 0

.container
  align-items: center
  display: flex
  height: 100%
  justify-content: center
  width: 100%

.sidebar
  background: rgb(8, 10, 12)
  border-right: 1px solid rgb(36, 41, 46)
  height: 100%
  max-width: 300px
  width: 20%
  .header
    padding: $space-medium $space-medium $space-large $space-medium

.server-button
  border: 1px solid rgb(36, 41, 46)
  border-radius: $border-radius
  margin: $space-small
  padding: $space-medium

.main-content
  align-items: center
  display: flex
  flex-grow: 1
  height: 100%
  justify-content: center

.card
  border: 1px solid rgb(36, 41, 46)
  border-radius: $border-radius
  display: flex
  flex-direction: column
  max-width: 100%
  width: 900px
  .header
    background: rgb(8, 10, 12)
    border-bottom: 1px solid rgb(36, 41, 46)
    border-radius: $border-radius $border-radius 0 0
    padding: $space-medium $space-medium $space-large $space-medium
  .content
    background: rgb(14, 15, 18)
    border-radius: 0 0 $border-radius $border-radius
    line-height: $line-height
    padding: $space-medium
  .separator
    margin: $space-medium 0
    width: 100%
    height: 1px
    border-bottom: 1px solid rgb(36, 41, 46)
</style>
