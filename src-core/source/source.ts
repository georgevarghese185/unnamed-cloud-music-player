/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Track } from '../library';
import type { TrackImporter } from '../library/track-importer';

export interface Source<K extends string, I, M> {
  name: K;
  import(inputs: I): TrackImporter<K, M>;
  stream(track: Track<K, M>): Promise<ReadableStream<Uint8Array>>;
}
