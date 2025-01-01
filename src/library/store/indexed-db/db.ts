/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { DexieOptions, EntityTable } from 'dexie';
import DexieJs from 'dexie';
import type { Track, Identifier } from 'app/src-core/library';

const DB_NAME = 'Library';

export type ITrack = Track;

export interface IIdentifier extends Identifier {
  id: number;
  trackId: number;
}

export class LibraryDatabase extends DexieJs {
  tracks!: EntityTable<ITrack, 'id'>;
  identifiers!: EntityTable<IIdentifier, 'id'>;

  constructor(dexieOptions?: DexieOptions) {
    super(DB_NAME, dexieOptions);

    this.version(1).stores({
      tracks: '++id',
      identifiers: '++id, [name+value], trackId',
    });
  }

  // methods for inserting entities without an id so that IndexedDB can autogenerate an id

  bulkAddTracks(tracks: Omit<ITrack, 'id'>[]): Promise<number[]> {
    return this.tracks.bulkAdd(tracks, { allKeys: true });
  }

  bulkAddIdentifiers(identifiers: Omit<IIdentifier, 'id'>[]): Promise<number[]> {
    return this.identifiers.bulkAdd(identifiers, {
      allKeys: true,
    });
  }
}
