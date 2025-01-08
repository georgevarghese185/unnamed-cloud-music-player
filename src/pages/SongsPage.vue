<!-- This Source Code Form is subject to the terms of the Mozilla Public
- License, v. 2.0. If a copy of the MPL was not distributed with this
- file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <div class="q-pl-md" style="flex: 1 1 auto; overflow: auto" ref="scroll-target">
    <q-virtual-scroll
      :items="list"
      separator
      v-slot="{ item }"
      :scroll-target="scrollTarget || undefined"
    >
      <q-item :key="item.id" dense class="no-border">
        <TrackListItem :track="item" @click="play(item)" />
      </q-item>
    </q-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';
import TrackListItem from 'src/components/track/TrackListItem.vue';
import { usePlayer, useTracks } from 'src/composables/library';
import type { Track } from 'app/src-core/library';

const scrollTarget = useTemplateRef('scroll-target');
const { find, list } = useTracks();
const { play: playTrack } = usePlayer();

onMounted(() => find());

function play(track: Track) {
  playTrack(track);
}
</script>
