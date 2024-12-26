<!-- This Source Code Form is subject to the terms of the Mozilla Public
- License, v. 2.0. If a copy of the MPL was not distributed with this
- file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <div class="q-pl-md" data-cy="songs-page" style="flex: 1 1 auto; overflow: auto">
    <q-virtual-scroll :items="tracks" separator v-slot="{ item }">
      <q-item :key="item.id" dense class="row items-center q-mt-md no-border">
        <img class="album-art" />
        <p class="q-ma-none q-ml-sm text-center">{{ item.name }}</p>
      </q-item>
    </q-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import { useLibrary } from 'src/composables/library';
import { onMounted } from 'vue';

const library = useLibrary();

onMounted(() => library.tracks.find());

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
