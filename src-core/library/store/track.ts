import { Track } from '../track';

export interface TrackStore {
  add(track: Track[]): Promise<void>;
}
