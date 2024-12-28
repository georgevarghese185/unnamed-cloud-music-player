/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getErrorMessage } from 'app/src-core/error/util';
import type { Track } from 'app/src-core/library';
import type { Player } from 'app/src-core/player';
import { PlaybackError, type PlayerEvents } from 'app/src-core/player/player';
import EventEmitter from 'events';
import type TypedEventEmitter from 'typed-emitter';

const AUDIO_ELEMENT_ID = 'music-player';
const MAX_BUFFERED_SECONDS = 30;

export default class HtmlPlayer implements Player {
  private audio: HTMLAudioElement;
  private events = new EventEmitter() as TypedEventEmitter<PlayerEvents>;
  private currentlyPlaying: Track | null = null;

  constructor() {
    let audioElement: HTMLAudioElement | null = document.querySelector(`#${AUDIO_ELEMENT_ID}`);

    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = AUDIO_ELEMENT_ID;
      document.body.appendChild(audioElement);
    }

    this.audio = audioElement;

    this.audio.addEventListener('error', (e) => {
      this.events.emit('error', new PlaybackError(e.message));
    });

    this.audio.addEventListener('play', () => {
      if (!this.currentlyPlaying) {
        return;
      }

      this.events.emit('playing', this.currentlyPlaying);
    });

    this.audio.addEventListener('playing', () => {
      if (!this.currentlyPlaying) {
        return;
      }

      this.events.emit('playing', this.currentlyPlaying);
    });

    this.audio.addEventListener('pause', () => {
      if (!this.currentlyPlaying) {
        return;
      }

      this.events.emit('paused', this.currentlyPlaying);
    });

    this.audio.addEventListener('waiting', () => {
      if (!this.currentlyPlaying) {
        return;
      }

      this.events.emit('buffering', this.currentlyPlaying);
    });

    this.audio.addEventListener('ended', () => {
      if (!this.currentlyPlaying) {
        return;
      }

      this.events.emit('stopped', this.currentlyPlaying);
    });
  }

  on<Event extends keyof PlayerEvents>(event: Event, handler: PlayerEvents[Event]): void {
    this.events.on(event, handler);
  }

  once<Event extends keyof PlayerEvents>(event: Event, handler: PlayerEvents[Event]): void {
    this.events.once(event, handler);
  }

  off<Event extends keyof PlayerEvents>(event: Event, handler: PlayerEvents[Event]): void {
    this.events.off(event, handler);
  }

  supports(mimeType: string): boolean {
    return !!this.audio.canPlayType(mimeType);
  }

  play(track: Track, stream: ReadableStream<Uint8Array>): void {
    const mediaSource = new MediaSource();
    this.audio.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
      this.currentlyPlaying = track;
      this.events.emit('started', track);
      this.events.emit('buffering', track);

      const streamTrack = async () => {
        // TODO: get extension/mime from track
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        const reader = stream.getReader();
        let ended = false;

        do {
          // current track was changed in between. Cancel
          if (track.id !== this.currentlyPlaying?.id) {
            void reader.cancel();
            return;
          }

          const { done, value } = await reader.read();
          ended = done;

          if (value) {
            await this.appendChunk(track, sourceBuffer, value);
          }
        } while (!ended);

        mediaSource.endOfStream();
      };

      streamTrack().catch((e) =>
        this.events.emit('error', new PlaybackError(getErrorMessage(e), track)),
      );
    });
  }

  private async appendChunk(track: Track, sourceBuffer: SourceBuffer, chunk: Uint8Array) {
    const buffered = sourceBuffer.buffered;
    const bufferEnd = buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;

    while (this.audio.currentTime + MAX_BUFFERED_SECONDS < bufferEnd) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }

    // current track was changed in between
    if (track.id !== this.currentlyPlaying?.id) {
      return;
    }

    sourceBuffer.appendBuffer(chunk);

    await new Promise((resolve) =>
      sourceBuffer.addEventListener('updateend', resolve, { once: true }),
    );

    // start playing but make sure current track wasn't changed while we were waiting
    if (this.audio.paused && track.id === this.currentlyPlaying?.id) {
      void this.audio.play();
    }
  }
}
