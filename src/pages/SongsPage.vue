<template>
  <div>
    <div v-for="song of songs" :key="song.id" class="row items-center">
      <img class="album-art" />
      <p class="q-ma-none text-center">{{ song.name }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Track } from 'app/src-core/library';

const songs: Track[] = new Array(100).fill(null).map((_, index) => ({
  id: index,
  name: `Song ${index + 1}`,
  identifiers: [{ name: 'identifier', value: `value ${index}` }],
  source: {
    name: 'device',
    meta: { filePath: `/${index}.mp3` },
  },
}));
</script>

<style scoped>
.album-art {
  background: #c4c4c4;
  width: 58px;
  height: 58px;
  border-radius: 5px;
}
</style>
