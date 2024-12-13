/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import EventEmitter from 'events';
import { differenceWith } from 'lodash';
import type { Player } from '../player';
import type { TrackStore } from './store/track';
import type { Track } from './track';
import { eqIdentifiers, getIdentifiers } from './track';
import type { TrackImporter } from './track-importer';
import { TrackImportError } from './track-importer';
import type { Source } from '../source';

export class UnsupportedSourceError extends Error {
  constructor(sourceName: string) {
    super(`Source '${sourceName}' is not supported`);
  }
}

export interface ImportJob {
  getProgress(): ImportProgress;
  on<Event extends keyof ImportJobEvents>(event: Event, handler: ImportJobEvents[Event]): void;
  off<Event extends keyof ImportJobEvents>(event: Event, handler: ImportJobEvents[Event]): void;
}

export type ImportProgress = {
  completed: boolean;
  imported: number;
  errors: TrackImportError[];
};

export type ImportJobEvents = {
  complete: (progress: ImportProgress) => void;
  import: (tracks: Track[], progress: ImportProgress) => void;
  importError: (errors: TrackImportError[]) => void;
};

class ImportJobImpl extends EventEmitter implements ImportJob {
  private progress: ImportProgress = {
    completed: false,
    imported: 0,
    errors: [],
  };

  getProgress() {
    return { ...this.progress };
  }

  onComplete() {
    this.progress.completed = true;
    this.emit('complete', this.getProgress());
  }

  onImport(tracks: Track[]) {
    this.progress.imported += tracks.length;
    this.emit('import', tracks, this.getProgress());
  }

  onImportError(errors: TrackImportError[]) {
    this.progress.errors = [...this.progress.errors, ...errors];
    this.emit('importError', errors);
  }
}

const split = (tracksAndErrors: (Track | TrackImportError)[]): [Track[], TrackImportError[]] => {
  const tracks: Track[] = [];
  const errors: TrackImportError[] = [];

  tracksAndErrors.forEach((trackOrError) => {
    if (trackOrError instanceof TrackImportError) {
      errors.push(trackOrError);
    } else {
      tracks.push(trackOrError);
    }
  });

  return [tracks, errors];
};

export class Library {
  readonly player: Player;
  readonly tracks: TrackStore;

  constructor(private options: LibraryOptions) {
    this.player = options.player;
    this.tracks = options.store.tracks;
  }

  getSource<K extends string, I, S extends Source<K, I>>(sourceName: K): S | undefined {
    const source = this.options.sources.find((s): s is S => s.name === sourceName);
    return source;
  }

  import<K extends string, I, S extends Source<K, I>>(source: S, inputs: I): ImportJob {
    const importer = source.import(inputs);
    const job = new ImportJobImpl();
    setTimeout(() => this.startImport(importer, job));
    return job;
  }

  private async startImport(importer: TrackImporter, job: ImportJobImpl) {
    let imports: (Track | TrackImportError)[] | null;
    const trackStore = this.options.store.tracks;

    while ((imports = await importer.next())) {
      const [tracks, errors] = split(imports);

      if (tracks.length) {
        const newTracks = await this.findNewTracks(trackStore, tracks);

        if (newTracks.length) {
          await trackStore.add(newTracks);
          job.onImport(newTracks);
        }
      }

      if (errors.length) {
        job.onImportError(errors);
      }
    }

    job.onComplete();
  }

  /** Removes any tracks that have already been imported previously */
  private async findNewTracks(trackStore: TrackStore, tracks: Track[]): Promise<Track[]> {
    const existingTracks = await trackStore.findByIdentifiers(getIdentifiers(...tracks));
    const newTracks = differenceWith(tracks, existingTracks, eqIdentifiers);

    return newTracks;
  }
}

export type LibraryOptions = {
  player: Player;
  store: {
    tracks: TrackStore;
  };
  sources: Source<string, unknown>[];
};
