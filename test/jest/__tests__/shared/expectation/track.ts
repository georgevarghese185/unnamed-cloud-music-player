import { basename } from 'path';

export const deviceTrackExpectation = (path: string): any => ({
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
});
