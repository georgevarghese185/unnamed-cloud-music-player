import type { ImportJob, ImportProgress, Track, TrackImporter } from 'app/src-core/library';
import type { TrackImportError } from 'app/src-core/library/track-importer';
import { inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import {
  importErrorsInjectionKey,
  importJobInjectionKey,
  importProgressInjectionKey,
  libraryInjectionKey,
} from './use-library-provider';
import createLibrary from './library-factory';

export default function useLibrary() {
  const library = inject(libraryInjectionKey, shallowRef(createLibrary()));
  const importJob = inject(importJobInjectionKey, ref(null));
  const importProgress = inject(importProgressInjectionKey, ref(null));
  const importErrors = inject(importErrorsInjectionKey, ref([]));

  function onImportProgress(tracks: Track[], progress: ImportProgress) {
    importProgress.value = progress;
  }

  function onImportErrors(errors: TrackImportError[]) {
    importErrors.value = [...importErrors.value, ...errors];
  }

  function onImportComplete(progress: ImportProgress) {
    importProgress.value = progress;
  }

  function onImport(job: ImportJob) {
    job.on('import', onImportProgress);
    job.on('importError', onImportErrors);
    job.on('complete', onImportComplete);
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
  });

  async function startImport(importer: TrackImporter) {
    const importInProgress = importProgress.value && !importProgress.value.completed;

    if (importInProgress) {
      return;
    }

    importErrors.value = []; // reset errors
    importJob.value = await library.value.import(importer);
    importProgress.value = importJob.value.getProgress();
    onImport(importJob.value);
  }

  return {
    import: {
      start: startImport,
      progress: importProgress,
      errors: importErrors,
    },
    player: library.value.player,
  };
}
