/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { basename, resolve, extname } from 'path';
import { expect } from 'vitest';

export const deviceTrackExpectation = (path: string) => ({
  id: expect.any(Number),
  name: basename(path),
  identifiers: [
    {
      name: 'file_path',
      value: resolve(path),
    },
  ],
  mime:
    extname(path) === '.mp3'
      ? 'audio/mpeg'
      : extname(path) === '.ogg'
        ? 'audio/ogg'
        : extname(path) === '.aac'
          ? 'audio/aac'
          : extname(path) === '.flac'
            ? 'audio/flac'
            : '',
  source: {
    name: 'device',
    meta: {
      filePath: resolve(path),
    },
  },
});
