/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'path';
import { unlinkSync } from 'fs';

try {
  if (
    process.platform === 'win32' &&
    nativeTheme.shouldUseDarkColors === true
  ) {
    unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'));
  }
} catch (_) {
  // ignore
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        __dirname,
        process.env.QUASAR_ELECTRON_PRELOAD || '',
      ),
    },
  });

  void mainWindow.loadURL(process.env.APP_URL || '');

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
