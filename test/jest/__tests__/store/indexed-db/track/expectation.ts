import { Track } from 'app/src-core/library';
import { flatMap } from 'lodash';

export const identifiersExpectation = (tracks: Track[]) =>
  flatMap(tracks, (track) =>
    track.identifiers.map((identifier) => ({
      id: expect.any(Number),
      name: identifier.name,
      value: identifier.value,
      trackId: track.id,
    })),
  );
