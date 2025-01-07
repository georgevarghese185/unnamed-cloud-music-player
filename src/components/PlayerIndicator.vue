<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-card v-if="currentlyPlaying" class="absolute-bottom q-mx-lg">
    <q-card-section>
      <div class="row">
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
import { computed } from 'vue';
import { usePlayer } from 'src/composables/library';

const { currentlyPlaying, state, pause, resume } = usePlayer();

const title = computed(
  () => currentlyPlaying.value?.metadata?.title || currentlyPlaying.value?.file.name,
);
const artist = computed(() => currentlyPlaying.value?.metadata?.artist || 'Unknown Artist');
const album = computed(() => currentlyPlaying.value?.metadata?.album || 'Unknown Album');

function togglePlayState() {
  if (state.value === 'playing') {
    pause();
  } else {
    resume();
  }
}
</script>
