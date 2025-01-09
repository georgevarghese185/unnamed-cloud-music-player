/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { MockLibraryDatabase } from './mock-library-database';
import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track';

export class MockTrackStore extends IndexedDbTrackStore {
  constructor() {
    super(new MockLibraryDatabase());
  }

  async deleteArtwork(trackIds: number[]) {
    await this.db.artwork.where('trackId').anyOf(trackIds).delete();
    await this.db.tracks
      .where('id')
      .anyOf(trackIds)
      .modify((track) => {
        track.hasMetadata = 0;
      });
  }
}
