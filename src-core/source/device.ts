/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Mime } from 'mime';
import standardMimeTypes from 'mime/types/standard.js';
import otherMimeTypes from 'mime/types/other.js';
import { UNSUPPORTED_FILE } from '../constants/errors';
import { getErrorMessage } from '../error/util';
import type { Track } from '../library';
import { TrackImportError } from '../library';
import type { AudioPlayer } from '../audio-player';
import type { DeviceFile, DeviceStorage, Directory, File } from '../storage/device';
import { Producer } from '../util/producer-consumer';
import type { Source } from './source';

// override this library's audio/x-flac with audio/flac
const mime = new Mime(standardMimeTypes, otherMimeTypes);
mime.define({ 'audio/flac': ['flac'] }, true);

export type DeviceSourceName = 'device';
export type DeviceSourceMetadata = {
  filePath: string;
};
export type DeviceTrack = Track<'device', DeviceSourceMetadata>;

export const DEVICE_SOURCE_NAME: DeviceSourceName = 'device';
export const IDENTIFIER_FILE_PATH = 'file_path';

export class DeviceSource implements Source<'device', string[], DeviceSourceMetadata> {
  name = DEVICE_SOURCE_NAME;

  constructor(
    private storage: DeviceStorage,
    private player: AudioPlayer,
  ) {}

  import(paths: string[]): Producer<(DeviceTrack | TrackImportError)[]> {
    const producer = new Producer<(DeviceTrack | TrackImportError)[]>(10);
    void this.importFromPaths(paths, producer);
    return producer;
  }

  stream(track: DeviceTrack): ReadableStream<Uint8Array> {
    return this.storage.readFile(track.source.meta.filePath);
  }

  private async importFromPaths(
    sourcePaths: string[],
    producer: Producer<(DeviceTrack | TrackImportError)[]>,
  ) {
    try {
      let paths = [...sourcePaths];

      for (let path = paths.shift(); path; path = paths.shift()) {
        let files: File[] = [];
        let directories: Directory[] = [];
        const tracks: (DeviceTrack | TrackImportError)[] = [];

        try {
          const file = await this.storage.getFile(path);

          if (file.isDir) {
            [files, directories] = split(await this.storage.listFiles(file));
          } else {
            files = [file];
          }

          paths = paths.concat(directories.map((d) => d.path));

          files.forEach((file) => {
            const mimeType = mime.getType(file.ext) || '';
            if (this.player.supports(mimeType)) {
              tracks.push(createTrack(file, mimeType));
            } else if (sourcePaths.includes(file.path)) {
              // the selected source file is not a supported audio file. Notify the user
              tracks.push(new TrackImportError(UNSUPPORTED_FILE, file.path));
            }
          });
        } catch (e) {
          tracks.push(new TrackImportError(getErrorMessage(e), path));
        }

        if (tracks.length) {
          await producer.push(tracks);
        }
      }
    } catch (e) {
      await producer.push([
        new TrackImportError(
          `Unexpected error while importing tracks from paths ${sourcePaths.join(',')}: ${getErrorMessage(e)}`,
          '',
        ),
      ]);
    } finally {
      producer.end();
    }
  }
}

function createTrack(file: File, mimeType: string): DeviceTrack {
  return {
    id: 0,
    mime: mimeType,
    identifiers: [
      {
        name: IDENTIFIER_FILE_PATH,
        value: file.path,
      },
    ],
    file: {
      name: file.name,
      extension: file.ext,
      size: file.size,
    },
    source: { name: DEVICE_SOURCE_NAME, meta: { filePath: file.path } },
  };
}

function split(files: DeviceFile[]): [File[], Directory[]] {
  return files.reduce(
    ([files, directories], file) => {
      if (file.isDir) {
        directories.push(file);
      } else {
        files.push(file);
      }
      return [files, directories];
    },
    [[], []] as [File[], Directory[]],
  );
}
