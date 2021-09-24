import { basename } from 'path';

export const trackExpectation = (path: string): any => ({
  id: expect.any(Number),
  name: basename(path),
  source: {
    name: 'device',
    meta: {
      filePath: path,
    },
  },
});
