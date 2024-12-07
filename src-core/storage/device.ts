export interface DeviceStorage {
  listFiles(dir: Directory): Promise<DeviceFile[]>
  getFile(path: string): Promise<DeviceFile>
}

export type DeviceFile = File | Directory

export type Directory = {
  path: string
  name: string
  isDir: true
}

export type File = {
  path: string
  name: string
  ext: string
  isDir: false
}
