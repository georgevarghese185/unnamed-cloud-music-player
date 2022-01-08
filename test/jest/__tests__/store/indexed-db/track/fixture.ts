import { Track } from 'app/src-core/library';
import { basename } from 'path';

export const createTracks = (filePaths: string[]): Track[] => {
  return filePaths.map((path) => ({
    id: 0,
    name: basename(path),
    source: {
      meta: { filePath: path },
      name: 'device',
    },
  }));
};
