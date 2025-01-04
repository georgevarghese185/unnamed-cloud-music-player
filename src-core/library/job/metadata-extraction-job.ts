/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventEmitter } from 'stream';
import { parseFromTokenizer } from 'music-metadata';
import type TypedEventEmitter from 'typed-emitter';
import { fromWebStream } from 'strtok3';
import type { Source } from '../../source';
import { getErrorMessage } from '../../error/util';
import type { TrackStore } from '../store/track';
import type { Track } from '../track';

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
    private readonly batchSize = 100,
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
    let tracks: Track[] = [];

    const nextTracks = async () => {
      const tracks = await this.tracks.findTracksWithoutMetadata({
        limit: this.batchSize,
        offset: 0,
      });
      return tracks;
    };

    while ((tracks = await nextTracks()).length > 0) {
      await this.updateMetadata(tracks);
    }

    this.events.emit('complete');
  }

  private async updateMetadata(tracks: Track[]) {
    // TODO: extract multiple in parallel
    for (const track of tracks) {
      try {
        const source = this.sources.find((s) => s.name === track.source.name);

        if (!source) {
          this.events.emit(
            'error',
            new MetadataExtractionError(`Could not find source ${track.source.name}`, track),
          );
          continue;
        }

        const stream = source.stream(track);
        const tokenizer = fromWebStream(stream, {
          fileInfo: { mimeType: track.mime, path: track.file.name, size: track.file.size },
        });

        const meta = await parseFromTokenizer(tokenizer, {
          skipCovers: true,
          duration: false,
          includeChapters: false,
          skipPostHeaders: true,
        });

        // Close file stream. We don't need to read any more data than required
        void tokenizer.abort();

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
