// eslint-disable-next-line @typescript-eslint/no-var-requires
const FDBFactory = require('fake-indexeddb/lib/FDBFactory');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
import { LibraryDatabase } from 'src/library/store/indexed-db/db';

export class MockLibraryDatabase extends LibraryDatabase {
  constructor() {
    super({ indexedDB: new FDBFactory(), IDBKeyRange: FDBKeyRange });
  }
}
