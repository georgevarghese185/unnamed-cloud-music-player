import type { Track } from 'app/src-core/library';
import type { DeviceSourceMetadata } from 'app/src-core/source/device';
import { basename } from 'path';

export const createTracks = (filePaths: string[]): Track<DeviceSourceMetadata>[] => {
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
