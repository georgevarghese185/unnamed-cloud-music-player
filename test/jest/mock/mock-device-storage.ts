import { DeviceStorage, Directory, File } from 'app/src-core/storage/device';
import MemoryFileSystem from 'memory-fs';
import { basename, join, extname } from 'path';

type StatType = ReturnType<InstanceType<typeof MemoryFileSystem>['statSync']>;

const toDeviceDir = (parentPath: string, file: string): Directory => {
  return {
    name: file,
    path: join(parentPath, file),
    isDir: true,
  };
};

const toDeviceFile = (filePath: string): File => {
  return {
    path: filePath,
    name: basename(filePath),
    ext: extname(filePath),
    isDir: false,
  };
};

export class MockDeviceStorage implements DeviceStorage {
  public fs = new MemoryFileSystem();

  async listFiles(path: string) {
    if ((await this.stat(path)).isDirectory()) {
      const files: string[] = await this.readdir(path);
      return Promise.all(files.map((file) => toDeviceDir(path, file)));
    } else {
      return [toDeviceFile(path)];
    }
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
