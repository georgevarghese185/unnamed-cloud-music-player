import { NodeFsDeviceStorage } from '../../storage/device/node-fs-device-storage';
import type { Directory } from 'app/src-core/storage/device';
import type { FileFilter, OpenDialogOptions } from 'electron';
import { dialog, ipcMain } from 'electron';
import {
  IPC_CHANNEL_GET_FILE,
  IPC_CHANNEL_LIST_FILES,
  IPC_CHANNEL_OPEN_FILE_SELECTOR,
} from './channel';

const storage = new NodeFsDeviceStorage();

export type OpenFileSectorOptions = {
  files?: boolean;
  folders?: boolean;
  multi?: boolean;
  filters?: FileFilter[];
};

export function setupFileIpc() {
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

    const result = await dialog.showOpenDialog({
      properties,
    });

    if (result.canceled) {
      return undefined;
    }

    return result.filePaths;
  });
}