import { basename } from 'path'
import { expect } from 'vitest'

export const deviceTrackExpectation = (path: string) => ({
  id: expect.any(Number),
  name: basename(path),
  identifiers: [
    {
      name: 'file_path',
      value: path,
    },
  ],
  source: {
    name: 'device',
    meta: {
      filePath: path,
    },
  },
})
