/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import EventEmitter from 'events';
import type { Track } from 'app/src-core/library';
import type { Audio, AudioPlayer } from 'app/src-core/audio-player';

export class MockAudioPlayer extends EventEmitter implements AudioPlayer {
  currentTime = 0;
  track: Track | null = null;

  supports(ext: string) {
    return ['audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/flac'].includes(ext);
  }
  play(_audio: Audio): void {
    throw new Error('Method not implemented.');
  }
  pause(): void {
    throw new Error('Method not implemented.');
  }
  resume(): void {
    throw new Error('Method not implemented.');
  }
  seek(_time: number): void {
    throw new Error('Method not implemented.');
  }
}
