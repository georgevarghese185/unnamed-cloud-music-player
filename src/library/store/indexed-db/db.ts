import { Track } from 'app/src-core/library';
import Dexie from 'dexie';

const DB_NAME = 'Library';

export type ITrack = Track;

export class LibraryDatabase extends Dexie {
  tracks!: Dexie.Table<ITrack, number>;

  constructor(indexedDb?: any) {
    super(DB_NAME, { indexedDB: indexedDb });

    this.version(1).stores({
      tracks: '++id',
    });
  }

  // methods for inserting entities without an id so that IndexedDB can autogenerate an id

  bulkAddTracks(tracks: Omit<ITrack, 'id'>[]): Promise<number[]> {
    return this.tracks.bulkAdd(tracks as any as ITrack[], { allKeys: true });
  }
}
