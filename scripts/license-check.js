/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import fs from 'fs';
import { glob } from 'glob';

const config = JSON.parse(fs.readFileSync('scripts/license-config.json'));

const MPL_LICENSE_PATTERN = `You can obtain one at https://mozilla.org/MPL/2.0/`;
const PUBLIC_DOMAIN_PATTERN = `Any copyright is dedicated to the Public Domain.`;

const hasValidLicenseHeader = (fileContent) =>
  fileContent.includes(MPL_LICENSE_PATTERN) || fileContent.includes(PUBLIC_DOMAIN_PATTERN);

const options = {
  ignore: config.exclude,
  nodir: true,
};

const files = await glob(config.patterns, options);

const filesWithoutLicense = [];

files.forEach((file) => {
  const fileContent = fs.readFileSync(file, 'utf8');
  if (fileContent && !hasValidLicenseHeader(fileContent)) {
    filesWithoutLicense.push(file);
  }
});

filesWithoutLicense.sort();

if (filesWithoutLicense.length > 0) {
  console.error('The following files are missing a valid license header:');
  filesWithoutLicense.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
} else {
  console.info('All files have a valid license header.');
}
