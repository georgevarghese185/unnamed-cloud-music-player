/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { MockLibraryDatabase } from 'app/test/vitest/mock/mock-library-database';
import { createTracks } from './fixture';
import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track';
import type { LibraryDatabase } from 'src/library/store/indexed-db/db';
import { identifiersExpectation } from './expectation';
import { range } from 'lodash';
import { beforeEach, describe, expect, it } from 'vitest';
import { deviceTrackExpectation } from '../../../expectation/track';
import type { DeviceSourceMetadata } from 'app/src-core/source/device';
import type { Track } from 'app/src-core/library';
import { resolve } from 'path';

describe('IndexedDB track store', () => {
  let db: LibraryDatabase;
  let store: IndexedDbTrackStore;

  beforeEach(() => {
    db = new MockLibraryDatabase();
    store = new IndexedDbTrackStore(db);
  });

  it('should add tracks to database', async () => {
    const songPaths = ['/folder/Song1.mp3', '/folder/Song2.mp3', '/folder/Song3.mp3'].map((p) =>
      resolve(p),
    );
    const tracks = createTracks(songPaths);

    await store.add(tracks);

    const insertedTracks = await db.tracks.toArray();
    const insertedIdentifiers = await db.identifiers.toArray();

    expect(insertedTracks).toEqual(songPaths.map(deviceTrackExpectation));
    expect(insertedIdentifiers).toEqual(identifiersExpectation(insertedTracks));
  });

  it('should find tracks by identifiers', async () => {
    const tracks = createTracks(
      ['/folder/Song1.mp3', '/folder/Song2.mp3', '/folder/Song3.mp3'].map((p) => resolve(p)),
    );

    await store.add(tracks);

    // @ts-expect-error ignore undefined
    const tracksToFind: Track<DeviceSourceMetadata>[] = [tracks[0], tracks[2]];
    const foundTracks = await store.findByIdentifiers([
      // @ts-expect-error ignore undefined
      tracksToFind[0].identifiers[0],
      // @ts-expect-error ignore undefined
      tracksToFind[1].identifiers[0],
    ]);

    expect(foundTracks).toEqual(
      tracksToFind.map((track) => deviceTrackExpectation(track.source.meta.filePath)),
    );
  });

  it('should list all tracks with limit and offset', async () => {
    const tracks = createTracks(range(10).map((i) => resolve(`/folder/Song${i + 1}`)));

    await store.add(tracks);

    let list = await store.list({ limit: 5, offset: 0 });

    expect(list).toEqual(
      tracks.slice(0, 5).map((track) => deviceTrackExpectation(track.source.meta.filePath)),
    );

    list = await store.list({ limit: 4, offset: 3 });

    expect(list).toEqual(
      tracks.slice(3, 7).map((track) => deviceTrackExpectation(track.source.meta.filePath)),
    );
  });
});
