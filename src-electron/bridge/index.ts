/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { DeviceFile, Directory } from 'app/src-core/storage/device';
import type { IpcRendererEvent } from 'electron';
import { ipcRenderer } from 'electron';
import {
  IPC_CHANNEL_GET_FILE,
  IPC_CHANNEL_LIST_FILES,
  IPC_CHANNEL_OPEN_FILE_SELECTOR,
  IPC_CHANNEL_READ_FILE,
} from './ipc/channel';
import type { OpenFileSectorOptions } from './ipc/file';

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
      callbacks: {
        onData: (chunk: Uint8Array) => void;
        onEnd: () => void;
        onError: (e: unknown) => void;
      },
    ) => Promise<() => void>;
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
    async readFile(path, callbacks) {
      function onData(event: IpcRendererEvent, chunk: Uint8Array) {
        callbacks.onData(chunk);
      }

      function onEnd() {
        callbacks.onEnd();
        final();
      }

      function onError(event: IpcRendererEvent, e: unknown) {
        callbacks.onError(e);
        final();
      }

      function final() {
        ipcRenderer.off(`${IPC_CHANNEL_READ_FILE}:${fileId}:data`, onData);
        ipcRenderer.off(`${IPC_CHANNEL_READ_FILE}:${fileId}:end`, onEnd);
        ipcRenderer.off(`${IPC_CHANNEL_READ_FILE}:${fileId}:error`, onError);
      }

      function cancel() {
        ipcRenderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:cancel`);
        final();
      }

      const fileId = await ipcRenderer.invoke(IPC_CHANNEL_READ_FILE, path);
      ipcRenderer.on(`${IPC_CHANNEL_READ_FILE}:${fileId}:data`, onData);
      ipcRenderer.on(`${IPC_CHANNEL_READ_FILE}:${fileId}:end`, onEnd);
      ipcRenderer.on(`${IPC_CHANNEL_READ_FILE}:${fileId}:error`, onError);

      ipcRenderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:ready`);

      return cancel;
    },
  },
};
