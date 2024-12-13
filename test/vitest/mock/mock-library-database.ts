/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { LibraryDatabase } from 'src/library/store/indexed-db/db';

export class MockLibraryDatabase extends LibraryDatabase {
  constructor() {
    super({ indexedDB: new IDBFactory(), IDBKeyRange });
  }
}
