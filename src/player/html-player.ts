/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Player } from 'app/src-core/player';
import mime from 'mime';

const AUDIO_ELEMENT_ID = 'music-player';

export default class HtmlPlayer implements Player {
  private audio: HTMLAudioElement;

  constructor() {
    let audioElement: HTMLAudioElement | null = document.querySelector(`#${AUDIO_ELEMENT_ID}`);

    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = AUDIO_ELEMENT_ID;
      document.body.appendChild(audioElement);
    }

    this.audio = audioElement;
  }

  supports(fileExtension: string): boolean {
    const mimeType = mime.getType(fileExtension);

    if (!mimeType) {
      return false;
    }

    return !!this.audio.canPlayType(mimeType);
  }

  play(): void {
    throw new Error('Method not implemented.');
  }
}
