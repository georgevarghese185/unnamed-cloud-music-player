/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { NodeFsDeviceStorage } from 'app/src-electron/storage/device/node-fs-device-storage';
import MemoryFileSystem from 'memory-fs';

export class MockDeviceStorage extends NodeFsDeviceStorage {
  public override fs: MemoryFileSystem;

  constructor() {
    const fs = new MemoryFileSystem();
    super(fs);
    this.fs = fs;
  }
}
