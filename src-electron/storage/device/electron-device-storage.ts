/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { DeviceFile, DeviceStorage, Directory } from 'app/src-core/storage/device';

export class ElectronDeviceStorage implements DeviceStorage {
  async listFiles(dir: Directory): Promise<DeviceFile[]> {
    return window.bridge.file.listFiles(dir);
  }

  async getFile(path: string): Promise<DeviceFile> {
    return window.bridge.file.getFile(path);
  }

  readFile(path: string): ReadableStream<Uint8Array> {
    let cancel = () => {};
    let read = (): Promise<Uint8Array | undefined> => Promise.resolve(undefined);

    const stream = new ReadableStream<Uint8Array>({
      type: 'bytes',
      async start(controller) {
        ({ cancel, read } = await window.bridge.file.readFile(path, (e) => controller.error(e)));
      },
      async pull(controller) {
        const data = await read();
        if (!data) {
          controller.close();
          return;
        }
        controller.enqueue(data);
      },
      cancel() {
        cancel();
      },
    });

    return stream;
  }
}
