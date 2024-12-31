<!-- This Source Code Form is subject to the terms of the Mozilla Public
- License, v. 2.0. If a copy of the MPL was not distributed with this
- file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <div class="q-pl-md" style="flex: 1 1 auto; overflow: auto">
    <q-virtual-scroll :items="tracks" separator v-slot="{ item }">
      <q-item :key="item.id" dense class="no-border">
        <div class="row items-center q-mt-md cursor-pointer col-grow" @click="play(item)">
          <img class="album-art" />
          <p class="q-ma-none q-ml-sm text-center">{{ item.name }}</p>
        </div>
      </q-item>
    </q-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import type { Track } from 'app/src-core/library';
import { useLibrary } from 'src/composables/library';
import { onMounted } from 'vue';

const library = useLibrary();

onMounted(() => library.tracks.find());

function play(track: Track) {
  library.play(track);
}

const tracks = library.tracks.list;
</script>

<style scoped>
.album-art {
  background: #c4c4c4;
  width: 52px;
  height: 52px;
  border-radius: 5px;
}
</style>
