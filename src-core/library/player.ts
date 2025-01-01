/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import EventEmitter from 'events';
import type { AudioPlayer } from '../audio-player';
import type { Source } from '../source';
import { UnsupportedSourceError } from './errors';
import type { Track } from './track';
import type TypedEventEmitter from 'typed-emitter';

export type PlayerEvents = {
  start: (track: Track) => void;
};

export class Player {
  private events = new EventEmitter() as TypedEventEmitter<PlayerEvents>;

  constructor(
    private readonly sources: Source<string, unknown, unknown>[],
    private readonly audioPlayer: AudioPlayer,
  ) {
    audioPlayer.on('started', (track) => {
      this.events.emit('start', track);
    });
  }

  get currentlyPlaying() {
    return this.audioPlayer.currentlyPlaying;
  }

  play(track: Track) {
    const source = this.getSource(track.source.name);

    if (!source) {
      throw new UnsupportedSourceError(track.source.name);
    }

    const stream = source.stream(track);
    this.audioPlayer.play(track, stream);
  }

  on<E extends keyof PlayerEvents>(event: E, handler: PlayerEvents[E]) {
    this.events.on(event, handler);
  }

  once<E extends keyof PlayerEvents>(event: E, handler: PlayerEvents[E]) {
    this.events.once(event, handler);
  }

  off<E extends keyof PlayerEvents>(event: E, handler: PlayerEvents[E]) {
    this.events.off(event, handler);
  }

  removeAllListeners<E extends keyof PlayerEvents>(event: E) {
    this.events.removeAllListeners(event);
  }

  private getSource<K extends string, I, M, S extends Source<K, I, M>>(
    sourceName: K,
  ): S | undefined {
    const source = this.sources.find((s): s is S => s.name === sourceName);
    return source;
  }
}
