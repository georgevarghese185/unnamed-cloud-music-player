import {
  DeviceFile,
  DeviceStorage,
  Directory,
} from 'app/src-core/storage/device';

export class ElectronDeviceStorage implements DeviceStorage {
  async listFiles(dir: Directory): Promise<DeviceFile[]> {
    return window.bridge.file.listFiles(dir);
  }

  async getFile(path: string): Promise<DeviceFile> {
    return window.bridge.file.getFile(path);
  }
}
