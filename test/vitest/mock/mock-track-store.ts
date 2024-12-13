/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track';
import { MockLibraryDatabase } from './mock-library-database';

export class MockTrackStore extends IndexedDbTrackStore {
  constructor() {
    super(new MockLibraryDatabase());
  }
}
