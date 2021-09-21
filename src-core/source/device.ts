import { UNSUPPORTED_FILE } from '../constants/errors';
import { Track, TrackImporter } from '../library';
import { ImportQueue, TrackImportError } from '../library/track-importer';
import { Player } from '../player';
import { DeviceFile, DeviceStorage, File } from '../storage/device';

const createTrack = (file: File): Track<DeviceSourceMetadata> => {
  return {
    id: 0,
    name: file.name,
    source: { name: DeviceSource.sourceName, meta: { filePath: file.path } },
  };
};

export class DeviceSource {
  static sourceName = 'device';

  constructor(private storage: DeviceStorage, private player: Player) {}

  async import(...paths: string[]): Promise<TrackImporter> {
    return new TrackImporter(async (queue) =>
      this.importFromPaths(paths, queue),
    );
  }

  private async importFromPaths(sourcePaths: string[], queue: ImportQueue) {
    let files = await this.getFiles(sourcePaths, queue);
    let file;

    while ((file = files.shift())) {
      if (file.isDir) {
        try {
          const dirContents = await this.storage.listFiles(file);
          files = files.concat(dirContents);
        } catch (e: any) {
          await queue.push(new TrackImportError(e.message, file.path));
        }
      } else if (this.player.supports(file.ext)) {
        await queue.push(createTrack(file));
      } else if (sourcePaths.includes(file.path)) {
        // the selected source file is not a supported audio file. Notify the user
        await queue.push(new TrackImportError(UNSUPPORTED_FILE, file.path));
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
    queue: ImportQueue,
  ): Promise<DeviceFile[]> {
    const files: DeviceFile[] = [];

    await Promise.all(
      paths.map(async (path) => {
        try {
          const file = await this.storage.getFile(path);
          files.push(file);
        } catch (e: any) {
          await queue.push(new TrackImportError(e.message, path));
        }
      }),
    );

    return files;
  }
}

export type DeviceSourceMetadata = {
  filePath: string;
};
