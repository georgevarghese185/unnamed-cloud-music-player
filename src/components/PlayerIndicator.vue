<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-card v-if="currentlyPlaying" class="absolute-bottom q-mx-lg">
    <q-card-section>
      <div class="row">
        <img v-if="artworkUrl" class="album-art col-auto" :src="artworkUrl" />
        <img v-else class="album-art col-auto" />
        <div class="q-ml-lg col column">
          <p class="row q-ma-none">{{ artist }} - {{ title }}</p>
          <p class="row q-ma-none">{{ album }}</p>
        </div>
        <q-btn
          class="col-auto"
          :icon="state === 'playing' ? 'pause' : 'arrow_right'"
          @click="togglePlayState"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { usePlayer, useTracks } from 'src/composables/library';

const { currentlyPlaying, state, pause, resume } = usePlayer();
const { getArtwork } = useTracks();

const title = computed(
  () => currentlyPlaying.value?.metadata?.title || currentlyPlaying.value?.file.name,
);
const artist = computed(() => currentlyPlaying.value?.metadata?.artist || 'Unknown Artist');
const album = computed(() => currentlyPlaying.value?.metadata?.album || 'Unknown Album');
const artworkUrl = ref<string | null>(null);

watch(currentlyPlaying, async () => {
  if (artworkUrl.value) {
    URL.revokeObjectURL(artworkUrl.value);
    artworkUrl.value = null;
  }

  if (!currentlyPlaying.value) {
    return;
  }

  const artworkData = await getArtwork(currentlyPlaying.value);

  if (!artworkData) {
    return;
  }

  artworkUrl.value = URL.createObjectURL(new Blob([artworkData]));
});

function togglePlayState() {
  if (state.value === 'playing') {
    pause();
  } else {
    resume();
  }
}
</script>

<style lang="css" scoped>
.album-art {
  background: #c4c4c4;
  width: 52px;
  height: 52px;
  border-radius: 5px;
}
</style>
