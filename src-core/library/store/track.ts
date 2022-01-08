import { Identifier, Track } from '../track';

export type ListOptions = {
  limit: number;
  offset: number;
};

export interface TrackStore {
  add(track: Track[]): Promise<void>;
  findByIdentifiers(identifiers: Identifier[]): Promise<Track[]>;
  list(options: ListOptions): Promise<Track[]>;
}
