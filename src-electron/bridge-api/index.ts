import type { DeviceFile, Directory } from 'app/src-core/storage/device';
import * as file from './file';

declare global {
  interface Window {
    bridge: Bridge;
  }
}

export type Bridge = {
  file: {
    listFiles: (dir: Directory) => Promise<DeviceFile[]>;
    getFile: (path: string) => Promise<DeviceFile>;
  };
};

export const bridge: Bridge = { file };
