<!-- This Source Code Form is subject to the terms of the Mozilla Public
- License, v. 2.0. If a copy of the MPL was not distributed with this
- file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <div class="row items-center q-mt-md cursor-pointer col-grow">
    <img v-if="artworkUrl" class="album-art col-auto" :src="artworkUrl" />
    <img v-else class="album-art col-auto" />
    <p class="q-ma-none q-ml-sm text-center">{{ artist }} - {{ title }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { globalEvents, type Track } from 'app/src-core/library';
import { useTrackInfo } from 'src/composables/library';

const props = defineProps<{ track: Track }>();
const track = ref(props.track);
const { artist, artworkUrl, title } = useTrackInfo(track);

function refreshTrack(_track: Track) {
  track.value = _track;
}

onMounted(() => {
  globalEvents.on(`trackMetadataUpdate:${track.value.id}`, refreshTrack);
});

onUnmounted(() => {
  globalEvents.off(`trackMetadataUpdate:${track.value.id}`, refreshTrack);
});
</script>

<style scoped>
.album-art {
  background: #c4c4c4;
  width: 52px;
  height: 52px;
  border-radius: 5px;
}
</style>
