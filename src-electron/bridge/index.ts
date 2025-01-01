/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { IpcRendererEvent } from 'electron';
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
      callbacks: {
        onData: (chunk: Uint8Array) => void;
        onEnd: () => void;
        onError: (e: unknown) => void;
      },
    ) => Promise<{ cancel: () => void; pause: () => void; resume: () => void }>;
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
      const fileId = await ipcRenderer.invoke(IPC_CHANNEL_READ_FILE, path);

      ipcRenderer.on(
        `${IPC_CHANNEL_READ_FILE}:${fileId}:data`,
        (event: IpcRendererEvent, chunk: Uint8Array) => {
          callbacks.onData(chunk);
        },
      );

      ipcRenderer.on(`${IPC_CHANNEL_READ_FILE}:${fileId}:end`, () => {
        callbacks.onEnd();
        cleanup();
      });

      ipcRenderer.on(
        `${IPC_CHANNEL_READ_FILE}:${fileId}:error`,
        (event: IpcRendererEvent, e: unknown) => {
          callbacks.onError(e);
          cleanup();
        },
      );

      function cleanup() {
        ipcRenderer.removeAllListeners(`${IPC_CHANNEL_READ_FILE}:${fileId}:data`);
        ipcRenderer.removeAllListeners(`${IPC_CHANNEL_READ_FILE}:${fileId}:end`);
        ipcRenderer.removeAllListeners(`${IPC_CHANNEL_READ_FILE}:${fileId}:error`);
      }

      function cancel() {
        ipcRenderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:cancel`);
        cleanup();
      }

      function pause() {
        ipcRenderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:pause`);
      }

      function resume() {
        ipcRenderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:resume`);
      }

      ipcRenderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:ready`);
      return { cancel, pause, resume };
    },
  },
};
