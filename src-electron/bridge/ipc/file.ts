/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { BaseWindow, FileFilter, OpenDialogOptions } from 'electron';
import { dialog, ipcMain } from 'electron';
import { v7 } from 'uuid';
import type { NodeFsDeviceStorage } from '../../storage/device/node-fs-device-storage';
import {
  IPC_CHANNEL_GET_FILE,
  IPC_CHANNEL_LIST_FILES,
  IPC_CHANNEL_OPEN_FILE_SELECTOR,
  IPC_CHANNEL_READ_FILE,
} from './channel';
import type { Directory } from 'app/src-core/storage/device';

export type OpenFileSectorOptions = {
  files?: boolean;
  folders?: boolean;
  multi?: boolean;
  filters?: FileFilter[];
};

export function setupFileIpc(window: BaseWindow, storage: NodeFsDeviceStorage) {
  ipcMain.handle(IPC_CHANNEL_LIST_FILES, (event, dir: Directory) => {
    return storage.listFiles(dir);
  });

  ipcMain.handle(IPC_CHANNEL_GET_FILE, (event, path: string) => {
    return storage.getFile(path);
  });

  ipcMain.handle(IPC_CHANNEL_OPEN_FILE_SELECTOR, async (event, options?: OpenFileSectorOptions) => {
    const properties: OpenDialogOptions['properties'] = [];

    if (options?.files) {
      properties.push('openFile');
    }

    if (options?.folders) {
      properties.push('openDirectory');
    }

    if (options?.multi) {
      properties.push('multiSelections');
    }

    const result = await dialog.showOpenDialog(window, {
      properties,
    });

    if (result.canceled) {
      return undefined;
    }

    return result.filePaths;
  });

  ipcMain.handle(IPC_CHANNEL_READ_FILE, (event, path: string) => {
    const renderer = event.sender;
    const fileId = v7();
    const stream = storage.readFile(path);
    const reader = stream.getReader();

    async function sendBytes() {
      try {
        let cancel = false;
        let paused = false;

        ipcMain.once(`${IPC_CHANNEL_READ_FILE}:${fileId}:cancel`, () => {
          cancel = true;
        });

        ipcMain.on(`${IPC_CHANNEL_READ_FILE}:${fileId}:pause`, () => {
          paused = true;
        });

        ipcMain.on(`${IPC_CHANNEL_READ_FILE}:${fileId}:resume`, () => {
          paused = false;
        });

        for (
          let { done, value } = await reader.read();
          !done && !cancel && value;
          { done, value } = await reader.read()
        ) {
          renderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:data`, value);

          if (paused) {
            await new Promise((resolve) =>
              ipcMain.once(`${IPC_CHANNEL_READ_FILE}:${fileId}:resume`, resolve),
            );
          }
        }

        if (!cancel) {
          renderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:end`);
        } else {
          void reader.cancel();
        }
      } catch (e) {
        renderer.send(`${IPC_CHANNEL_READ_FILE}:${fileId}:error`, e);
      }

      cleanup();
    }

    function cleanup() {
      ipcMain.removeAllListeners(`${IPC_CHANNEL_READ_FILE}:${fileId}:cancel`);
      ipcMain.removeAllListeners(`${IPC_CHANNEL_READ_FILE}:${fileId}:pause`);
      ipcMain.removeAllListeners(`${IPC_CHANNEL_READ_FILE}:${fileId}:resume`);
    }

    ipcMain.once(`${IPC_CHANNEL_READ_FILE}:${fileId}:ready`, () => void sendBytes());
    return fileId;
  });
}
