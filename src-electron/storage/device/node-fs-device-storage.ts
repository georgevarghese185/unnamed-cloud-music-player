/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as nodeFs from 'fs';
import { basename, extname, join } from 'path';
import { promisify } from 'util';
import type { DeviceFile, DeviceStorage, Directory, File } from 'app/src-core/storage/device';

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
  private statCache = new Map<string, nodeFs.Stats>();

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
        size: await this.fileSize(path),
        path,
      } as File;
    }
  }

  readFile(path: string): ReadableStream<Uint8Array> {
    const stream = this.fs.createReadStream(path);

    return new ReadableStream(
      {
        type: 'bytes',
        start(controller) {
          stream.on('end', () => {
            controller.close();
          });

          stream.on('error', (err) => {
            controller.error(err);
          });
        },
        async pull(controller) {
          let data = stream.read();

          while (data == null) {
            await new Promise((resolve) => stream.once('readable', resolve));
            data = stream.read();
          }

          controller.enqueue(data);
        },
        cancel() {
          stream.destroy();
        },
      },
      { highWaterMark: 128000 },
    );
  }

  private async isDirectory(path: string) {
    const fileStat = await this.stat(path);
    return fileStat.isDirectory();
  }

  private async fileSize(path: string) {
    const fileStat = await this.stat(path);
    return fileStat.size;
  }

  private async stat(path: string) {
    const cached = this.statCache.get(path);
    if (cached) {
      return cached;
    }

    const stat = await promisify(this.fs.stat.bind(this.fs))(path);

    if (this.statCache.size > 10) {
      const firstKey = this.statCache.keys().next().value;
      if (firstKey) {
        this.statCache.delete(firstKey);
      }
    }

    this.statCache.set(path, stat);

    return stat;
  }
}
