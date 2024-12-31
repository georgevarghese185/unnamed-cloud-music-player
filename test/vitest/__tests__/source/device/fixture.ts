/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { Library } from 'app/src-core/library';
import { DeviceSource } from 'app/src-core/source/device';
import type { Fs } from 'app/src-electron/storage/device/node-fs-device-storage';
import { NodeFsDeviceStorage } from 'app/src-electron/storage/device/node-fs-device-storage';
import { MockPlayer } from 'app/test/vitest/mock/mock-player';
import { MockTrackStore } from 'app/test/vitest/mock/mock-track-store';

export const createDeviceLibraryFixture = (fs: Fs) => {
  const trackStore = new MockTrackStore();
  const deviceStorage = new NodeFsDeviceStorage(fs);
  const player = new MockPlayer();
  const deviceSource = new DeviceSource(deviceStorage, player);
  const library = new Library({ player, store: { tracks: trackStore }, sources: [deviceSource] });

  return {
    deviceStorage,
    deviceSource,
    player,
    trackStore,
    library,
  };
};
