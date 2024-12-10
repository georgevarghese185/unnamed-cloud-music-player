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
