<!-- This Source Code Form is subject to the terms of the Mozilla Public
- License, v. 2.0. If a copy of the MPL was not distributed with this
- file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-dialog v-model="model" backdrop-filter="blur(4px)">
    <q-card style="width: 400px; max-width: 80vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Import Music</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-list separator>
        <q-item v-if="deviceSource" clickable v-ripple @click="importFromDevice('file')">
          <q-item-section>Import files</q-item-section>
        </q-item>

        <q-item v-if="deviceSource" clickable v-ripple @click="importFromDevice('folder')">
          <q-item-section>Import folders</q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { Source } from 'app/src-core/source';
import type { DeviceSource } from 'app/src-core/source/device';
import { DEVICE_SOURCE_NAME } from 'app/src-core/source/device';
import { useImport } from 'src/composables/library';

const { getSource } = useImport();

const model = defineModel<boolean>({ default: true });
const emits = defineEmits<{
  <K extends string, I, M>(e: 'pick', source: Source<K, I, M>, inputs: I): void;
}>();

const deviceSource: DeviceSource | undefined = getSource(DEVICE_SOURCE_NAME);

const importFromDevice = async (type: 'file' | 'folder') => {
  if (!deviceSource) {
    return;
  }

  const filePaths = await window.bridge.file.openFileSelector({
    files: type === 'file',
    folders: type === 'folder',
    multi: true,
  });

  if (!filePaths) {
    return;
  }

  emits('pick', deviceSource, filePaths);
};
</script>
