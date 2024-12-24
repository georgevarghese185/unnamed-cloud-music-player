/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Player } from 'app/src-core/player';
import mime from 'mime';

export default class HtmlPlayer implements Player {
  private audio: HTMLAudioElement;

  constructor() {
    this.audio = document.createElement('audio');
  }

  supports(fileExtension: string): boolean {
    const mimeType = mime.getType(fileExtension);

    if (!mimeType) {
      return false;
    }

    return !!this.audio.canPlayType(mimeType);
  }
}
