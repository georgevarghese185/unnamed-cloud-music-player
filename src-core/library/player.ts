/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import EventEmitter from 'events';
import type TypedEventEmitter from 'typed-emitter';
import type { AudioPlayer, PlaybackError } from '../audio-player';
import type { Source } from '../source';
import { UnsupportedSourceError } from './errors';
import type { Track } from './track';
import globalEvents from './global-events';

export type PlayerEvents = {
  play: () => void;
  pause: () => void;
  metadataUpdate: () => void;
  error: (e: PlaybackError) => void;
};

export type PlayerState = 'playing' | 'paused';

export class Player {
  state: PlayerState = 'paused';
  currentlyPlaying: Track | null = null;
  private events = new EventEmitter() as TypedEventEmitter<PlayerEvents>;

  constructor(
    private readonly sources: Source<string, unknown, unknown>[],
    private readonly audioPlayer: AudioPlayer,
  ) {
    audioPlayer.on('started', () => {
      this.state = 'playing';
      this.events.emit('play');
    });
    audioPlayer.on('playing', () => {
      this.state = 'playing';
      this.events.emit('play');
    });
    audioPlayer.on('paused', () => {
      this.state = 'paused';
      this.events.emit('pause');
    });
    audioPlayer.on('stopped', () => {
      this.state = 'paused';
      this.events.emit('pause');
    });
    audioPlayer.on('error', (e) => {
      this.events.emit('error', e);
    });
  }

  play(track: Track) {
    const source = this.getSource(track.source.name);

    if (!source) {
      throw new UnsupportedSourceError(track.source.name);
    }

    const stream = source.stream(track);
    this.setCurrentlyPlaying(track);
    this.audioPlayer.play({ mimeType: track.mime, stream });
  }

  pause() {
    this.audioPlayer.pause();
  }

  resume() {
    this.audioPlayer.resume();
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

  private setCurrentlyPlaying(track: Track) {
    if (this.currentlyPlaying) {
      globalEvents.off(
        `trackMetadataUpdate:${track.id}`,
        this.onCurrentTrackMetadataUpdate.bind(this),
      );
    }

    this.currentlyPlaying = track;
    globalEvents.on(
      `trackMetadataUpdate:${track.id}`,
      this.onCurrentTrackMetadataUpdate.bind(this),
    );
  }

  private onCurrentTrackMetadataUpdate(track: Track) {
    this.currentlyPlaying = track;
    this.events.emit('metadataUpdate');
  }

  private getSource<K extends string, I, M, S extends Source<K, I, M>>(
    sourceName: K,
  ): S | undefined {
    const source = this.sources.find((s): s is S => s.name === sourceName);
    return source;
  }
}
