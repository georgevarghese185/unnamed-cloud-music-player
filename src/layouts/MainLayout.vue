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

<script lang="ts">
import { defineComponent } from 'vue';
import NavHeader from 'src/components/NavHeader.vue';
import { NavLink } from 'src/components/nav-header-models';

const links: NavLink[] = [
  {
    title: 'Library',
    path: 'library',
  },
];

export default defineComponent({
  name: 'MainLayout',
  components: { NavHeader },
  setup() {
    return {
      links,
    };
  },
});
</script>
