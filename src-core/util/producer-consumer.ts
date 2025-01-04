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

  constructor(private readonly maxQueueSize: number) {
    // try not to push to many items in parallel
    this.events.setMaxListeners(100);
  }

  async push(item: T): Promise<void> {
    while (this.queue.length >= this.maxQueueSize) {
      await this.waitForQueueSpace();
    }

    this.queue.push(item);
    this.events.emit('push');
  }

  async next(): Promise<T | null> {
    while (this.queue.length < 1 && !this.done) {
      await this.waitForItems();
    }

    const item = this.queue.shift();

    if (!item) {
      // if the loop above has exited but there's nothing in the queue, we're probably done (no more items to produce)
      return null;
    }

    this.events.emit('pop');
    return item;
  }

  end() {
    this.done = true;
    // unblock any this.next() calls that are still waiting for items
    this.events.emit('push');
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
