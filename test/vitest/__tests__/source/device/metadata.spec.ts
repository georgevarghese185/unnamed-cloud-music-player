/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { resolve } from 'path';
import * as fs from 'fs';
import { describe, expect, it } from 'vitest';
import { deviceTrackExpectation } from '../../expectation/track';
import { createDeviceLibraryFixture } from './fixture';
import type { ImportProgress, Metadata } from 'app/src-core/library';

describe('Music Metadata', () => {
  it('should extract metadata from imported songs', async () => {
    const { deviceSource, library } = createDeviceLibraryFixture(fs);

    const importJob = library.import(deviceSource, [resolve('test/fixtures/music')]);
    await new Promise<ImportProgress>((resolve) => importJob.on('complete', resolve));
    const updateJob = library.updateAllMetadata();
    await new Promise<void>((resolve) => updateJob.on('complete', resolve));
    const tracks = await library.tracks.list({ limit: 10000, offset: 0 });

    const songsFixture = [
      {
        path: 'test/fixtures/music/Adeste Fideles Waltz.mp3',
        title: 'Adeste Fideles Waltz',
        album: 'The Waltzes',
        artist: 'Kevin MacLeod',
        duration: 140,
      },
      {
        path: 'test/fixtures/music/Brain Dance.mp3',
        title: 'Brain Dance',
        album: 'Brain Dance',
        artist: 'Kevin MacLeod',
        duration: 215,
      },
      {
        path: 'test/fixtures/music/Goblin_Tinker_Soldier_Spy.mp3',
        title: 'Goblin_Tinker_Soldier_Spy',
        artist: 'Kevin MacLeod',
        duration: 136,
      },
      {
        path: 'test/fixtures/music/Kevin MacLeod - I Got a Stick Arr Bryan Teoh.mp3',
        title: 'I Got a Stick Arr Bryan Teoh',
        artist: 'Kevin MacLeod, Bryan Teoh',
        duration: 31,
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
  });
});