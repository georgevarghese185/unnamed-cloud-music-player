/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { AudioPlayer } from '../audio-player';
import type { Source } from '../source';
import type { TrackStore } from './store/track';
import { ImportJob } from './job/import-job';
import { Player } from './player';
import { MetadataExtractionJob } from './job/metadata-extraction-job';

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
  private readonly audioPlayer: AudioPlayer;
  private readonly sources: Source<string, unknown, unknown>[];

  constructor(options: LibraryOptions) {
    this.tracks = options.store.tracks;
    this.audioPlayer = options.audioPlayer;
    this.sources = options.sources;
    this.player = new Player(this.sources, this.audioPlayer);
  }

  getSource<K extends string, I, M, S extends Source<K, I, M>>(sourceName: K): S | undefined {
    const source = this.sources.find((s): s is S => s.name === sourceName);
    return source;
  }

  import<K extends string, I, M, S extends Source<K, I, M>>(source: S, inputs: I): ImportJob<K, M> {
    const importer = source.import(inputs);
    return new ImportJob(importer, this.tracks);
  }

  updateAllMetadata() {
    return new MetadataExtractionJob(this.tracks, this.sources);
  }
}
