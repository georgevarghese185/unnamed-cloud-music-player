// eslint-disable-next-line @typescript-eslint/no-var-requires
const FakeIndexedDbFactory = require('fake-indexeddb/lib/FDBFactory');
import { Track } from 'app/src-core/library';
import { LibraryDatabase } from 'src/library/store/indexed-db/db';
import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track';

export class MockTrackStore extends IndexedDbTrackStore {
  constructor() {
    const indexedDb = new FakeIndexedDbFactory();
    super(new LibraryDatabase(indexedDb));
  }

  getAllTracks(): Promise<Track[]> {
    return this.db.tracks.toArray();
  }
}
