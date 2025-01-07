/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { Notify } from 'quasar';
import {
  importErrorsInjectionKey,
  importJobInjectionKey,
  importProgressInjectionKey,
  injectLibrary,
  metadataJobInjectionKey,
  tracksInjectionKey,
} from './use-library-provider';
import type {
  ImportJob,
  ImportProgress,
  MetadataExtractionError,
  Track,
  TrackImportError,
} from 'app/src-core/library';
import type { Source } from 'app/src-core/source';

export default function useLibrary() {
  const library = injectLibrary();
  const importJob = inject(importJobInjectionKey, ref(null));
  const metadataJob = inject(metadataJobInjectionKey, ref(null));
  const importProgress = inject(importProgressInjectionKey, ref(null));
  const importErrors = inject(importErrorsInjectionKey, ref([]));
  const { setTracks } = inject(tracksInjectionKey, {
    tracks: shallowRef([]),
    setTracks: () => {},
  });

  function onImportProgress(tracks: Track[], progress: ImportProgress) {
    importProgress.value = progress;
  }

  function onImportErrors(errors: TrackImportError[]) {
    importErrors.value = [...importErrors.value, ...errors];
  }

  function onImportComplete(progress: ImportProgress) {
    importProgress.value = progress;
    void findTracks();
    void updateMetadata();
  }

  function onImport(job: ImportJob) {
    job.on('import', onImportProgress);
    job.on('importError', onImportErrors);
    job.on('complete', onImportComplete);
  }

  function onMetadataComplete() {
    metadataJob.value = null;
  }

  function onMetadataError(e: MetadataExtractionError) {
    Notify.create({ type: 'negative', message: e.message });
  }

  onMounted(() => {
    if (importJob.value) {
      onImport(importJob.value);
    }
  });

  onUnmounted(() => {
    importJob.value?.off('import', onImportProgress);
    importJob.value?.off('importError', onImportErrors);
    importJob.value?.off('complete', onImportComplete);
    metadataJob.value?.off('error', onMetadataError);
    metadataJob.value?.off('complete', onMetadataComplete);
  });

  function startImport<K extends string, I, M>(source: Source<K, I, M>, inputs: I) {
    const importInProgress = importProgress.value && !importProgress.value.completed;

    if (importInProgress) {
      return;
    }

    importErrors.value = []; // reset errors
    importJob.value = library.value.import(source, inputs);
    importProgress.value = importJob.value.getProgress();
    onImport(importJob.value);
  }

  async function findTracks() {
    setTracks(await library.value.tracks.list({ limit: 1000000, offset: 0 }));
  }

  async function updateMetadata() {
    if (metadataJob.value) {
      await metadataJob.value.cancel();
    }

    metadataJob.value = library.value.updateAllMetadata();
    metadataJob.value.on('error', onMetadataError);
    metadataJob.value.on('complete', onMetadataComplete);
  }

  return {
    import: startImport,
    importProgress,
    importErrors,
    getSource: library.value.getSource.bind(library.value),
  };
}
