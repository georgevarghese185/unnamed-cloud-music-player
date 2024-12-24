/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Library } from 'app/src-core/library';
import type { Source } from 'app/src-core/source';
import { DeviceSource } from 'app/src-core/source/device';
import { ElectronDeviceStorage } from 'app/src-electron/storage/device/electron-device-storage';
import { useQuasar } from 'quasar';
import { LibraryDatabase } from 'src/library/store/indexed-db/db';
import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track';
import HtmlPlayer from 'src/player/html-player';

export default function createLibrary() {
  const $q = useQuasar();
  const player = new HtmlPlayer();

  const sources: Source<string, unknown>[] = [];

  if ($q.platform.is.electron) {
    sources.push(new DeviceSource(new ElectronDeviceStorage(), player));
  }

  return new Library({
    player,
    store: {
      tracks: new IndexedDbTrackStore(new LibraryDatabase()),
    },
    sources,
  });
}
