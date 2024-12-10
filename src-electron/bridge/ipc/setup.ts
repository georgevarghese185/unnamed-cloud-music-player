import type { BaseWindow } from 'electron';
import { setupFileIpc } from './file';

export function setupIpcForBridgeApi(window: BaseWindow) {
  setupFileIpc(window);
}
