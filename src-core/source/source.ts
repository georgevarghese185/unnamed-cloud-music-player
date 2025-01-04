/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Track, TrackImportError } from '../library';
import type { Producer } from '../util/producer-consumer';

export interface Source<K extends string, I, M> {
  name: K;
  import(inputs: I): Producer<(Track<K, M> | TrackImportError)[]>;
  stream(track: Track<K, M>): ReadableStream<Uint8Array>;
}
