/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { ipcRenderer } from 'electron';
import {
  IPC_CHANNEL_GET_FILE,
  IPC_CHANNEL_LIST_FILES,
  IPC_CHANNEL_OPEN_FILE_SELECTOR,
  IPC_CHANNEL_READ_FILE,
} from './ipc/channel';
import type { OpenFileSectorOptions } from './ipc/file';
import type { DeviceFile, Directory } from 'app/src-core/storage/device';

declare global {
  interface Window {
    bridge: Bridge;
  }
}

export type Bridge = {
  file: {
    listFiles: (dir: Directory) => Promise<DeviceFile[]>;
    getFile: (path: string) => Promise<DeviceFile>;
    openFileSelector: (options?: OpenFileSectorOptions) => Promise<string[] | undefined>;
    readFile: (
      path: string,
      onError: (e: unknown) => void,
    ) => Promise<{ cancel: () => void; read: () => Promise<Uint8Array | undefined> }>;
  };
};

export const bridge: Bridge = {
  file: {
    listFiles(dir) {
      return ipcRenderer.invoke(IPC_CHANNEL_LIST_FILES, dir);
    },
    getFile(path) {
      return ipcRenderer.invoke(IPC_CHANNEL_GET_FILE, path);
    },
    openFileSelector(options) {
      return ipcRenderer.invoke(IPC_CHANNEL_OPEN_FILE_SELECTOR, options);
    },
    async readFile(path, onError) {
      const fileId = await ipcRenderer.invoke(IPC_CHANNEL_READ_FILE, path);

      async function read() {
        const data: Uint8Array | undefined = await ipcRenderer.invoke(
          `${IPC_CHANNEL_READ_FILE}:${fileId}:read`,
        );
        if (!data) {
          cleanup();
        }
        return data;
      }

      function cancel() {
        cleanup();
        ipcRenderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:cancel`);
      }

      ipcRenderer.on(`${IPC_CHANNEL_READ_FILE}:${fileId}:error`, (event, e: unknown) => {
        cleanup();
        onError(e);
      });

      function cleanup() {
        ipcRenderer.removeAllListeners(`${IPC_CHANNEL_READ_FILE}:${fileId}:error`);
      }

      return { cancel, read };
    },
  },
};
