/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { basename, extname } from 'path';
import type { Track } from 'app/src-core/library';
import type { DeviceSourceMetadata } from 'app/src-core/source/device';

export const createTracks = (filePaths: string[]): Track<'device', DeviceSourceMetadata>[] => {
  return filePaths.map((path) => ({
    id: 0,
    identifiers: [
      {
        name: 'file_path',
        value: path,
      },
    ],
    mime:
      extname(path) === '.mp3'
        ? 'audio/mpeg'
        : extname(path) === '.ogg'
          ? 'audio/ogg'
          : extname(path) === '.aac'
            ? 'audio/aac'
            : '',
    file: {
      name: basename(path),
      extension: extname(path),
      size: 10,
    },
    source: {
      meta: { filePath: path },
      name: 'device',
    },
  }));
};
