/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { ElectronDeviceStorage } from 'app/src-electron/storage/device/electron-device-storage';
import type { Directory, File } from 'app/src-core/storage/device';
import { resolve } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeFsDeviceStorage } from 'app/src-electron/storage/device/node-fs-device-storage';
import { bridge } from 'app/src-electron/bridge';
import { setupIpcForBridgeApi } from 'app/src-electron/bridge/ipc/setup';
import type { BaseWindow } from 'electron';
import { randomBytes } from 'crypto';
import { hashBuffer, hashUint8Array } from '../util/hash';
import * as fs from 'fs';

vi.mock('electron');

let storage = new NodeFsDeviceStorage();

describe('Electron Device Storage', () => {
  beforeEach(() => {
    if (fs.existsSync(resolve('test/artifacts/files'))) {
      fs.rmSync(resolve('test/artifacts/files'), { recursive: true });
    }
    fs.mkdirSync(resolve('test/artifacts/files'));
    storage = new NodeFsDeviceStorage();
    window.bridge = bridge;
    setupIpcForBridgeApi({} as BaseWindow, storage);
  });

  it('should get single file', async () => {
    fs.writeFileSync(resolve('test/artifacts/files/file1.txt'), '0');
    const deviceStorage = new ElectronDeviceStorage();

    const file = await deviceStorage.getFile(resolve('test/artifacts/files/file1.txt'));

    expect(file).toEqual({
      ext: '.txt',
      isDir: false,
      name: 'file1.txt',
      path: resolve('test/artifacts/files/file1.txt'),
    } as File);
  });

  it('should list files for given directory', async () => {
    fs.writeFileSync(resolve(`test/artifacts/files/file1.txt`), '0');
    fs.writeFileSync(resolve(`test/artifacts/files/file2.txt`), '0');
    fs.mkdirSync(resolve(`test/artifacts/files/subfolder`));

    const deviceStorage = new ElectronDeviceStorage();

    const dir = (await deviceStorage.getFile(resolve('test/artifacts/files'))) as Directory;

    const files = await deviceStorage.listFiles(dir);

    expect(files).toEqual(
      expect.arrayContaining([
        {
          ext: '.txt',
          isDir: false,
          name: 'file1.txt',
          path: resolve('test/artifacts/files/file1.txt'),
        },
        {
          ext: '.txt',
          isDir: false,
          name: 'file2.txt',
          path: resolve('test/artifacts/files/file2.txt'),
        },
        {
          isDir: true,
          name: 'subfolder',
          path: resolve('test/artifacts/files/subfolder'),
        },
      ]),
    );
  });

  it('should stream a file', async () => {
    const fileData = randomBytes(10 * 1024 * 1024);

    fs.writeFileSync(resolve(`test/artifacts/files/file1.txt`), fileData);

    const deviceStorage = new ElectronDeviceStorage();

    const stream = await deviceStorage.readFile(resolve('test/artifacts/files/file1.txt'));

    const reader = stream.getReader();
    let isDone = false;
    const chunks: Uint8Array[] = [];

    do {
      const { done, value } = await reader.read();
      isDone = done;
      if (value) {
        chunks.push(value);
      }
    } while (!isDone);

    expect(hashUint8Array(chunks)).toEqual(hashBuffer(fileData));
  });
});
