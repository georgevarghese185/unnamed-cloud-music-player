/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import type { ImportProgress } from 'app/src-core/library';
import { createDeviceLibraryFixture } from './fixture';
import { describe, expect, it, vi } from 'vitest';
import { resolve } from 'path';
import * as nodeFs from 'fs';
import { fail } from 'assert';
import { createHash } from 'crypto';

function hashFile(filePath: string) {
  const hash = createHash('sha256');
  const data = nodeFs.readFileSync(filePath);
  hash.update(data);

  return hash.digest('hex');
}

function hashUint8Array(uint8Array: Uint8Array[]) {
  const hash = createHash('sha256');
  uint8Array.map((chunk) => hash.update(chunk));
  return hash.digest('hex');
}

describe('Play from device source', () => {
  it('should play a single track', async () => {
    const { deviceSource, library, player } = createDeviceLibraryFixture(nodeFs);
    const filePath = resolve(
      'test/fixtures/music/Kevin MacLeod - I Got a Stick Arr Bryan Teoh.mp3',
    );

    const job = library.import(deviceSource, [filePath]);
    await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));
    const [track] = await library.tracks.list({ limit: 1, offset: 0 });

    if (!track) {
      fail('Track not found');
    }

    await new Promise<void>((resolve, reject) => {
      vi.spyOn(player, 'play').mockImplementationOnce((stream) => {
        async function validateStream() {
          const reader = stream.getReader();
          let isDone = true;
          let chunks: Uint8Array[] = [];

          do {
            const { done, value } = await reader.read();
            isDone = done;

            if (value) {
              chunks = chunks.concat(value);
            }
          } while (!isDone);

          const fileHash = hashFile(filePath);
          const chunksHash = hashUint8Array(chunks);

          expect(fileHash).toEqual(chunksHash);

          resolve();
        }

        validateStream().catch(reject);
      });

      library.play(track).catch(reject);
    });
  });
});
