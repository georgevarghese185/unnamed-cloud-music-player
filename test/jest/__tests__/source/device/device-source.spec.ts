import { ImportProgress } from 'app/src-core/library';
import { Track } from 'app/src-core/library/track';
import { TrackImportError } from 'app/src-core/library/track-importer';
import { trackExpectation } from './expectation';
import { createDeviceLibraryFixture } from './fixture';

describe('Device source', () => {
  it('should import a single track from a device source', async () => {
    const { trackStore, deviceStorage, deviceSource, library } =
      createDeviceLibraryFixture();

    deviceStorage.fs.writeFileSync('/test.mp3', '0');

    const importer = await deviceSource.import('/test.mp3');
    const job = await library.import(importer);
    const progress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    expect(progress.completed).toEqual(true);
    expect(progress.imported).toEqual(1);
    expect(trackStore.tracks).toEqual([trackExpectation('/test.mp3')]);
  });

  it('should scan a folder recursively and import all music files', async () => {
    const { trackStore, deviceStorage, deviceSource, library } =
      createDeviceLibraryFixture();

    deviceStorage.fs.mkdirSync('/folder');
    deviceStorage.fs.writeFileSync('/folder/song1.mp3', '0');
    deviceStorage.fs.writeFileSync('/folder/song2.mp3', '0');
    deviceStorage.fs.mkdirSync('/folder/subfolder1');
    deviceStorage.fs.writeFileSync('/folder/subfolder1/irrelevant.txt', '0');
    deviceStorage.fs.writeFileSync('/folder/subfolder1/song3.ogg', '0');
    deviceStorage.fs.writeFileSync('/folder/subfolder1/song4.aac', '0');
    deviceStorage.fs.mkdirSync('/folder/subfolder1/sub-subfolder');

    const importer = await deviceSource.import('/folder');
    const job = await library.import(importer);
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
      expect(event.progress.imported).toEqual(
        importedSoFar + event.tracks.length,
      );
    }

    expect(finalProgress).toEqual({
      completed: true,
      imported: 4,
      errors: [],
    } as ImportProgress);

    // assert track list correctness
    const expectedTracks = [
      trackExpectation('/folder/song1.mp3'),
      trackExpectation('/folder/song2.mp3'),
      trackExpectation('/folder/subfolder1/song3.ogg'),
      trackExpectation('/folder/subfolder1/song4.aac'),
    ];

    expect(trackStore.tracks.length).toEqual(4);
    expect(trackStore.tracks).toEqual(expect.arrayContaining(expectedTracks));

    const tracksFromEvents = importEvents.reduce((tracks: Track[], event) => {
      return tracks.concat(event.tracks);
    }, []);

    expect(tracksFromEvents.length).toEqual(4);
    expect(tracksFromEvents).toEqual(expect.arrayContaining(expectedTracks));
  });

  it('should accumulate errors from trying to access folders', async () => {
    const { deviceStorage, deviceSource, library } =
      createDeviceLibraryFixture();

    deviceStorage.fs.mkdirSync('/folder');
    deviceStorage.fs.writeFileSync('/folder/song1.mp3', '0');
    deviceStorage.fs.writeFileSync('/folder/song2.mp3', '0');
    deviceStorage.fs.mkdirSync('/folder/errorFolder');

    const listFilesOriginal = deviceStorage.listFiles.bind(deviceStorage);
    const spy = jest.spyOn(deviceStorage, 'listFiles');

    spy.mockImplementation(async (path: string) => {
      if (path === '/folder/errorFolder') {
        throw new Error('Permission denied');
      } else {
        return listFilesOriginal(path);
      }
    });

    const importer = await deviceSource.import('/folder');
    const job = await library.import(importer);
    let importErrors: TrackImportError[] = [];

    job.on('importError', (errors) => {
      importErrors = importErrors.concat(errors);
    });

    const finalProgress = await new Promise<ImportProgress>((resolve) =>
      job.on('complete', resolve),
    );

    const errorExpectation = new TrackImportError(
      'Permission denied',
      '/folder/errorFolder',
    );

    expect(importErrors).toEqual([errorExpectation]);

    expect(finalProgress).toEqual({
      completed: true,
      imported: 2,
      errors: [errorExpectation],
    } as ImportProgress);
  });
});
