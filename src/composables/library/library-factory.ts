import { Library } from 'app/src-core/library';
import { LibraryDatabase } from 'src/library/store/indexed-db/db';
import { IndexedDbTrackStore } from 'src/library/store/indexed-db/track';
import HtmlPlayer from 'src/player/html-player';

export default function createLibrary() {
  return new Library({
    player: new HtmlPlayer(),
    store: {
      tracks: new IndexedDbTrackStore(new LibraryDatabase()),
    },
  });
}
