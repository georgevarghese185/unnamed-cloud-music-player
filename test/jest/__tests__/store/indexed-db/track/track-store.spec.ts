import { MockLibraryDatabase } from 'app/test/jest/mock/mock-library-database';
import { deviceTrackExpectation } from '../../../shared/expectation/track';
import { createTracks } from './fixture';
import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track';
import { LibraryDatabase } from 'src/library/store/indexed-db/db';
import { identifiersExpectation } from './expectation';

describe('IndexedDB track store', () => {
  let db: LibraryDatabase;
  let store: IndexedDbTrackStore;

  beforeEach(() => {
    db = new MockLibraryDatabase();
    store = new IndexedDbTrackStore(db);
  });

  it('should add tracks to database', async () => {
    const songPaths = [
      '/folder/Song1.mp3',
      '/folder/Song2.mp3',
      '/folder/Song3.mp3',
    ];
    const tracks = createTracks(songPaths);

    await store.add(tracks);

    const insertedTracks = await db.tracks.toArray();
    const insertedIdentifiers = await db.identifiers.toArray();

    expect(insertedTracks).toEqual(songPaths.map(deviceTrackExpectation));
    expect(insertedIdentifiers).toEqual(identifiersExpectation(insertedTracks));
  });

  it('should find tracks by identifiers', async () => {
    const tracks = createTracks([
      '/folder/Song1.mp3',
      '/folder/Song2.mp3',
      '/folder/Song3.mp3',
    ]);

    await store.add(tracks);

    const tracksToFind = [tracks[0], tracks[2]];
    const foundTracks = await store.findByIdentifiers([
      tracksToFind[0].identifiers[0],
      tracksToFind[1].identifiers[0],
    ]);

    expect(foundTracks).toEqual(
      tracksToFind.map((track) =>
        deviceTrackExpectation(track.source.meta.filePath),
      ),
    );
  });
});
