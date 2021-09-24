import { Track } from 'app/src-core/library';
import { TrackStore } from 'app/src-core/library/store/track';

export class MockTrackStore implements TrackStore {
  tracks: Track[] = [];

  async add(tracks: Track[]) {
    this.tracks = this.tracks.concat(tracks);
  }
}
