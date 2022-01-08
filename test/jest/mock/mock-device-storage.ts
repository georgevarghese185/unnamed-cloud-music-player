import { NodeFsDeviceStorage } from 'app/src-electron/storage/device/node-fs-device-storage';
import MemoryFileSystem from 'memory-fs';
import { dirname } from 'path';

export class MockDeviceStorage extends NodeFsDeviceStorage {
  memoryFs: MemoryFileSystem;

  constructor() {
    const memoryFs = new MemoryFileSystem();
    super({
      readdir: memoryFs.readdir.bind(memoryFs),
      stat: memoryFs.stat.bind(memoryFs),
    });
    this.memoryFs = memoryFs;
  }

  writeFile(path: string, contents: Buffer | string) {
    this.createDir(dirname(path));
    this.memoryFs.writeFileSync(path, contents);
  }

  createDir(path: string) {
    this.memoryFs.mkdirpSync(path);
  }
}
