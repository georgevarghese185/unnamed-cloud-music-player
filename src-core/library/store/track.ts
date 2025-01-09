/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Identifier, Track } from '../track';

export type ListOptions = {
  limit: number;
  offset: number;
};

export interface TrackStore {
  add(track: Track[]): Promise<void>;
  update(track: Track[]): Promise<void>;
  findByIdentifiers(identifiers: Identifier[]): Promise<Track[]>;
  findTracksWithoutMetadata(options: ListOptions): Promise<Track[]>;
  getArtwork(track: Track): Promise<Uint8Array | null>;
  storeArtwork(track: Track, art: Uint8Array | undefined): Promise<void>;
  list(options: ListOptions): Promise<Track[]>;
}
