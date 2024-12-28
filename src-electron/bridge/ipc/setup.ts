/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { BaseWindow } from 'electron';
import { setupFileIpc } from './file';
import { NodeFsDeviceStorage } from 'app/src-electron/storage/device/node-fs-device-storage';

export function setupIpcForBridgeApi(window: BaseWindow, storage = new NodeFsDeviceStorage()) {
  setupFileIpc(window, storage);
}
