/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { resolve } from 'path';
import * as fs from 'fs';
import { describe, expect, it, vi } from 'vitest';
import { sortBy } from 'lodash';
import { fromStream } from 'strtok3';
import { parseFromTokenizer } from 'music-metadata';
import { deviceTrackExpectation } from '../../expectation/track';
import { hashUint8Array } from '../../util/hash';
import { createDeviceLibraryFixture } from './fixture';
import { type Track, globalEvents, type ImportProgress, type Metadata } from 'app/src-core/library';

describe('Music Metadata', () => {
  it('should extract metadata from imported songs', async () => {
    const { deviceSource, library, trackStore } = createDeviceLibraryFixture(fs);

    const importJob = library.import(deviceSource, [resolve('test/fixtures/music')]);
    await new Promise<ImportProgress>((resolve) => importJob.on('complete', resolve));
    let tracks = await library.tracks.list({ limit: 10000, offset: 0 });

    const onIndividualTrackUpdate = vi.fn((_track: Track) => {});
    const onTrackUpdate = vi.fn((_track: Track) => {});
    tracks.forEach((track) =>
      globalEvents.on(`trackMetadataUpdate:${track.id}`, onIndividualTrackUpdate),
    );

    const updateJob = library.updateAllMetadata();
    updateJob.on('update', onTrackUpdate);
    await new Promise<void>((resolve) => updateJob.on('complete', resolve));

    tracks = await library.tracks.list({ limit: 10000, offset: 0 });

    const songsFixture = [
      {
        path: 'test/fixtures/music/Adeste Fideles Waltz.mp3',
        title: 'Adeste Fideles Waltz',
        album: 'The Waltzes',
        artist: 'Kevin MacLeod',
        duration: expect.closeTo(140, 0),
      },
      {
        path: 'test/fixtures/music/Brain Dance.mp3',
        title: 'Brain Dance',
        album: 'Brain Dance',
        artist: 'Kevin MacLeod',
        duration: expect.closeTo(215, 0),
      },
      {
        path: 'test/fixtures/music/Goblin_Tinker_Soldier_Spy.mp3',
        title: 'Goblin_Tinker_Soldier_Spy',
        artist: 'Kevin MacLeod',
        duration: expect.closeTo(136, 0),
      },
      {
        path: 'test/fixtures/music/Kevin MacLeod - I Got a Stick Arr Bryan Teoh.mp3',
        title: 'I Got a Stick Arr Bryan Teoh',
        artist: 'Kevin MacLeod, Bryan Teoh',
        duration: expect.closeTo(31, 0),
      },
      {
        path: 'test/fixtures/music/Voxel Revolution.mp3',
        title: 'Voxel Revolution',
        artist: 'Kevin MacLeod',
        album: 'Project 80s',
        duration: expect.closeTo(130, 0),
      },
    ];

    expect(tracks).toEqual(
      songsFixture.map(({ path, artist, duration, title, album }) =>
        deviceTrackExpectation(path, fs.statSync(resolve(path)).size, {
          artist,
          duration,
          title,
          album,
        } as Metadata),
      ),
    );

    expect(sortBy(onIndividualTrackUpdate.mock.calls.flat(), 'id')).toEqual(sortBy(tracks, 'id'));
    expect(sortBy(onTrackUpdate.mock.calls.flat(), 'id')).toEqual(sortBy(tracks, 'id'));

    const artwork = await Promise.all(tracks.map((t) => trackStore.getArtwork(t)));

    const actualArtwork = await Promise.all(
      songsFixture.map(async ({ path }) => {
        const tokenizer = await fromStream(fs.createReadStream(resolve(path)), {
          fileInfo: {
            mimeType: 'audio/mpeg',
            path,
            size: fs.statSync(path).size,
          },
        });
        const meta = await parseFromTokenizer(tokenizer, { skipPostHeaders: true });
        void tokenizer.abort();
        const image = meta.common.picture?.[0]?.data;
        return image ? image : null;
      }),
    );

    const hashArtwork = (art: Uint8Array | null) => {
      return art ? hashUint8Array(art) : null;
    };

    expect(artwork.map(hashArtwork)).toEqual(actualArtwork.map(hashArtwork));
  });

  it('should not extract metadata from songs that have already been extracted', async () => {
    const { deviceSource, library, trackStore } = createDeviceLibraryFixture(fs);

    // import and extract some songs
    let importJob = library.import(deviceSource, [
      resolve('test/fixtures/music/Adeste Fideles Waltz.mp3'),
      resolve('test/fixtures/music/Brain Dance.mp3'),
    ]);
    await new Promise<ImportProgress>((resolve) => importJob.on('complete', resolve));
    let updateJob = library.updateAllMetadata();
    await new Promise<void>((resolve) => updateJob.on('complete', resolve));

    // import remaining songs
    importJob = library.import(deviceSource, [
      resolve('test/fixtures/music/Goblin_Tinker_Soldier_Spy.mp3'),
      resolve('test/fixtures/music/Kevin MacLeod - I Got a Stick Arr Bryan Teoh.mp3'),
    ]);
    await new Promise<ImportProgress>((resolve) => importJob.on('complete', resolve));

    const updateTracksSpy = vi.spyOn(trackStore, 'update');

    updateJob = library.updateAllMetadata();
    await new Promise<void>((resolve) => updateJob.on('complete', resolve));

    // only the new songs should have been updated
    const updatedTracks = updateTracksSpy.mock.calls.flatMap(([tracks]) => tracks);
    expect(sortBy(updatedTracks, (t) => t.file.name)).toEqual(
      [
        {
          path: 'test/fixtures/music/Goblin_Tinker_Soldier_Spy.mp3',
          title: 'Goblin_Tinker_Soldier_Spy',
          artist: 'Kevin MacLeod',
          duration: expect.closeTo(136, 0),
        },
        {
          path: 'test/fixtures/music/Kevin MacLeod - I Got a Stick Arr Bryan Teoh.mp3',
          title: 'I Got a Stick Arr Bryan Teoh',
          artist: 'Kevin MacLeod, Bryan Teoh',
          duration: expect.closeTo(31, 0),
        },
      ].map(({ path, artist, duration, title }) =>
        deviceTrackExpectation(path, fs.statSync(resolve(path)).size, {
          artist,
          duration,
          title,
        } as Metadata),
      ),
    );
  });

  it('should re-do metadata extraction for a tracks who have metadata but missing artwork', async () => {
    const { deviceSource, library, trackStore } = createDeviceLibraryFixture(fs);
    const paths = [
      resolve('test/fixtures/music/Adeste Fideles Waltz.mp3'), // has artwork
      resolve('test/fixtures/music/Voxel Revolution.mp3'), // doesn't have any artwork
    ];

    const importJob = library.import(deviceSource, paths);
    // import and fetch metadata
    await new Promise<ImportProgress>((resolve) => importJob.on('complete', resolve));
    let updateJob = library.updateAllMetadata();
    await new Promise<void>((resolve) => updateJob.on('complete', resolve));

    // purposely delete artwork
    const tracks = await trackStore.list({ offset: 0, limit: 1000 });
    await trackStore.deleteArtwork(tracks.map((t) => t.id));

    // re-do metadata fetch
    updateJob = library.updateAllMetadata();
    await new Promise<void>((resolve) => updateJob.on('complete', resolve));

    const updatedTracks = await trackStore.list({ offset: 0, limit: 1000 });
    expect(sortBy(updatedTracks, (t) => t.file.name)).toEqual(
      [
        {
          path: 'test/fixtures/music/Adeste Fideles Waltz.mp3',
          title: 'Adeste Fideles Waltz',
          album: 'The Waltzes',
          artist: 'Kevin MacLeod',
          duration: expect.closeTo(140, 0),
        },
        {
          path: 'test/fixtures/music/Voxel Revolution.mp3',
          title: 'Voxel Revolution',
          artist: 'Kevin MacLeod',
          album: 'Project 80s',
          duration: expect.closeTo(130, 0),
        },
      ].map(({ path, artist, duration, title, album }) =>
        deviceTrackExpectation(path, fs.statSync(resolve(path)).size, {
          artist,
          duration,
          title,
          album,
        } as Metadata),
      ),
    );

    const artwork = await Promise.all(updatedTracks.map((t) => trackStore.getArtwork(t)));

    const actualArtwork = await Promise.all(
      paths.map(async (path) => {
        const tokenizer = await fromStream(fs.createReadStream(resolve(path)), {
          fileInfo: {
            mimeType: 'audio/mpeg',
            path,
            size: fs.statSync(path).size,
          },
        });
        const meta = await parseFromTokenizer(tokenizer, { skipPostHeaders: true });
        void tokenizer.abort();
        const image = meta.common.picture?.[0]?.data;
        return image ? image : null;
      }),
    );

    const hashArtwork = (art: Uint8Array | null) => {
      return art ? hashUint8Array(art) : null;
    };

    expect(artwork.map(hashArtwork)).toEqual(actualArtwork.map(hashArtwork));
  });

  it('should cancel job', async () => {
    const { deviceSource, library } = createDeviceLibraryFixture(fs);

    // import and extract some songs
    const importJob = library.import(deviceSource, [resolve('test/fixtures/music')]);
    await new Promise<ImportProgress>((resolve) => importJob.on('complete', resolve));

    const updateJob = library.updateAllMetadata();
    await updateJob.cancel();

    // none of the tracks should have been updated
    const tracksWithoutMeta = await library.tracks.findTracksWithoutMetadata({
      limit: 1000,
      offset: 0,
    });
    expect(tracksWithoutMeta).toHaveLength(5);
  });
});
