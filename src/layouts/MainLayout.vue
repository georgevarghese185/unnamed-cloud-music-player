<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <div class="window-height" style="display: flex; flex-direction: column">
    <nav-header :links="links" class="row" />

    <main class="column no-wrap" style="padding-top: 0; flex: 1 1 auto; overflow: hidden">
      <router-view />

      <PlayerIndicator />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import NavHeader from 'src/components/NavHeader.vue';
import type { NavLink } from 'src/components/nav-header-models';
import PlayerIndicator from 'src/components/PlayerIndicator.vue';

const { t } = useI18n();

const links: NavLink[] = [
  {
    title: t('header.library'),
    path: 'library',
  },
];
</script>
