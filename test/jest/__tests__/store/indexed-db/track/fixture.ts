import { Track } from 'app/src-core/library';
import { basename } from 'path';

export const createTracks = (filePaths: string[]): Track[] => {
  return filePaths.map((path) => ({
    id: 0,
    name: basename(path),
    identifiers: [
      {
        name: 'file_path',
        value: path,
      },
    ],
    source: {
      meta: { filePath: path },
      name: 'device',
    },
  }));
};
