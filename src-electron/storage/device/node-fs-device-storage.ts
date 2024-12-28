/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { DeviceFile, DeviceStorage, Directory, File } from 'app/src-core/storage/device';
import * as nodeFs from 'fs';
import { basename, extname, join } from 'path';
import { promisify } from 'util';

export type FsCallback<T extends unknown[]> = (
  err: NodeJS.ErrnoException | null,
  ...result: T
) => void;

export type Fs = {
  readdir: (path: string, callback: FsCallback<[files: string[]]>) => void;
  stat: (path: string, callback: FsCallback<[stats: nodeFs.Stats]>) => void;
  createReadStream: (path: string) => nodeFs.ReadStream;
};

export class NodeFsDeviceStorage implements DeviceStorage {
  constructor(protected fs: Fs = nodeFs) {}

  async listFiles(dir: Directory): Promise<DeviceFile[]> {
    const files = await promisify(this.fs.readdir.bind(this.fs))(dir.path);
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

  readFile(path: string): ReadableStream<Uint8Array> {
    const stream = this.fs.createReadStream(path);

    return new ReadableStream({
      start(controller) {
        let closed = false;

        stream.on('data', (chunk) => {
          if (Buffer.isBuffer(chunk)) {
            controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
          } else {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        });

        stream.on('end', () => {
          if (closed) {
            return;
          }
          controller.close();
          closed = true;
        });

        stream.on('error', (err) => {
          controller.error(err);
          closed = true;
        });
      },
      cancel() {
        stream.destroy();
      },
    });
  }

  private async isDirectory(path: string) {
    const fileStat = await promisify(this.fs.stat.bind(this.fs))(path);
    return fileStat.isDirectory();
  }
}
