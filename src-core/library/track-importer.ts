/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';
import type { Track } from './track';

const QUEUE_MAX_SIZE = 100;

export interface ImportQueue<K extends string, M> {
  end(): void;
  push(track: Track<K, M> | TrackImportError): Promise<void>;
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

export class TrackImporter<K extends string, M = unknown> {
  private queue: (Track<K, M> | TrackImportError)[] = [];
  private state: 'ready' | 'importing' | 'ended' = 'ready';
  private emitter = new EventEmitter() as ImportQueueEventEmitter;

  constructor(private onStart: (queue: ImportQueue<K, M>) => void) {}

  async next(): Promise<(Track<K, M> | TrackImportError)[] | null> {
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
    const importQueue: ImportQueue<K, M> = {
      push: (track) => this.push(track),
      end: () => this.end(),
    };

    this.state = 'importing';
    this.onStart(importQueue);
  }

  private async push(track: Track<K, M> | TrackImportError): Promise<void> {
    if (this.queueFull()) {
      await this.waitForQueueSpace();
      return this.push(track);
    }

    this.queue.push(track);
    this.emitter.emit('push');
  }

  private pop(): (Track<K, M> | TrackImportError)[] {
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
