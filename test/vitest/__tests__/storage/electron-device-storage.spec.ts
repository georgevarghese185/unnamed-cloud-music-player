import { ElectronDeviceStorage } from 'app/src-electron/storage/device/electron-device-storage';
import type { Directory, File } from 'app/src-core/storage/device';
import { resolve } from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { MockDeviceStorage } from '../../mock/mock-device-storage';

let storage = new MockDeviceStorage();

describe('Electron Device Storage', () => {
  beforeEach(async () => {
    storage = new MockDeviceStorage();
    window.bridge = {
      file: {
        getFile: storage.getFile.bind(storage),
        listFiles: storage.listFiles.bind(storage),
        openFileSelector: () => {
          throw new Error('not implemented');
        },
      },
    };
  });

  it('should get single file', async () => {
    storage.memoryFs.writeFileSync(`/file1.txt`, '0');
    const deviceStorage = new ElectronDeviceStorage();

    const file = await deviceStorage.getFile('/file1.txt');

    expect(file).toEqual({
      ext: '.txt',
      isDir: false,
      name: 'file1.txt',
      path: '/file1.txt',
    } as File);
  });

  it('should list files for given directory', async () => {
    const deviceStorage = new ElectronDeviceStorage();
    storage.memoryFs.writeFileSync(`/file1.txt`, '0');
    storage.memoryFs.writeFileSync(`/file2.txt`, '0');
    storage.memoryFs.mkdirSync(`/subfolder`);

    const dir = (await deviceStorage.getFile('/')) as Directory;

    const files = await deviceStorage.listFiles(dir);

    expect(files).toEqual(
      expect.arrayContaining([
        {
          ext: '.txt',
          isDir: false,
          name: 'file1.txt',
          path: resolve('/file1.txt'),
        },
        {
          ext: '.txt',
          isDir: false,
          name: 'file2.txt',
          path: resolve('/file2.txt'),
        },
        {
          isDir: true,
          name: 'subfolder',
          path: resolve('/subfolder'),
        },
      ]),
    );
  });
});
