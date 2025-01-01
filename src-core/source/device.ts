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
import { TrackImporter, TrackImportError } from '../library/track-importer';
import type { ImportQueue } from '../library/track-importer';
import type { AudioPlayer } from '../audio-player';
import type { DeviceFile, DeviceStorage, File } from '../storage/device';
import type { Source } from './source';

/**
 *
 * TODO: import tracks in a more parallel manner like a bunch at a time instead of one ot a time. But continue pushing them 1 at a time
 *
 */

// override this library's audio/x-flac with audio/flac
const mime = new Mime(standardMimeTypes, otherMimeTypes);
mime.define({ 'audio/flac': ['flac'] }, true);

export type DeviceSourceName = 'device';
export const DEVICE_SOURCE_NAME: DeviceSourceName = 'device';
export const IDENTIFIER_FILE_PATH = 'file_path';
export type DeviceSourceMetadata = {
  filePath: string;
};

export class DeviceSource implements Source<'device', string[], DeviceSourceMetadata> {
  name = DEVICE_SOURCE_NAME;

  constructor(
    private storage: DeviceStorage,
    private player: AudioPlayer,
  ) {}

  import(paths: string[]): TrackImporter<'device', DeviceSourceMetadata> {
    return new TrackImporter((queue) => {
      this.importFromPaths(paths, queue).catch((e) => {
        void queue.push(
          new TrackImportError(
            `Unexpected error while importing tracks from paths ${paths.join(',')}: ${getErrorMessage(e)}`,
            '',
          ),
        );
      });
    });
  }

  stream(track: Track<'device', DeviceSourceMetadata>): ReadableStream<Uint8Array> {
    return this.storage.readFile(track.source.meta.filePath);
  }

  private async importFromPaths(
    sourcePaths: string[],
    queue: ImportQueue<'device', DeviceSourceMetadata>,
  ) {
    let files = await this.getFiles(sourcePaths, queue);
    let file;

    while ((file = files.shift())) {
      if (file.isDir) {
        try {
          const dirContents = await this.storage.listFiles(file);
          files = files.concat(dirContents);
        } catch (e) {
          await queue.push(new TrackImportError(getErrorMessage(e), file.path));
        }
      } else {
        const mimeType = mime.getType(file.ext) || '';
        if (this.player.supports(mimeType)) {
          await queue.push(createTrack(file, mimeType));
        } else if (sourcePaths.includes(file.path)) {
          // the selected source file is not a supported audio file. Notify the user
          await queue.push(new TrackImportError(UNSUPPORTED_FILE, file.path));
        }
      }
    }

    queue.end();
  }

  /**
   * Gets `DeviceFile`s for the given device storage paths. Any errors that occur while trying to get a file will be
   * be pushed to the queue as `TrackImportError`s
   */
  private async getFiles(
    paths: string[],
    queue: ImportQueue<'device', DeviceSourceMetadata>,
  ): Promise<DeviceFile[]> {
    const files: DeviceFile[] = [];

    await Promise.all(
      paths.map(async (path) => {
        try {
          const file = await this.storage.getFile(path);
          files.push(file);
        } catch (e) {
          await queue.push(new TrackImportError(getErrorMessage(e), path));
        }
      }),
    );

    return files;
  }
}

const createTrack = (file: File, mimeType: string): Track<'device', DeviceSourceMetadata> => {
  return {
    id: 0,
    name: file.name,
    mime: mimeType,
    identifiers: [
      {
        name: IDENTIFIER_FILE_PATH,
        value: file.path,
      },
    ],
    source: { name: DEVICE_SOURCE_NAME, meta: { filePath: file.path } },
  };
};
