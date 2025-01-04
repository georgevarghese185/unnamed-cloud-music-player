/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import EventEmitter from 'events';
import type TypedEventEmitter from 'typed-emitter';
import { differenceWith } from 'lodash';
import { getErrorMessage } from '../../error/util';
import { eqIdentifiers, getIdentifiers, type Track } from '../track';
import type { TrackStore } from '../store/track';
import type { Producer } from 'app/src-core/util/producer-consumer';
import { Consumer } from 'app/src-core/util/producer-consumer';

export type ImportProgress = {
  completed: boolean;
  imported: number;
  errors: TrackImportError[];
};

export class TrackImportError extends Error {
  constructor(
    public reason: string,
    public target: string,
  ) {
    super(`Failed to import ${target}: ${reason}`);
  }
}

export type ImportJobEvents = {
  complete: (progress: ImportProgress) => void;
  import: (tracks: Track[], progress: ImportProgress) => void;
  importError: (errors: TrackImportError[]) => void;
};

export class ImportJob<K extends string = string, M = unknown> {
  private events = new EventEmitter() as TypedEventEmitter<ImportJobEvents>;
  private progress: ImportProgress = {
    completed: false,
    imported: 0,
    errors: [],
  };

  constructor(
    private readonly trackProducer: Producer<(Track<K, M> | TrackImportError)[]>,
    private readonly tracks: TrackStore,
  ) {
    this.start().catch((e) => {
      this.onImportError([
        new TrackImportError(`Import interrupted unexpectedly: ${getErrorMessage(e)}`, ''),
      ]);
      this.onComplete();
    });
  }

  getProgress() {
    return { ...this.progress };
  }

  on<Event extends keyof ImportJobEvents>(event: Event, handler: ImportJobEvents[Event]): void {
    this.events.on(event, handler);
  }

  off<Event extends keyof ImportJobEvents>(event: Event, handler: ImportJobEvents[Event]): void {
    this.events.off(event, handler);
  }

  private async start() {
    const consumers = [
      new Consumer(this.trackProducer, (tracks) => this.import(tracks)),
      new Consumer(this.trackProducer, (tracks) => this.import(tracks)),
      new Consumer(this.trackProducer, (tracks) => this.import(tracks)),
      new Consumer(this.trackProducer, (tracks) => this.import(tracks)),
      new Consumer(this.trackProducer, (tracks) => this.import(tracks)),
    ];
    await Promise.all(consumers.map((c) => c.consumeAll()));
    this.onComplete();
  }

  private async import(tracksAndErrors: (Track<K, M> | TrackImportError)[]) {
    const [tracks, errors] = split(tracksAndErrors);

    if (tracks.length) {
      const newTracks = await this.findNewTracks(this.tracks, tracks);

      if (newTracks.length) {
        await this.tracks.add(newTracks);
        this.onImport(newTracks);
      }
    }

    if (errors.length) {
      this.onImportError(errors);
    }
  }

  private onComplete() {
    this.progress.completed = true;
    this.events.emit('complete', this.getProgress());
  }

  private onImport(tracks: Track[]) {
    this.progress.imported += tracks.length;
    this.events.emit('import', tracks, this.getProgress());
  }

  private onImportError(errors: TrackImportError[]) {
    this.progress.errors = [...this.progress.errors, ...errors];
    this.events.emit('importError', errors);
  }

  /** Removes any tracks that have already been imported previously */
  private async findNewTracks(
    trackStore: TrackStore,
    tracks: Track<K, M>[],
  ): Promise<Track<K, M>[]> {
    const existingTracks = await trackStore.findByIdentifiers(getIdentifiers(...tracks));
    const newTracks = differenceWith(tracks, existingTracks, eqIdentifiers);

    return newTracks;
  }
}

function split<K extends string, M>(
  tracksAndErrors: (Track<K, M> | TrackImportError)[],
): [Track<K, M>[], TrackImportError[]] {
  const tracks: Track<K, M>[] = [];
  const errors: TrackImportError[] = [];

  tracksAndErrors.forEach((trackOrError) => {
    if (trackOrError instanceof TrackImportError) {
      errors.push(trackOrError);
    } else {
      tracks.push(trackOrError);
    }
  });

  return [tracks, errors];
}
