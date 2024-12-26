/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { basename, resolve } from 'path';
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
  source: {
    name: 'device',
    meta: {
      filePath: resolve(path),
    },
  },
});
