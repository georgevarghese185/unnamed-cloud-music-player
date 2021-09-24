import { Track, TrackImporter } from '../library';
import { ImportQueue, TrackImportError } from '../library/track-importer';
import { Player } from '../player';
import { DeviceFile, DeviceStorage, Directory, File } from '../storage/device';

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
    return new TrackImporter((queue) => this.start(path, queue));
  }

  private async start(path: string, queue: ImportQueue) {
    const root: Directory = { isDir: true, path, name: 'root' };
    let list: DeviceFile[] = [root];
    let file;

    while ((file = list.shift())) {
      if (file.isDir) {
        try {
          const dirContents = await this.listFiles(file.path);
          list = list.concat(dirContents);
        } catch (e: any) {
          const error = new TrackImportError(e.message, file.path);
          await queue.push(error);
        }
      } else {
        if (!this.isSupported(file)) {
          continue;
        }

        await queue.push(createTrack(file));
      }
    }

    queue.end();
  }

  private listFiles(path: string): Promise<DeviceFile[]> {
    return this.storage.listFiles(path);
  }

  private isSupported(file: File) {
    return this.player.supports(file.ext);
  }
}

export type DeviceSourceMetadata = {
  filePath: string;
};
