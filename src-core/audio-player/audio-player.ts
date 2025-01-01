/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export type AudioPlayerEvents = {
  started: () => void;
  buffering: () => void;
  playing: () => void;
  paused: () => void;
  stopped: () => void;
  error: (e: PlaybackError) => void;
};

export class PlaybackError extends Error {
  constructor(reason: string) {
    super(`Playback Error: ${reason}`);
  }
}

export type Audio = {
  mimeType: string;
  stream: ReadableStream<Uint8Array>;
};

export interface AudioPlayer {
  supports(mimeType: string): boolean;
  play(audio: Audio): void;
  pause(): void;
  on<Event extends keyof AudioPlayerEvents>(event: Event, handler: AudioPlayerEvents[Event]): void;
  once<Event extends keyof AudioPlayerEvents>(
    event: Event,
    handler: AudioPlayerEvents[Event],
  ): void;
  off<Event extends keyof AudioPlayerEvents>(event: Event, handler: AudioPlayerEvents[Event]): void;
}
