/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { Notify } from 'quasar';
import useTracks from './use-tracks';
import type { Track } from 'app/src-core/library';
import { getErrorMessage } from 'app/src-core/error/util';

export default function useTrackInfo(track: Ref<Track | null | undefined>) {
  const { getArtwork } = useTracks();

  const title = computed(() => track.value?.metadata?.title || track.value?.file.name);
  const artist = computed(() => track.value?.metadata?.artist || 'Unknown Artist');
  const album = computed(() => track.value?.metadata?.album || 'Unknown Album');
  const artworkUrl = ref<string | undefined>(undefined);

  async function updateArtworkUrl() {
    try {
      if (!track.value) {
        return;
      }

      const artworkData = await getArtwork(track.value);

      if (!artworkData) {
        return;
      }

      artworkUrl.value = URL.createObjectURL(new Blob([artworkData]));
    } catch (e) {
      Notify.create({ type: 'negative', message: getErrorMessage(e) });
    }
  }

  function revokeArtworkUrl() {
    if (artworkUrl.value) {
      URL.revokeObjectURL(artworkUrl.value);
      artworkUrl.value = undefined;
    }
  }

  watch(track, () => {
    revokeArtworkUrl();
    void updateArtworkUrl();
  });

  onMounted(() => {
    void updateArtworkUrl();
  });

  onUnmounted(() => {
    revokeArtworkUrl();
  });

  return {
    title,
    artist,
    album,
    artworkUrl,
  };
}
