/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';

export function hashFile(filePath: string) {
  const hash = createHash('sha256');
  const data = readFileSync(filePath);
  hash.update(data);

  return hash.digest('hex');
}

export function hashUint8Array(uint8Array: Uint8Array[]) {
  const hash = createHash('sha256');
  uint8Array.map((chunk) => hash.update(chunk));
  return hash.digest('hex');
}

export function hashBuffer(buffer: Buffer) {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}
