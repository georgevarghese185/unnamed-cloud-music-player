import type { ImportProgress } from 'app/src-core/library';
import type { Track } from 'app/src-core/library/track';
import { TrackImportError } from 'app/src-core/library/track-importer';
import type { Directory } from 'app/src-core/storage/device';
import { createDeviceLibraryFixture } from './fixture';
import { describe, expect, it, vi } from 'vitest';
import { deviceTrackExpectation } from '../../expectation/track';

describe('Import from device source', () => {
  it('should import a single track from a device source', async () => {
    const { trackStore, deviceStorage, deviceSource, library } = createDeviceLibraryFixture();

    deviceStorage.writeFile('/test.mp3', '0');

    const job = await library.import(deviceSource, ['/test.mp3']);
    const progress = await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));

    expect(progress.completed).toEqual(true);
    expect(progress.imported).toEqual(1);
    expect(await trackStore.getAllTracks()).toEqual([deviceTrackExpectation('/test.mp3')]);
  });

  it('should scan a folder recursively and import all music files', async () => {
    const { trackStore, deviceStorage, deviceSource, library } = createDeviceLibraryFixture();

    deviceStorage.writeFile('/folder/song1.mp3', '0');
    deviceStorage.writeFile('/folder/song2.mp3', '0');
    deviceStorage.writeFile('/folder/subfolder1/irrelevant.txt', '0');
    deviceStorage.writeFile('/folder/subfolder1/song3.ogg', '0');
    deviceStorage.writeFile('/folder/subfolder1/song4.aac', '0');
    // empty folder
    deviceStorage.createDir('/folder/subfolder1/sub-subfolder');

    const job = await library.import(deviceSource, ['/folder']);
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
      imported: 4,
      errors: [],
    } as ImportProgress);

    // assert track list correctness
    const expectedTracks = [
      deviceTrackExpectation('/folder/song1.mp3'),
      deviceTrackExpectation('/folder/song2.mp3'),
      deviceTrackExpectation('/folder/subfolder1/song3.ogg'),
      deviceTrackExpectation('/folder/subfolder1/song4.aac'),
    ];

    const actualTracks = await trackStore.getAllTracks();
    expect(actualTracks.length).toEqual(4);
    expect(actualTracks).toEqual(expect.arrayContaining(expectedTracks));
    expect(importEvents.flatMap((event) => event.tracks)).toEqual(expectedTracks);

    const tracksFromEvents = importEvents.reduce((tracks: Track[], event) => {
      return tracks.concat(event.tracks);
    }, []);

    expect(tracksFromEvents.length).toEqual(4);
    expect(tracksFromEvents).toEqual(expect.arrayContaining(expectedTracks));
  });

  it('should accumulate errors from trying to access folders', async () => {
    const { deviceStorage, deviceSource, library } = createDeviceLibraryFixture();

    deviceStorage.writeFile('/folder/song1.mp3', '0');
    deviceStorage.writeFile('/folder/song2.mp3', '0');
    deviceStorage.createDir('/folder/errorFolder');

    const listFilesOriginal = deviceStorage.listFiles.bind(deviceStorage);
    const spy = vi.spyOn(deviceStorage, 'listFiles');

    spy.mockImplementation(async (dir: Directory) => {
      if (dir.path === '/folder/errorFolder') {
        throw new Error('Permission denied');
      } else {
        return listFilesOriginal(dir);
      }
    });

    const job = await library.import(deviceSource, ['/folder']);
    let importErrors: TrackImportError[] = [];

    job.on('importError', (errors) => {
      importErrors = importErrors.concat(errors);
    });

    const finalProgress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    const errorExpectation = new TrackImportError('Permission denied', '/folder/errorFolder');

    expect(importErrors).toEqual([errorExpectation]);

    expect(finalProgress).toEqual({
      completed: true,
      imported: 2,
      errors: [errorExpectation],
    } as ImportProgress);
  });

  it('should record an error if the selected file is not a supported audio file', async () => {
    const { deviceStorage, deviceSource, library } = createDeviceLibraryFixture();

    deviceStorage.writeFile('/notAsong.txt', '0');

    const job = await library.import(deviceSource, ['/notAsong.txt']);

    const finalProgress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    expect(finalProgress).toEqual({
      completed: true,
      errors: [new TrackImportError('Not a supported audio file', '/notAsong.txt')],
      imported: 0,
    } as ImportProgress);
  });

  it('should handle multiple selected files/folders', async () => {
    const { deviceStorage, deviceSource, library, trackStore } = createDeviceLibraryFixture();

    deviceStorage.writeFile('/song1.mp3', '0');
    deviceStorage.writeFile('/song2.mp3', '0');
    deviceStorage.writeFile('/folder/song3.mp3', '0');
    deviceStorage.writeFile('/folder/subfolder/song4.mp3', '0');

    const job = await library.import(deviceSource, ['/song1.mp3', '/song2.mp3', '/folder']);

    const finalProgress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    expect(finalProgress).toEqual({
      completed: true,
      imported: 4,
      errors: [],
    } as ImportProgress);

    expect(await trackStore.getAllTracks()).toEqual([
      deviceTrackExpectation('/song1.mp3'),
      deviceTrackExpectation('/song2.mp3'),
      deviceTrackExpectation('/folder/song3.mp3'),
      deviceTrackExpectation('/folder/subfolder/song4.mp3'),
    ]);
  });

  it('should not import the same file twice', async () => {
    const song1Path = '/folder/song1.mp3';
    const song2Path = '/folder/song2.mp3';
    const { deviceStorage, deviceSource, library, trackStore } = createDeviceLibraryFixture();

    // import song1
    deviceStorage.writeFile(song1Path, '0');
    let job = await library.import(deviceSource, ['/folder']);
    await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));

    // add one more song
    deviceStorage.writeFile(song2Path, '0');

    // import again
    job = await library.import(deviceSource, ['/folder']);
    await new Promise<ImportProgress>((resolve) => job.on('complete', resolve));

    // song1 should not have been imported twice and song2 should be imported
    expect(await trackStore.getAllTracks()).toEqual([
      deviceTrackExpectation('/folder/song1.mp3'),
      deviceTrackExpectation('/folder/song2.mp3'),
    ]);
  });

  /**
   *
   * - list imported songs
   *  - list songs
   */
});
