/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventEmitter } from 'events';
import type TypedEventEmitter from 'typed-emitter';
import type { Track } from './track';

export type GlobalEvents = {
  [key: `trackMetadataUpdate:${string}`]: (track: Track) => void;
};

const events = new EventEmitter() as TypedEventEmitter<GlobalEvents>;

events.setMaxListeners(200);

export default events;
