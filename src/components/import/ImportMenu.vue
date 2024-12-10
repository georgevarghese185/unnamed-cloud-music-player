<template>
  <div class="row reverse q-mr-md">
    <q-btn color="primary" label="Import" @click="sourcePickerDialog = true" />

    <ImportSourcePicker v-model="sourcePickerDialog" @pick="startImport" />

    <ImportProgress v-model="importDialog" />
  </div>
</template>

<script setup lang="ts">
import { useLibrary } from 'src/composables/library';
import { ref } from 'vue';
import ImportSourcePicker from 'src/components/import/ImportSourcePicker.vue';
import ImportProgress from 'src/components/import/ImportProgress.vue';
import type { TrackImporter } from 'app/src-core/library';

const library = useLibrary();
const sourcePickerDialog = ref(false);
const importDialog = ref(false);

function startImport(importer: TrackImporter) {
  library.import.start(importer);
  sourcePickerDialog.value = false;
  importDialog.value = true;
}
</script>
