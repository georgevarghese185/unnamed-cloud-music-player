import { UNSUPPORTED_FILE } from '../constants/errors';
import { Track, TrackImporter } from '../library';
import { ImportQueue, TrackImportError } from '../library/track-importer';
import { Player } from '../player';
import { DeviceStorage, File } from '../storage/device';

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

  async import(path: string): Promise<TrackImporter> {
    return new TrackImporter(async (queue) => {
      try {
        await this.importFromPath(path, queue);
      } catch (e: any) {
        await queue.push(new TrackImportError(e.message, path));
      }

      queue.end();
    });
  }

  private async importFromPath(sourcePath: string, queue: ImportQueue) {
    let files = [await this.storage.getFile(sourcePath)];
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
      } else if (file.path === sourcePath) {
        // the selected source file is not a supported audio file. Notify the user
        await queue.push(new TrackImportError(UNSUPPORTED_FILE, file.path));
      }
    }
  }
}

export type DeviceSourceMetadata = {
  filePath: string;
};
