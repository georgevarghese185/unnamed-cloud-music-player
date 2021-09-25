import { DeviceFile, Directory, File } from 'app/src-core/storage/device';
import { readdir, stat } from 'fs';
import { basename, extname, join } from 'path';
import { promisify } from 'util';

const isDirectory = async (path: string) => {
  const fileStat = await promisify(stat)(path);
  return fileStat.isDirectory();
};

export const listFiles = async (dir: Directory): Promise<DeviceFile[]> => {
  const files = await promisify(readdir)(dir.path);
  return Promise.all(files.map((file) => getFile(join(dir.path, file))));
};

export const getFile = async (path: string): Promise<DeviceFile> => {
  if (await isDirectory(path)) {
    return {
      isDir: true,
      name: basename(path),
      path,
    } as Directory;
  } else {
    return {
      ext: extname(path),
      isDir: false,
      name: basename(path),
      path,
    } as File;
  }
};
