import EventEmitter from 'events';
import { differenceWith } from 'lodash';
import type { Player } from '../player';
import type { TrackStore } from './store/track';
import type { Track } from './track';
import { eqIdentifiers, getIdentifiers } from './track';
import type { TrackImporter } from './track-importer';
import { TrackImportError } from './track-importer';

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

class ImportJobImpl extends EventEmitter implements ImportJob {
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

const split = (tracksAndErrors: (Track | TrackImportError)[]): [Track[], TrackImportError[]] => {
  const tracks: Track[] = [];
  const errors: TrackImportError[] = [];

  tracksAndErrors.forEach((trackOrError) => {
    if (trackOrError instanceof TrackImportError) {
      errors.push(trackOrError);
    } else {
      tracks.push(trackOrError);
    }
  });

  return [tracks, errors];
};

export class Library {
  readonly player: Player;

  constructor(private options: LibraryOptions) {
    this.player = options.player;
  }

  import(importer: TrackImporter): ImportJob {
    const job = new ImportJobImpl();
    setTimeout(() => this.startImport(importer, job));
    return job;
  }

  private async startImport(importer: TrackImporter, job: ImportJobImpl) {
    let imports: (Track | TrackImportError)[] | null;
    const trackStore = this.options.store.tracks;

    while ((imports = await importer.next())) {
      const [tracks, errors] = split(imports);

      if (tracks.length) {
        const newTracks = await this.findNewTracks(trackStore, tracks);

        if (newTracks.length) {
          await trackStore.add(newTracks);
          job.onImport(newTracks);
        }
      }

      if (errors.length) {
        job.onImportError(errors);
      }
    }

    job.onComplete();
  }

  /** Removes any tracks that have already been imported previously */
  private async findNewTracks(trackStore: TrackStore, tracks: Track[]): Promise<Track[]> {
    const existingTracks = await trackStore.findByIdentifiers(getIdentifiers(...tracks));
    const newTracks = differenceWith(tracks, existingTracks, eqIdentifiers);

    return newTracks;
  }
}

export type LibraryOptions = {
  player: Player;
  store: {
    tracks: TrackStore;
  };
};
