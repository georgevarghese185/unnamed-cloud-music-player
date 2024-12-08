import type { Track } from 'app/src-core/library';
import { flatMap } from 'lodash';
import { expect } from 'vitest';

export const identifiersExpectation = (tracks: Track[]) =>
  flatMap(tracks, (track) =>
    track.identifiers.map((identifier) => ({
      id: expect.any(Number),
      name: identifier.name,
      value: identifier.value,
      trackId: track.id,
    })),
  );
