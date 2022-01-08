import { Track } from 'app/src-core/library';
import { Identifier } from 'app/src-core/library/track';
import Dexie, { DexieOptions } from 'dexie';

const DB_NAME = 'Library';

export type ITrack = Track;

export interface IIdentifier extends Identifier {
  id: number;
  trackId: number;
}

export class LibraryDatabase extends Dexie {
  tracks!: Dexie.Table<ITrack, number>;
  identifiers!: Dexie.Table<IIdentifier, number>;

  constructor(dexieOptions?: DexieOptions) {
    super(DB_NAME, dexieOptions);

    this.version(1).stores({
      tracks: '++id',
      identifiers: '++id, [name+value], trackId',
    });
  }

  // methods for inserting entities without an id so that IndexedDB can autogenerate an id

  bulkAddTracks(tracks: Omit<ITrack, 'id'>[]): Promise<number[]> {
    return this.tracks.bulkAdd(tracks as any as ITrack[], { allKeys: true });
  }

  bulkAddIdentifiers(
    identifiers: Omit<IIdentifier, 'id'>[],
  ): Promise<number[]> {
    return this.identifiers.bulkAdd(identifiers as any as IIdentifier[], {
      allKeys: true,
    });
  }
}
