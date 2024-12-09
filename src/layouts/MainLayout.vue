<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-layout view="hHh lpR fFf">
    <nav-header :links="links" />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import NavHeader from 'src/components/NavHeader.vue';
import type { NavLink } from 'src/components/nav-header-models';

const links: NavLink[] = [
  {
    title: 'Library',
    path: 'library',
  },
];
</script>
