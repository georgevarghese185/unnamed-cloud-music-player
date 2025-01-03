/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventEmitter } from 'stream';
import { parseWebStream } from 'music-metadata';
import type TypedEventEmitter from 'typed-emitter';
import type { AudioPlayer } from '../audio-player';
import type { Source } from '../source';
import { getErrorMessage } from '../error/util';
import type { TrackStore } from './store/track';
import { ImportJob } from './import-job';
import { Player } from './player';
import type { Track } from './track';

export type LibraryOptions = {
  audioPlayer: AudioPlayer;
  store: {
    tracks: TrackStore;
  };
  sources: Source<string, unknown, unknown>[];
};

const BATCH = 100;

export class MetadataExtractionError extends Error {
  constructor(
    message: string,
    private track?: Track,
  ) {
    super(
      `${track ? `Error while extracting metadata for track ${track.file.name}: ` : ''}${message}`,
    );
  }
}

export type MetadataJobEvents = {
  complete: () => void;
  error: (e: MetadataExtractionError) => void;
};

export class MetadataExtractionJob {
  private events = new EventEmitter() as TypedEventEmitter<MetadataJobEvents>;

  constructor(
    private readonly tracks: TrackStore,
    private readonly sources: Source<string, unknown, unknown>[],
  ) {
    this.start().catch((e) => {
      this.events.emit('error', new MetadataExtractionError(getErrorMessage(e)));
    });
  }

  on<Event extends keyof MetadataJobEvents>(event: Event, handler: MetadataJobEvents[Event]): void {
    this.events.on(event, handler);
  }

  off<Event extends keyof MetadataJobEvents>(
    event: Event,
    handler: MetadataJobEvents[Event],
  ): void {
    this.events.off(event, handler);
  }

  private async start() {
    // TODO: only get tracks that are missing metadata
    for (
      let offset = 0, tracks = await this.tracks.list({ limit: BATCH, offset });
      tracks.length > 0;
      offset = offset + BATCH, tracks = await this.tracks.list({ limit: BATCH, offset })
    ) {
      await this.updateMetadata(tracks);
    }

    this.events.emit('complete');
  }

  private async updateMetadata(tracks: Track[]) {
    // TODO: extract multiple in parallel
    for (const track of tracks) {
      const source = this.sources.find((s) => s.name === track.source.name);

      if (!source) {
        // TODO: handle no source
        continue;
      }

      const stream = source.stream(track);

      try {
        const meta = await parseWebStream(
          stream,
          { mimeType: track.mime, path: track.file.name, size: track.file.size },
          { skipCovers: true },
        );

        track.metadata = {};

        if (meta.common.title) {
          track.metadata.title = meta.common.title;
        }
        if (meta.common.artist) {
          track.metadata.artist = meta.common.artist;
        }
        if (meta.common.album) {
          track.metadata.album = meta.common.album;
        }
        if (meta.format.duration) {
          track.metadata.duration = meta.format.duration;
        }
      } catch (e) {
        this.events.emit('error', new MetadataExtractionError(getErrorMessage(e), track));
      }
    }

    await this.tracks.update(tracks);
  }
}

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
