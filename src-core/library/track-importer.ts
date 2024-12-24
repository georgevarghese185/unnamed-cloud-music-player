/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Track } from './track';
import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';

const QUEUE_MAX_SIZE = 100;

export interface ImportQueue {
  end(): void;
  push(track: Track | TrackImportError): Promise<void>;
}

export class TrackImportError extends Error {
  constructor(
    public reason: string,
    public target: string,
  ) {
    super(`Failed to import ${target}: ${reason}`);
  }
}

type ImportQueueEventEmitter = TypedEmitter<{
  push: () => void;
  pop: () => void;
  end: () => void;
}>;

export class TrackImporter {
  private queue: (Track | TrackImportError)[] = [];
  private state: 'ready' | 'importing' | 'ended' = 'ready';
  private emitter = new EventEmitter() as ImportQueueEventEmitter;

  constructor(private onStart: (queue: ImportQueue) => void) {}

  async next(): Promise<(Track | TrackImportError)[] | null> {
    if (this.state === 'ready') {
      this.start();
    }

    if (this.hasTracks()) {
      return this.pop();
    }

    if (this.state === 'ended') {
      return null;
    }

    await Promise.race([this.waitForTracks(), this.waitForEnd()]);
    return this.next();
  }

  private start() {
    const importQueue: ImportQueue = {
      push: (track) => this.push(track),
      end: () => this.end(),
    };

    this.state = 'importing';
    this.onStart(importQueue);
  }

  private async push(track: Track | TrackImportError): Promise<void> {
    if (this.queueFull()) {
      await this.waitForQueueSpace();
      return this.push(track);
    }

    this.queue.push(track);
    this.emitter.emit('push');
  }

  private pop(): (Track | TrackImportError)[] {
    const tracks = this.queue.splice(0);
    this.emitter.emit('pop');
    return tracks;
  }

  private end() {
    this.state = 'ended';
    this.emitter.emit('end');
  }

  private hasTracks(): boolean {
    return !!this.queue.length;
  }

  private queueFull(): boolean {
    return this.queue.length >= QUEUE_MAX_SIZE;
  }

  private async waitForTracks(): Promise<void> {
    await new Promise<void>((resolve) => this.emitter.once('push', resolve));
  }

  private async waitForEnd(): Promise<void> {
    return new Promise<void>((resolve) => this.emitter.once('end', resolve));
  }

  private async waitForQueueSpace(): Promise<void> {
    return new Promise<void>((resolve) => this.emitter.once('pop', resolve));
  }
}
