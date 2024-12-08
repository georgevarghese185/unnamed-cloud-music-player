import type { Track } from 'app/src-core/library'
import type { Identifier } from 'app/src-core/library/track'
import type { DexieOptions, EntityTable } from 'dexie'
import Dexie from 'dexie'

const DB_NAME = 'Library'

export type ITrack = Track

export interface IIdentifier extends Identifier {
  id: number
  trackId: number
}

export class LibraryDatabase extends Dexie {
  tracks!: EntityTable<ITrack, 'id'>
  identifiers!: EntityTable<IIdentifier, 'id'>

  constructor(dexieOptions?: DexieOptions) {
    super(DB_NAME, dexieOptions)

    this.version(1).stores({
      tracks: '++id',
      identifiers: '++id, [name+value], trackId',
    })
  }

  // methods for inserting entities without an id so that IndexedDB can autogenerate an id

  bulkAddTracks(tracks: Omit<ITrack, 'id'>[]): Promise<number[]> {
    return this.tracks.bulkAdd(tracks, { allKeys: true })
  }

  bulkAddIdentifiers(identifiers: Omit<IIdentifier, 'id'>[]): Promise<number[]> {
    return this.identifiers.bulkAdd(identifiers, {
      allKeys: true,
    })
  }
}
