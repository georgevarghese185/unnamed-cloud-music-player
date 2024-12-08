import { Library } from 'app/src-core/library';
import { DeviceSource } from 'app/src-core/source/device';
import { MockDeviceStorage } from 'app/test/vitest/mock/mock-device-storage';
import { MockPlayer } from 'app/test/vitest/mock/mock-player';
import { MockTrackStore } from 'app/test/vitest/mock/mock-track-store';

export const createDeviceLibraryFixture = () => {
  const trackStore = new MockTrackStore();
  const deviceStorage = new MockDeviceStorage();
  const player = new MockPlayer();
  const deviceSource = new DeviceSource(deviceStorage, player);
  const library = new Library({ player, store: { tracks: trackStore } });

  return {
    deviceStorage,
    deviceSource,
    player,
    trackStore,
    library,
  };
};
