import type { Track } from 'app/src-core/library'
import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track'
import { MockLibraryDatabase } from './mock-library-database'

export class MockTrackStore extends IndexedDbTrackStore {
  constructor() {
    super(new MockLibraryDatabase())
  }

  getAllTracks(): Promise<Track[]> {
    return this.db.tracks.toArray()
  }
}
