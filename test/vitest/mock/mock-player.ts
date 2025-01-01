/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import type { Track } from 'app/src-core/library';
import type { Player } from 'app/src-core/player';
import type { PlayerEvents } from 'app/src-core/player/player';

export class MockPlayer implements Player {
  currentlyPlaying: Track | null = null;

  on<Event extends keyof PlayerEvents>(_event: Event, _handler: PlayerEvents[Event]): void {
    // do nothing
  }
  once<Event extends keyof PlayerEvents>(_event: Event, _handler: PlayerEvents[Event]): void {
    throw new Error('Method not implemented.');
  }
  off<Event extends keyof PlayerEvents>(_event: Event, _handler: PlayerEvents[Event]): void {
    throw new Error('Method not implemented.');
  }
  supports(ext: string) {
    return ['audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/flac'].includes(ext);
  }
  play(_track: Track, _stream: ReadableStream<Uint8Array>): void {
    throw new Error('Method not implemented.');
  }
}
