import type { TrackImporter } from '../library';

export interface Source<K extends string, I> {
  name: K;
  import(inputs: I): TrackImporter;
}
