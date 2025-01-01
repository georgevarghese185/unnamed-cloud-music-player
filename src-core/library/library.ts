/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { differenceWith } from 'lodash';
import type { AudioPlayer } from '../audio-player';
import type { TrackStore } from './store/track';
import type { Track } from './track';
import { eqIdentifiers, getIdentifiers } from './track';
import type { TrackImporter } from './track-importer';
import { TrackImportError } from './track-importer';
import type { Source } from '../source';
import type { ImportJob } from './import-job';
import { ImportJobImpl } from './import-job';
import { getErrorMessage } from '../error/util';
import { Player } from './player';

export type LibraryOptions = {
  audioPlayer: AudioPlayer;
  store: {
    tracks: TrackStore;
  };
  sources: Source<string, unknown, unknown>[];
};

export class Library {
  readonly tracks: TrackStore;
  readonly player: Player;

  constructor(private options: LibraryOptions) {
    this.tracks = options.store.tracks;
    this.player = new Player(options.sources, options.audioPlayer);
  }

  getSource<K extends string, I, M, S extends Source<K, I, M>>(sourceName: K): S | undefined {
    const source = this.options.sources.find((s): s is S => s.name === sourceName);
    return source;
  }

  import<K extends string, I, M, S extends Source<K, I, M>>(source: S, inputs: I): ImportJob {
    const importer = source.import(inputs);
    const job = new ImportJobImpl();
    setTimeout(() => {
      this.startImport(importer, job).catch((e) => {
        job.onImportError([
          new TrackImportError(`Import interrupted unexpectedly: ${getErrorMessage(e)}`, ''),
        ]);
        job.onComplete();
      });
    });
    return job;
  }

  private async startImport<K extends string, M>(
    importer: TrackImporter<K, M>,
    job: ImportJobImpl,
  ) {
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
