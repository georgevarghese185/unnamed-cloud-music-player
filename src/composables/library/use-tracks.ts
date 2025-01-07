/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { inject, shallowRef } from 'vue';
import { injectLibrary, tracksInjectionKey } from './use-library-provider';

export default function () {
  const library = injectLibrary();

  const { tracks, setTracks } = inject(tracksInjectionKey, {
    tracks: shallowRef([]),
    setTracks: () => {},
  });

  async function findTracks() {
    setTracks(await library.value.tracks.list({ limit: 1000000, offset: 0 }));
  }

  return {
    list: tracks,
    find: findTracks,
    getArtwork: library.value.tracks.getArtwork.bind(library.value.tracks),
  };
}
