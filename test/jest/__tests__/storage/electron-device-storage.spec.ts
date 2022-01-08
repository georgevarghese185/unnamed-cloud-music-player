import { ElectronDeviceStorage } from 'app/src-electron/storage/device/electron-device-storage';
import { mkdir, writeFile } from 'fs';
import { promisify } from 'util';
import rimraf from 'rimraf';
import { Directory, File } from 'app/src-core/storage/device';
import { resolve } from 'path';
import { bridge } from 'app/src-electron/bridge-api';

const TEST_FILES_DIR = './test/test-files';

describe('Electron Device Storage', () => {
  beforeAll(async () => {
    window.bridge = bridge;
  });

  beforeEach(async () => {
    await promisify(rimraf)(TEST_FILES_DIR);
    await promisify(mkdir)(TEST_FILES_DIR);
  });

  it('should get single file', async () => {
    const deviceStorage = new ElectronDeviceStorage();
    await promisify(writeFile)(`${TEST_FILES_DIR}/file1.txt`, '0');

    const file = await deviceStorage.getFile(
      resolve(`${TEST_FILES_DIR}/file1.txt`),
    );

    expect(file).toEqual({
      ext: '.txt',
      isDir: false,
      name: 'file1.txt',
      path: resolve(TEST_FILES_DIR, 'file1.txt'),
    } as File);
  });

  it('should list files for given directory', async () => {
    const deviceStorage = new ElectronDeviceStorage();
    await promisify(writeFile)(`${TEST_FILES_DIR}/file1.txt`, '0');
    await promisify(writeFile)(`${TEST_FILES_DIR}/file2.txt`, '0');
    await promisify(mkdir)(`${TEST_FILES_DIR}/subfolder`);

    const dir = (await deviceStorage.getFile(
      resolve(TEST_FILES_DIR),
    )) as Directory;

    const files = await deviceStorage.listFiles(dir);

    expect(files).toEqual(
      expect.arrayContaining([
        {
          ext: '.txt',
          isDir: false,
          name: 'file1.txt',
          path: resolve(TEST_FILES_DIR, 'file1.txt'),
        },
        {
          ext: '.txt',
          isDir: false,
          name: 'file2.txt',
          path: resolve(TEST_FILES_DIR, 'file2.txt'),
        },
        {
          isDir: true,
          name: 'subfolder',
          path: resolve(TEST_FILES_DIR, 'subfolder'),
        },
      ]),
    );
  });
});
