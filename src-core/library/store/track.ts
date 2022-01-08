import { Identifier, Track } from '../track';

export interface TrackStore {
  add(track: Track[]): Promise<void>;
  findByIdentifiers(identifiers: Identifier[]): Promise<Track[]>;
}
