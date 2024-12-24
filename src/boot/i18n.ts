/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';
import messages from 'src/i18n';

export default defineBoot(({ app }) => {
  const i18n = createI18n({
    locale: 'en-US',
    legacy: false,
    messages,
  });

  app.use(i18n);
});
