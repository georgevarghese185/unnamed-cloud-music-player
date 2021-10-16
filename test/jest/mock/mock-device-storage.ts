import {
  DeviceFile,
  DeviceStorage,
  Directory,
} from 'app/src-core/storage/device';
import MemoryFileSystem from 'memory-fs';
import { basename, extname } from 'path';

type StatType = ReturnType<InstanceType<typeof MemoryFileSystem>['statSync']>;

const toDeviceFile = (filePath: string, isDir: boolean): DeviceFile => {
  const path = filePath;
  const name = basename(filePath);

  return isDir
    ? ({ path, name, isDir: true } as Directory)
    : { path, name, ext: extname(filePath), isDir: false };
};

export class MockDeviceStorage implements DeviceStorage {
  public fs = new MemoryFileSystem();

  async listFiles(dir: Directory) {
    const files: string[] = await this.readdir(dir.path);
    return Promise.all(
      files.map(async (file) => {
        const path = `${dir.path}/${file}`;
        return toDeviceFile(path, await this.isDir(path));
      }),
    );
  }

  async getFile(path: string) {
    return toDeviceFile(path, await this.isDir(path));
  }

  private async isDir(path: string): Promise<boolean> {
    return (await this.stat(path)).isDirectory();
  }

  private async stat(path: string): Promise<StatType> {
    return new Promise((resolve, reject) =>
      this.fs.stat(path, (err, stat) => (err ? reject(err) : resolve(stat))),
    );
  }

  private async readdir(path: string): Promise<string[]> {
    return new Promise((resolve, reject) =>
      this.fs.readdir(path, (err, stat) => (err ? reject(err) : resolve(stat))),
    );
  }
}
