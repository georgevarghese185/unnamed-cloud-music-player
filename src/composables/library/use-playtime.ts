/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { injectLibrary } from './use-library-provider';

export default function () {
  const library = injectLibrary();
  const currentTime = ref(0);
  const currentTimeString = computed(() => {
    const minutesString = Math.floor(currentTime.value / 60).toString();
    const seconds = Math.floor(currentTime.value % 60);
    const secondsString = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutesString}:${secondsString}`;
  });
  let timer = 0;

  onMounted(() => {
    timer = window.setInterval(() => {
      currentTime.value = library.value.player.currentTime;
    }, 500);
  });

  onUnmounted(() => {
    clearTimeout(timer);
  });

  return { currentTimeString, currentTime };
}
