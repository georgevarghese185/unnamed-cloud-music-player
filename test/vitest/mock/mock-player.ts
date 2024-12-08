import type { Player } from 'app/src-core/player';

export class MockPlayer implements Player {
  supports(ext: string) {
    return ['.mp3', '.ogg', '.aac'].includes(ext);
  }
}
