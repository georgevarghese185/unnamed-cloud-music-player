/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { flatMap, isEqual } from 'lodash';

export type Identifier = {
  name: string;
  value: string;
};

export type Track<K extends string = string, M = unknown> = {
  id: number;
  name: string;
  mime: string;
  identifiers: Identifier[];
  source: {
    name: K;
    meta: M;
  };
};

/**
 * Returns an array of Identifiers extracted from the given track(s)
 *
 * @param tracks 1 or More tracks
 * @returns Array of Track identifiers
 */
export const getIdentifiers = (...tracks: Track[]): Identifier[] => {
  return flatMap(tracks, (track) => track.identifiers);
};

/**
 * Compare 2 tracks based on their identifiers. If the 2 tracks share at least 1 identifier in common,
 * they are the same track.
 *
 * 2 `Identifier`s are considered the same only if their `name` and `value` match
 *
 * @returns `true` if the 2 tracks are the same, `false` otherwise
 */
export const eqIdentifiers = (track1: Track, track2: Track): boolean => {
  return track1.identifiers.some((id1) => track2.identifiers.find((id2) => isEqual(id1, id2)));
};
