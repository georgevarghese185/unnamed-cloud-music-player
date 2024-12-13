<!-- This Source Code Form is subject to the terms of the Mozilla Public
- License, v. 2.0. If a copy of the MPL was not distributed with this
- file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template>
  <q-dialog v-model="model" backdrop-filter="blur(4px)">
    <q-card style="width: 700px; max-width: 80vw" class="q-px-lg">
      <q-card-section>
        <div class="text-h6">{{ t('import.progress.title') }}</div>
      </q-card-section>

      <div class="error-list overflow-auto rounded-borders q--avoid-card-border">
        <p v-if="importErrors.length == 0">{{ t('import.progress.noErrors') }}</p>
        <p v-else v-for="(error, i) of importErrors" :key="i">{{ error }}</p>
      </div>

      <p class="q-mt-md">
        {{ t('import.progress.totalSongsImported', { imported: importProgress?.imported }) }}
      </p>

      <q-card-actions
        v-if="importProgress?.completed"
        align="right"
        class="bg-white text-teal"
        @click="model = false"
      >
        <q-btn flat :label="t('import.progress.doneButton')" v-close-popup />
      </q-card-actions>

      <q-linear-progress v-else query />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useLibrary } from 'src/composables/library';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const library = useLibrary();

const model = defineModel<boolean>({ default: true });
const importProgress = library.import.progress;
const importErrors = library.import.errors;
</script>

<style lang="css" scoped>
.error-list {
  height: 200px;
  background-color: rgb(231, 231, 231);
  white-space: pre-wrap;
}
</style>
