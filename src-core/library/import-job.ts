/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import EventEmitter from 'events';
import type { TrackImportError } from './track-importer';
import type { Track } from './track';

export interface ImportJob {
  getProgress(): ImportProgress;
  on<Event extends keyof ImportJobEvents>(event: Event, handler: ImportJobEvents[Event]): void;
  off<Event extends keyof ImportJobEvents>(event: Event, handler: ImportJobEvents[Event]): void;
}

export type ImportProgress = {
  completed: boolean;
  imported: number;
  errors: TrackImportError[];
};

export type ImportJobEvents = {
  complete: (progress: ImportProgress) => void;
  import: (tracks: Track[], progress: ImportProgress) => void;
  importError: (errors: TrackImportError[]) => void;
};

export class ImportJobImpl extends EventEmitter implements ImportJob {
  private progress: ImportProgress = {
    completed: false,
    imported: 0,
    errors: [],
  };

  getProgress() {
    return { ...this.progress };
  }

  onComplete() {
    this.progress.completed = true;
    this.emit('complete', this.getProgress());
  }

  onImport(tracks: Track[]) {
    this.progress.imported += tracks.length;
    this.emit('import', tracks, this.getProgress());
  }

  onImportError(errors: TrackImportError[]) {
    this.progress.errors = [...this.progress.errors, ...errors];
    this.emit('importError', errors);
  }
}
