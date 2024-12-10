<template>
  <q-dialog v-model="model" backdrop-filter="blur(4px)">
    <q-card style="width: 400px; max-width: 80vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Import Music</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-list separator>
        <q-item clickable v-ripple @click="importFromDevice('file')">
          <q-item-section>Import files</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="importFromDevice('folder')">
          <q-item-section>Import folders</q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { TrackImporter } from 'app/src-core/library';
import { DeviceSource } from 'app/src-core/source/device';
import { ElectronDeviceStorage } from 'app/src-electron/storage/device/electron-device-storage';
import { useLibrary } from 'src/composables/library';

const model = defineModel<boolean>({ default: true });
const emits = defineEmits<{
  (e: 'pick', importer: TrackImporter): void;
}>();
const { player } = useLibrary();

const importFromDevice = async (type: 'file' | 'folder') => {
  const filePaths = await window.bridge.file.openFileSelector({
    files: type === 'file',
    folders: type === 'folder',
    multi: true,
  });

  if (!filePaths) {
    return;
  }

  const deviceSource = new DeviceSource(new ElectronDeviceStorage(), player);
  const importer = deviceSource.import(...filePaths);

  emits('pick', importer);
};
</script>
