/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { onMounted, onUnmounted, ref } from 'vue';
import { injectLibrary } from './use-library-provider';

export default function () {
  const library = injectLibrary();
  const currentTime = ref('0:00');
  let timer = 0;

  onMounted(() => {
    timer = window.setInterval(() => {
      const time = library.value.player.currentTime;
      const minutesString = Math.floor(time / 60).toString();
      const seconds = Math.floor(time % 60);
      const secondsString = seconds < 10 ? `0${seconds}` : seconds;

      currentTime.value = `${minutesString}:${secondsString}`;
    }, 500);
  });

  onUnmounted(() => {
    clearTimeout(timer);
  });

  return currentTime;
}
