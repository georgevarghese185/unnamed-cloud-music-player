<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-card v-if="currentlyPlaying" class="absolute-bottom q-mx-lg">
    <q-card-section>
      <q-slider
        class="row"
        :model-value="currentTime"
        @update:model-value="onSeek"
        :min="0"
        :max="currentlyPlaying.metadata?.duration || 0"
      />
      <div class="row">
        <img v-if="artworkUrl" class="album-art col-auto" :src="artworkUrl" />
        <img v-else class="album-art col-auto" />
        <div class="q-ml-lg col column">
          <p class="row q-ma-none">{{ artist }} - {{ title }}</p>
          <p class="row q-ma-none">{{ album }}</p>
        </div>
        <p class="col-auto">{{ currentTimeString }}</p>
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
import { usePlayer, useTrackInfo, usePlaytime } from 'src/composables/library';

const { pause, resume, currentlyPlaying, state, seek } = usePlayer();
const { album, artist, artworkUrl, title } = useTrackInfo(currentlyPlaying);
const { currentTime, currentTimeString } = usePlaytime();

function onSeek(value: number | null) {
  if (value) {
    seek(value);
  }
}

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
