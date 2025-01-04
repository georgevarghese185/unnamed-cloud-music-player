/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventEmitter } from 'events';
import type TypedEventEmitter from 'typed-emitter';

type ProducerEvents = {
  push: () => void;
  pop: () => void;
  end: () => void;
};

export class Producer<T> {
  private queue: T[] = [];
  private done = false;
  private events = new EventEmitter() as TypedEventEmitter<ProducerEvents>;

  constructor(private readonly maxQueueSize: number) {}

  async push(item: T): Promise<void> {
    if (this.queue.length >= this.maxQueueSize) {
      await this.waitForQueueSpace();
      return this.push(item);
    }

    this.queue.push(item);
    this.events.emit('push');
  }

  end() {
    this.done = true;
    this.events.emit('pop');
    this.events.emit('push');
  }

  async next(): Promise<T | null> {
    const item = this.queue.shift();

    if (item) {
      this.events.emit('pop');
      return item;
    }

    if (this.done) {
      return null;
    }

    await this.waitForItems();
    return this.next();
  }

  private waitForQueueSpace(): Promise<void> {
    return new Promise((resolve) => this.events.once('pop', resolve));
  }

  private waitForItems(): Promise<void> {
    return new Promise((resolve) => this.events.once('push', resolve));
  }
}

export class Consumer<T> {
  constructor(
    private readonly producer: Producer<T>,
    private readonly process: (item: T) => Promise<void>,
  ) {}

  async consumeAll(): Promise<void> {
    let next: T | null;
    while ((next = await this.producer.next())) {
      await this.process(next);
    }
  }
}
