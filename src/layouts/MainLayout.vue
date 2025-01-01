<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <div class="window-height" style="display: flex; flex-direction: column">
    <nav-header :links="links" class="row" />

    <main class="column no-wrap" style="padding-top: 0; flex: 1 1 auto; overflow: hidden">
      <router-view />

      <q-card v-if="currentlyPlaying" class="absolute-bottom q-mx-lg">
        <q-card-section> {{ currentlyPlaying.name }} </q-card-section>
      </q-card>
    </main>
  </div>
</template>

<script setup lang="ts">
import NavHeader from 'src/components/NavHeader.vue';
import type { NavLink } from 'src/components/nav-header-models';
import { useI18n } from 'vue-i18n';
import useLibrary from 'src/composables/library/use-library';

const { t } = useI18n();
const library = useLibrary();

const currentlyPlaying = library.player.currentlyPlaying;

const links: NavLink[] = [
  {
    title: t('header.library'),
    path: 'library',
  },
];
</script>
