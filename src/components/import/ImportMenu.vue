<!-- This Source Code Form is subject to the terms of the Mozilla Public
- License, v. 2.0. If a copy of the MPL was not distributed with this
- file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <div class="row reverse q-mr-md">
    <q-btn color="primary" :label="t('import.importButton')" @click="sourcePickerDialog = true" />

    <ImportSourcePicker v-model="sourcePickerDialog" @pick="startImport" />

    <ImportProgress v-model="importDialog" />
  </div>
</template>

<script setup lang="ts">
import { useLibrary } from 'src/composables/library';
import { ref } from 'vue';
import ImportSourcePicker from 'src/components/import/ImportSourcePicker.vue';
import ImportProgress from 'src/components/import/ImportProgress.vue';
import type { Source } from 'app/src-core/source';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const library = useLibrary();
const sourcePickerDialog = ref(false);
const importDialog = ref(false);

function startImport<K extends string, I>(source: Source<K, I>, inputs: I) {
  library.import.start(source, inputs);
  sourcePickerDialog.value = false;
  importDialog.value = true;
}
</script>
