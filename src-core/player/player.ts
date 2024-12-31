/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Track } from '../library';

export type PlayerEvents = {
  started: (track: Track) => void;
  buffering: (track: Track) => void;
  playing: (track: Track) => void;
  paused: (track: Track) => void;
  stopped: (track: Track) => void;
  error: (e: PlaybackError) => void;
};

export class PlaybackError extends Error {
  constructor(
    reason: string,
    public readonly track?: Track,
  ) {
    super(`Playback Error${track ? `: Error while playing ${track.name}` : ''}: ${reason}`);
  }
}

export interface Player {
  supports(mimeType: string): boolean;
  play(track: Track, stream: ReadableStream<Uint8Array>): void;
  on<Event extends keyof PlayerEvents>(event: Event, handler: PlayerEvents[Event]): void;
  once<Event extends keyof PlayerEvents>(event: Event, handler: PlayerEvents[Event]): void;
  off<Event extends keyof PlayerEvents>(event: Event, handler: PlayerEvents[Event]): void;
}
