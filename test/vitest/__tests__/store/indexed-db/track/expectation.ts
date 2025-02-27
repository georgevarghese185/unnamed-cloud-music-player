/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { flatMap } from 'lodash';
import { expect } from 'vitest';
import type { Track } from 'app/src-core/library';

export const identifiersExpectation = (tracks: Track[]) =>
  flatMap(tracks, (track) =>
    track.identifiers.map((identifier) => ({
      id: expect.any(Number),
      name: identifier.name,
      value: identifier.value,
      trackId: track.id,
    })),
  );
