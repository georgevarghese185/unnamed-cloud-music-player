/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/library/songs',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'library',
        children: [
          {
            path: 'songs',
            component: () => import('src/pages/SongsPage.vue'),
          },
        ],
        component: () => import('src/pages/LibrayPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    redirect: '/library/songs',
  },
];

export default routes;
