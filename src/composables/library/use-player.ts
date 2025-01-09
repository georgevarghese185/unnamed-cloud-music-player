/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { onMounted, onUnmounted, ref } from 'vue';
import { Notify } from 'quasar';
import { injectLibrary } from './use-library-provider';
import type { PlaybackError } from 'app/src-core/audio-player';

export default function () {
  const library = injectLibrary();
  const currentlyPlaying = ref(library.value.player.currentlyPlaying);
  const playerState = ref(library.value.player.state);

  function onPlayerStateChange() {
    currentlyPlaying.value = library.value.player.currentlyPlaying;
    playerState.value = library.value.player.state;
  }

  function onPlayerError(e: PlaybackError) {
    Notify.create({
      type: 'negative',
      message: e.message,
    });
  }

  function onTrackMetadataUpdated() {
    currentlyPlaying.value = library.value.player.currentlyPlaying;
  }

  onMounted(() => {
    library.value.player.on('play', onPlayerStateChange);
    library.value.player.on('pause', onPlayerStateChange);
    library.value.player.on('error', onPlayerError);
    library.value.player.on('metadataUpdate', onTrackMetadataUpdated);
  });

  onUnmounted(() => {
    library.value.player.off('play', onPlayerStateChange);
    library.value.player.off('pause', onPlayerStateChange);
    library.value.player.off('error', onPlayerError);
    library.value.player.off('metadataUpdate', onTrackMetadataUpdated);
  });

  return {
    play: library.value.player.play.bind(library.value.player),
    pause: library.value.player.pause.bind(library.value.player),
    resume: library.value.player.resume.bind(library.value.player),
    seek: library.value.player.seek.bind(library.value.player),
    state: playerState,
    currentlyPlaying,
  };
}
