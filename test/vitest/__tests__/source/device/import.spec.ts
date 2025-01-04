/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { resolve } from 'path';
import type * as nodeFs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { memfs } from 'memfs';
import { deviceTrackExpectation } from '../../expectation/track';
import { createDeviceLibraryFixture } from './fixture';
import { TrackImportError, type ImportProgress } from 'app/src-core/library';
import type { Track } from 'app/src-core/library/track';
import type { Directory } from 'app/src-core/storage/device';

describe('Import from device source', () => {
  let { fs } = memfs() as unknown as { fs: typeof nodeFs };

  beforeEach(() => {
    ({ fs } = memfs() as unknown as { fs: typeof nodeFs });
  });

  it('should import a single track from a device source', async () => {
    const { deviceSource, library } = createDeviceLibraryFixture(fs);

    fs.writeFileSync(resolve('/test.mp3'), '0');

    const job = library.import(deviceSource, [resolve('/test.mp3')]);
    const progress = await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));

    expect(progress.completed).toEqual(true);
    expect(progress.imported).toEqual(1);
    expect(await library.tracks.list({ limit: 1000000, offset: 0 })).toEqual([
      deviceTrackExpectation('/test.mp3', 1),
    ]);
  });

  it('should scan a folder recursively and import all music files', async () => {
    const { trackStore, deviceSource, library } = createDeviceLibraryFixture(fs);

    fs.mkdirSync(resolve('/folder'));
    fs.writeFileSync(resolve('/folder/song1.mp3'), '0');
    fs.writeFileSync(resolve('/folder/song2.mp3'), '0');
    fs.mkdirSync(resolve('/folder/subfolder1'));
    fs.writeFileSync(resolve('/folder/subfolder1/irrelevant.txt'), '0');
    fs.writeFileSync(resolve('/folder/subfolder1/song3.ogg'), '0');
    fs.writeFileSync(resolve('/folder/subfolder1/song4.aac'), '0');
    fs.writeFileSync(resolve('/folder/subfolder1/song5.flac'), '0');
    // empty folder
    fs.mkdirSync(resolve('/folder/subfolder1/sub-subfolder'));

    const job = await library.import(deviceSource, [resolve('/folder')]);
    const importEvents: { tracks: Track[]; progress: ImportProgress }[] = [];

    job.on('import', (tracks, progress) => {
      importEvents.push({ tracks, progress });
    });

    const finalProgress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    // assert events correctness
    for (const [index, event] of importEvents.entries()) {
      expect(event.progress.completed).toEqual(false);

      const previousEvent = importEvents[index - 1];
      const importedSoFar = previousEvent?.progress?.imported || 0;
      expect(event.progress.imported).toEqual(importedSoFar + event.tracks.length);
    }

    expect(finalProgress).toEqual({
      completed: true,
      imported: 5,
      errors: [],
    } as ImportProgress);

    // assert track list correctness
    const expectedTracks = [
      deviceTrackExpectation('/folder/song1.mp3', 1),
      deviceTrackExpectation('/folder/song2.mp3', 1),
      deviceTrackExpectation('/folder/subfolder1/song3.ogg', 1),
      deviceTrackExpectation('/folder/subfolder1/song4.aac', 1),
      deviceTrackExpectation('/folder/subfolder1/song5.flac', 1),
    ];

    const actualTracks = await trackStore.list({ limit: 1000000, offset: 0 });
    expect(actualTracks.length).toEqual(5);
    expect(actualTracks).toEqual(expect.arrayContaining(expectedTracks));
    expect(importEvents.flatMap((event) => event.tracks)).toEqual(expectedTracks);

    const tracksFromEvents = importEvents.reduce((tracks: Track[], event) => {
      return tracks.concat(event.tracks);
    }, []);

    expect(tracksFromEvents.length).toEqual(5);
    expect(tracksFromEvents).toEqual(expect.arrayContaining(expectedTracks));
  });

  it('should accumulate errors from trying to access folders', async () => {
    const { deviceStorage, deviceSource, library } = createDeviceLibraryFixture(fs);

    fs.mkdirSync(resolve('/folder'));
    fs.writeFileSync(resolve('/folder/song1.mp3'), '0');
    fs.writeFileSync(resolve('/folder/song2.mp3'), '0');
    fs.mkdirSync(resolve('/folder/errorFolder'));

    const listFilesOriginal = deviceStorage.listFiles.bind(deviceStorage);
    const spy = vi.spyOn(deviceStorage, 'listFiles');

    spy.mockImplementation(async (dir: Directory) => {
      if (dir.path === resolve('/folder/errorFolder')) {
        throw new Error('Permission denied');
      } else {
        return listFilesOriginal(dir);
      }
    });

    const job = await library.import(deviceSource, [resolve('/folder')]);
    let importErrors: TrackImportError[] = [];

    job.on('importError', (errors) => {
      importErrors = importErrors.concat(errors);
    });

    const finalProgress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    const errorExpectation = new TrackImportError(
      'Permission denied',
      resolve('/folder/errorFolder'),
    );

    expect(importErrors).toEqual([errorExpectation]);

    expect(finalProgress).toEqual({
      completed: true,
      imported: 2,
      errors: [errorExpectation],
    } as ImportProgress);
  });

  it('should record an error if the selected file is not a supported audio file', async () => {
    const { deviceSource, library } = createDeviceLibraryFixture(fs);

    fs.writeFileSync(resolve('/notAsong.txt'), '0');

    const job = await library.import(deviceSource, [resolve('/notAsong.txt')]);

    const finalProgress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    expect(finalProgress).toEqual({
      completed: true,
      errors: [new TrackImportError('Not a supported audio file', resolve('/notAsong.txt'))],
      imported: 0,
    } as ImportProgress);
  });

  it('should handle multiple selected files/folders', async () => {
    const { deviceSource, library } = createDeviceLibraryFixture(fs);

    fs.writeFileSync(resolve('/song1.mp3'), '0');
    fs.writeFileSync(resolve('/song2.mp3'), '0');
    fs.mkdirSync(resolve('/folder'));
    fs.writeFileSync(resolve('/folder/song3.mp3'), '0');
    fs.mkdirSync(resolve('/folder/subfolder'));
    fs.writeFileSync(resolve('/folder/subfolder/song4.mp3'), '0');

    const job = await library.import(
      deviceSource,
      ['/song1.mp3', '/song2.mp3', '/folder'].map((p) => resolve(p)),
    );

    const finalProgress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    expect(finalProgress).toEqual({
      completed: true,
      imported: 4,
      errors: [],
    } as ImportProgress);

    expect(await library.tracks.list({ limit: 1000000, offset: 0 })).toEqual([
      deviceTrackExpectation('/song1.mp3', 1),
      deviceTrackExpectation('/song2.mp3', 1),
      deviceTrackExpectation('/folder/song3.mp3', 1),
      deviceTrackExpectation('/folder/subfolder/song4.mp3', 1),
    ]);
  });

  it('should not import the same file twice', async () => {
    const song1Path = '/folder/song1.mp3';
    const song2Path = '/folder/song2.mp3';
    const { deviceSource, library } = createDeviceLibraryFixture(fs);
    fs.mkdirSync(resolve('/folder'));

    // import song1
    fs.writeFileSync(resolve(song1Path), '0');
    let job = await library.import(deviceSource, [resolve('/folder')]);
    await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));

    // add one more song
    fs.writeFileSync(resolve(song2Path), '0');

    // import again
    job = await library.import(deviceSource, [resolve('/folder')]);
    await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));

    // song1 should not have been imported twice and song2 should be imported
    expect(await library.tracks.list({ limit: 1000000, offset: 0 })).toEqual([
      deviceTrackExpectation('/folder/song1.mp3', 1),
      deviceTrackExpectation('/folder/song2.mp3', 1),
    ]);
  });
});
