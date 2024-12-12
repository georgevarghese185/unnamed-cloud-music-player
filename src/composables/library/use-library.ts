import type { ImportJob, ImportProgress, Track } from 'app/src-core/library';
import type { TrackImportError } from 'app/src-core/library/track-importer';
import { inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import {
  importErrorsInjectionKey,
  importJobInjectionKey,
  importProgressInjectionKey,
  libraryInjectionKey,
} from './use-library-provider';
import createLibrary from './library-factory';
import type { Source } from 'app/src-core/source';

export default function useLibrary() {
  const library = inject(libraryInjectionKey, shallowRef(createLibrary()));
  const importJob = inject(importJobInjectionKey, ref(null));
  const importProgress = inject(importProgressInjectionKey, ref(null));
  const importErrors = inject(importErrorsInjectionKey, ref([]));

  const tracks = shallowRef<Track[]>([]);

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

  function startImport<K extends string, I>(source: Source<K, I>, inputs: I) {
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
    tracks.value = await library.value.tracks.list({ limit: 1000000, offset: 0 });
  }

  return {
    import: {
      start: startImport,
      progress: importProgress,
      errors: importErrors,
    },
    player: library.value.player,
    getSource: library.value.getSource.bind(library.value),
    tracks: {
      list: tracks,
      find: findTracks,
    },
  };
}
