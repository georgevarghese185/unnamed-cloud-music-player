/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export interface DeviceStorage {
  listFiles(dir: Directory): Promise<DeviceFile[]>;
  getFile(path: string): Promise<DeviceFile>;
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
