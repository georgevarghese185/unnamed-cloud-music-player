export interface DeviceStorage {
  listFiles(path: string): Promise<DeviceFile[]>;
}

export type DeviceFile = File | Directory;

export type Directory = {
  path: string;
  name: string;
  isDir: true;
};

export type File = {
  path: string;
  name: string;
  ext: string;
  isDir: false;
};
