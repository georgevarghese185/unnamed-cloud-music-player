import { Library } from 'app/src-core/library';
import { DeviceSource } from 'app/src-core/source/device';
import { ElectronDeviceStorage } from 'app/src-electron/storage/device/electron-device-storage';
import { LibraryDatabase } from 'src/library/store/indexed-db/db';
import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track';
import HtmlPlayer from 'src/player/html-player';

export default function createLibrary() {
  const player = new HtmlPlayer();

  return new Library({
    player,
    store: {
      tracks: new IndexedDbTrackStore(new LibraryDatabase()),
    },
    sources: [new DeviceSource(new ElectronDeviceStorage(), player)],
  });
}
