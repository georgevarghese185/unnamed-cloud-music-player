import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { LibraryDatabase } from 'src/library/store/indexed-db/db'

export class MockLibraryDatabase extends LibraryDatabase {
  constructor() {
    super({ indexedDB: new IDBFactory(), IDBKeyRange })
  }
}
