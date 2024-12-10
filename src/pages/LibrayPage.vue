<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-page>
    <ImportMenu />

    <router-view />
  </q-page>
</template>

<script setup lang="ts">
import ImportMenu from 'src/components/import/ImportMenu.vue';
import { useLibraryProvider } from 'src/composables/library';

useLibraryProvider();
</script>
