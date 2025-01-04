<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-card v-if="currentlyPlaying" class="absolute-bottom q-mx-lg">
    <q-card-section>
      <div class="row">
        <q-btn
          :icon="playerState === 'playing' ? 'pause' : 'arrow_right'"
          @click="togglePlayState"
        />
        <p>{{ currentlyPlaying.file.name }}</p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import useLibrary from 'src/composables/library/use-library';

const library = useLibrary();

const currentlyPlaying = library.player.currentlyPlaying;
const playerState = library.player.state;

function togglePlayState() {
  if (library.player.state.value === 'playing') {
    library.player.pause();
  } else {
    library.player.resume();
  }
}
</script>
