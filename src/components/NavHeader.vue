<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-header class="bg-white row q-pl-md q-pt-md">
    <router-link
      v-for="link in links"
      :key="link.title"
      :to="link.path"
      class="text-h3 link text-black"
    >
      {{ link.title }}
    </router-link>
  </q-header>
</template>

<script setup lang="ts">
import type { NavLink } from './nav-header-models';

const props = defineProps<{ links: NavLink[] }>();
const links = props.links;
</script>

<style lang="scss" scoped>
.link:link {
  text-decoration: none;
}

.link:visited {
  text-decoration: none;
}

.link:hover {
  text-decoration: none;
}

.link:active {
  text-decoration: none;
}
</style>
