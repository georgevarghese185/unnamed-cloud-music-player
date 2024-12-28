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
    let cancel: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const _cancel = await window.bridge.file.readFile(path, {
          onData(chunk) {
            controller.enqueue(chunk);
          },
          onEnd() {
            controller.close();
          },
          onError(e) {
            controller.error(e);
          },
        });
        cancel = _cancel;
      },
      cancel() {
        cancel?.();
      },
    });

    return stream;
  }
}
