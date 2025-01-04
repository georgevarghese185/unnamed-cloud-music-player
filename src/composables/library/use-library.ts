/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ShallowRef } from 'vue';
import { inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { Notify } from 'quasar';
import {
  importErrorsInjectionKey,
  importJobInjectionKey,
  importProgressInjectionKey,
  libraryInjectionKey,
  tracksInjectionKey,
} from './use-library-provider';
import type {
  ImportJob,
  ImportProgress,
  Library,
  Track,
  TrackImportError,
} from 'app/src-core/library';
import type { Source } from 'app/src-core/source';
import type { PlaybackError } from 'app/src-core/audio-player';

function injectLibrary(): ShallowRef<Library> {
  const library = inject(libraryInjectionKey);

  if (!library) {
    throw new Error('Library should have been provided with provide()');
  }

  return library;
}

export default function useLibrary() {
  const library = injectLibrary();
  const importJob = inject(importJobInjectionKey, ref(null));
  const importProgress = inject(importProgressInjectionKey, ref(null));
  const importErrors = inject(importErrorsInjectionKey, ref([]));
  const { tracks, setTracks } = inject(tracksInjectionKey, {
    tracks: shallowRef([]),
    setTracks: () => {},
  });
  const currentlyPlaying = ref(library.value.player.currentlyPlaying);
  const playerState = ref(library.value.player.state);

  function onImportProgress(tracks: Track[], progress: ImportProgress) {
    importProgress.value = progress;
  }

  function onImportErrors(errors: TrackImportError[]) {
    importErrors.value = [...importErrors.value, ...errors];
  }

  function onImportComplete(progress: ImportProgress) {
    importProgress.value = progress;
    void findTracks();
  }

  function onImport(job: ImportJob) {
    job.on('import', onImportProgress);
    job.on('importError', onImportErrors);
    job.on('complete', onImportComplete);
  }

  function onPlayerStateChange() {
    currentlyPlaying.value = library.value.player.currentlyPlaying;
    playerState.value = library.value.player.state;
  }

  function onPlayerError(e: PlaybackError) {
    Notify.create({
      type: 'negative',
      message: e.message,
    });
  }

  onMounted(() => {
    if (importJob.value) {
      onImport(importJob.value);
    }

    library.value.player.on('play', onPlayerStateChange);
    library.value.player.on('pause', onPlayerStateChange);
    library.value.player.on('error', onPlayerError);
  });

  onUnmounted(() => {
    importJob.value?.off('import', onImportProgress);
    importJob.value?.off('importError', onImportErrors);
    importJob.value?.off('complete', onImportComplete);
    library.value.player.off('play', onPlayerStateChange);
    library.value.player.off('pause', onPlayerStateChange);
    library.value.player.off('error', onPlayerError);
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

  return {
    import: {
      start: startImport,
      progress: importProgress,
      errors: importErrors,
    },
    getSource: library.value.getSource.bind(library.value),
    tracks: {
      list: tracks,
      find: findTracks,
    },
    player: {
      play: library.value.player.play.bind(library.value.player),
      pause: library.value.player.pause.bind(library.value.player),
      resume: library.value.player.resume.bind(library.value.player),
      state: playerState,
      currentlyPlaying,
    },
  };
}
