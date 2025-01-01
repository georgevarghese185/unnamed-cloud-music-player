/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import type { ImportProgress } from 'app/src-core/library';
import { createDeviceLibraryFixture } from './fixture';
import { describe, expect, it, vi } from 'vitest';
import { resolve } from 'path';
import * as nodeFs from 'fs';
import { fail } from 'assert';
import { hashFile, hashUint8Array } from '../../util/hash';
import type { Audio } from 'app/src-core/audio-player';

describe('Player + device source', () => {
  it('should play a single track', async () => {
    const { deviceSource, library, audioPlayer } = createDeviceLibraryFixture(nodeFs);
    const filePath = resolve(
      'test/fixtures/music/Kevin MacLeod - I Got a Stick Arr Bryan Teoh.mp3',
    );
    const onPlay = vi.fn();
    library.player.on('play', onPlay);

    const job = library.import(deviceSource, [filePath]);
    await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));
    const [track] = await library.tracks.list({ limit: 1, offset: 0 });

    if (!track) {
      fail('Track not found');
    }

    const [audio, trackChunks] = await new Promise<[Audio, Uint8Array[]]>((resolve, reject) => {
      vi.spyOn(audioPlayer, 'play').mockImplementationOnce((audio) => {
        async function validateStream() {
          audioPlayer.emit('started');
          audioPlayer.emit('buffering');

          const reader = audio.stream.getReader();
          let chunks: Uint8Array[] = [];

          for (
            let { done, value } = await reader.read();
            !done && value;
            { done, value } = await reader.read()
          ) {
            chunks = chunks.concat(value);
          }

          audioPlayer.emit('playing');

          resolve([audio, chunks]);
        }

        validateStream().catch(reject);
      });

      library.player.play(track);
    });

    const fileHash = hashFile(filePath);
    const chunksHash = hashUint8Array(trackChunks);

    expect(audio).toEqual({ mimeType: 'audio/mpeg', stream: expect.any(ReadableStream) });
    expect(chunksHash).toEqual(fileHash);
    expect(onPlay).toHaveBeenCalled();
    expect(library.player.currentlyPlaying).toEqual(track);
    expect(library.player.state).toEqual('playing');
  });

  it('should pause track', async () => {
    const { deviceSource, library, audioPlayer } = createDeviceLibraryFixture(nodeFs);
    const filePath = resolve(
      'test/fixtures/music/Kevin MacLeod - I Got a Stick Arr Bryan Teoh.mp3',
    );
    const onPause = vi.fn();
    library.player.on('pause', onPause);

    const job = library.import(deviceSource, [filePath]);
    await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));
    const [track] = await library.tracks.list({ limit: 1, offset: 0 });

    if (!track) {
      fail('Track not found');
    }

    await new Promise<void>((resolve) => {
      vi.spyOn(audioPlayer, 'play').mockImplementationOnce(() => {
        audioPlayer.emit('started');
        audioPlayer.emit('buffering');
        audioPlayer.emit('playing');
        resolve();
      });

      library.player.play(track);
    });

    await new Promise<void>((resolve) => {
      vi.spyOn(audioPlayer, 'pause').mockImplementationOnce(() => {
        audioPlayer.emit('paused');
        resolve();
      });

      library.player.pause();
    });

    expect(onPause).toHaveBeenCalled();
    expect(library.player.state).toEqual('paused');
  });
});
