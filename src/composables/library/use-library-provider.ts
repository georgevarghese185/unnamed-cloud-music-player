import type { ImportJob, ImportProgress } from 'app/src-core/library';
import type { Library } from 'app/src-core/library';
import type { InjectionKey, Ref, ShallowRef } from 'vue';
import { provide, ref, shallowRef } from 'vue';
import createLibrary from './library-factory';
import type { TrackImportError } from 'app/src-core/library/track-importer';

export const libraryInjectionKey = Symbol() as InjectionKey<ShallowRef<Library>>;
export const importJobInjectionKey = Symbol() as InjectionKey<ShallowRef<ImportJob | null>>;
export const importProgressInjectionKey = Symbol() as InjectionKey<Ref<ImportProgress | null>>;
export const importErrorsInjectionKey = Symbol() as InjectionKey<Ref<TrackImportError[]>>;

export default function useLibraryProvider() {
  const library = shallowRef<Library>(createLibrary());
  const importJob = shallowRef<ImportJob | null>(null);
  const importProgress = ref<ImportProgress | null>(null);
  const importErrors = ref<TrackImportError[]>([]);

  provide(libraryInjectionKey, library);
  provide(importJobInjectionKey, importJob);
  provide(importProgressInjectionKey, importProgress);
  provide(importErrorsInjectionKey, importErrors);
}
