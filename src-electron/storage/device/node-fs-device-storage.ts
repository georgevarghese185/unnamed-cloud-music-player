import {
  DeviceFile,
  DeviceStorage,
  Directory,
  File,
} from 'app/src-core/storage/device';
import * as nodeFs from 'fs';
import { basename, extname, join } from 'path';
import { promisify } from 'util';

export type FsCallback<T extends any[]> = (
  err: NodeJS.ErrnoException | null,
  ...result: T
) => void;

export type Fs = {
  readdir: (path: string, callback: FsCallback<[files: string[]]>) => void;
  stat: (path: string, callback: FsCallback<[stats: nodeFs.Stats]>) => void;
};

export class NodeFsDeviceStorage implements DeviceStorage {
  constructor(private fs: Fs = nodeFs) {}

  async listFiles(dir: Directory): Promise<DeviceFile[]> {
    const files = await promisify(this.fs.readdir)(dir.path);
    return Promise.all(files.map((file) => this.getFile(join(dir.path, file))));
  }

  async getFile(path: string): Promise<DeviceFile> {
    if (await this.isDirectory(path)) {
      return {
        isDir: true,
        name: basename(path),
        path,
      } as Directory;
    } else {
      return {
        ext: extname(path),
        isDir: false,
        name: basename(path),
        path,
      } as File;
    }
  }

  private async isDirectory(path: string) {
    const fileStat = await promisify(this.fs.stat)(path);
    return fileStat.isDirectory();
  }
}