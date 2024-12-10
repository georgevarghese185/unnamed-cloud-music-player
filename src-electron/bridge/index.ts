import type { DeviceFile, Directory } from 'app/src-core/storage/device';
import { ipcRenderer } from 'electron';
import {
  IPC_CHANNEL_GET_FILE,
  IPC_CHANNEL_LIST_FILES,
  IPC_CHANNEL_OPEN_FILE_SELECTOR,
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
  },
};
