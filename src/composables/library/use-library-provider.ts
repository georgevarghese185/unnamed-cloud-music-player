/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { InjectionKey, Ref, ShallowRef } from 'vue';
import { inject, provide, ref, shallowRef } from 'vue';
import createLibrary from './library-factory';
import type {
  Library,
  ImportJob,
  ImportProgress,
  Track,
  TrackImportError,
  MetadataExtractionJob,
} from 'app/src-core/library';

export const libraryInjectionKey = Symbol() as InjectionKey<ShallowRef<Library>>;
export const importJobInjectionKey = Symbol() as InjectionKey<ShallowRef<ImportJob | null>>;
export const metadataJobInjectionKey = Symbol() as InjectionKey<
  ShallowRef<MetadataExtractionJob | null>
>;
export const importProgressInjectionKey = Symbol() as InjectionKey<Ref<ImportProgress | null>>;
export const importErrorsInjectionKey = Symbol() as InjectionKey<Ref<TrackImportError[]>>;
export const tracksInjectionKey = Symbol() as InjectionKey<{
  tracks: ShallowRef<Track[]>;
  setTracks: (tracks: Track[]) => void;
}>;

export function injectLibrary(): ShallowRef<Library> {
  const library = inject(libraryInjectionKey);

  if (!library) {
    throw new Error('Library should have been provided with provide()');
  }

  return library;
}

export default function useLibraryProvider() {
  const library = shallowRef<Library>(createLibrary());
  const importJob = shallowRef<ImportJob | null>(null);
  const metadataJob = shallowRef<MetadataExtractionJob | null>(library.value.updateAllMetadata());
  const importProgress = ref<ImportProgress | null>(null);
  const importErrors = ref<TrackImportError[]>([]);
  const tracks = shallowRef<Track[]>([]);

  provide(libraryInjectionKey, library);
  provide(importJobInjectionKey, importJob);
  provide(metadataJob, metadataJob);
  provide(importProgressInjectionKey, importProgress);
  provide(importErrorsInjectionKey, importErrors);
  provide(tracksInjectionKey, {
    tracks,
    setTracks(_tracks) {
      tracks.value = _tracks;
    },
  });
}
