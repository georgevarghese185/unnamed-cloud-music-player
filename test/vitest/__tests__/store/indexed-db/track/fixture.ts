/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import type { Track } from 'app/src-core/library';
import type { DeviceSourceMetadata } from 'app/src-core/source/device';
import { basename, extname } from 'path';

export const createTracks = (filePaths: string[]): Track<'device', DeviceSourceMetadata>[] => {
  return filePaths.map((path) => ({
    id: 0,
    name: basename(path),
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
    source: {
      meta: { filePath: path },
      name: 'device',
    },
  }));
};
