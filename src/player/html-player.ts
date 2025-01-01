/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Track } from 'app/src-core/library';
import type { Player } from 'app/src-core/player';
import { PlaybackError, type PlayerEvents } from 'app/src-core/player/player';
import EventEmitter from 'events';
import type TypedEventEmitter from 'typed-emitter';

const AUDIO_ELEMENT_ID = 'music-player';
const MAX_BUFFERED_SECONDS = 30;

class MediaSourceUnsupportedError extends Error {
  constructor(public readonly buffered: Uint8Array[]) {
    super('MediaSource may not support this format');
  }
}

export default class HtmlPlayer implements Player {
  private audio: HTMLAudioElement;
  private events = new EventEmitter() as TypedEventEmitter<PlayerEvents>;
  currentlyPlaying: Track | null = null;

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
    const play = async () => {
      try {
        this.currentlyPlaying = track;
        this.events.emit('started', track);
        await this.playAsMediaSource(track, stream);
      } catch (e) {
        if (e instanceof MediaSourceUnsupportedError) {
          await this.playAsBlob(track, stream, e.buffered);
        } else {
          throw e;
        }
      }
    };

    play().catch((e) => this.events.emit('error', new PlaybackError(e.message)));
  }

  private async playAsMediaSource(track: Track, stream: ReadableStream<Uint8Array>) {
    const unplayedChunks: Uint8Array[] = [];

    try {
      let cancelled = false;
      let playing = false;

      // cancel if user starts another song
      this.events.once('started', () => {
        cancelled = true;
      });

      // cancel if audio playback errors out
      this.audio.addEventListener(
        'error',
        () => {
          cancelled = true;
        },
        { once: true },
      );

      const mediaSource = new MediaSource();

      await new Promise((resolve) => {
        mediaSource.addEventListener('sourceopen', resolve, { once: true });
        this.audio.src = URL.createObjectURL(mediaSource);
      });

      if (cancelled) {
        return;
      }

      this.audio
        .play()
        .then(() => (playing = true))
        .catch(() => {});

      const sourceBuffer = mediaSource.addSourceBuffer(track.mime);
      const reader = stream.getReader();

      for (
        let { done, value } = await reader.read();
        !done && !cancelled && value;
        { done, value } = await reader.read()
      ) {
        if (!playing) {
          unplayedChunks.push(value);
        }

        if (cancelled) {
          return;
        }

        await this.bufferNotFull(sourceBuffer);

        if (cancelled) {
          return;
        }

        sourceBuffer.appendBuffer(value);
        await this.bufferUpdated(sourceBuffer);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotSupportedError') {
        throw new MediaSourceUnsupportedError(unplayedChunks);
      }

      throw e;
    }
  }

  private async playAsBlob(track: Track, stream: ReadableStream, buffered: Uint8Array[] = []) {
    const reader = stream.getReader();

    for (
      let { done, value } = await reader.read();
      !done && value;
      { done, value } = await reader.read()
    ) {
      buffered.push(value);
    }

    const blob = new Blob(buffered);
    this.audio.src = URL.createObjectURL(blob);
    await this.audio.play();
  }

  private async bufferNotFull(sourceBuffer: SourceBuffer) {
    const buffered = sourceBuffer.buffered;
    const bufferEnd = buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;

    while (this.audio.currentTime + MAX_BUFFERED_SECONDS < bufferEnd) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }

  private bufferUpdated(sourceBuffer: SourceBuffer) {
    return new Promise((resolve) =>
      sourceBuffer.addEventListener('updateend', resolve, { once: true }),
    );
  }
}
