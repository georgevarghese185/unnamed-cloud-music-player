/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

describe('Landing', () => {
  before(() => {
    cy.window().then(async (win) => {
      const databases = await win.indexedDB.databases();
      databases.forEach((db) => {
        if (db.name) {
          win.indexedDB.deleteDatabase(db.name);
        }
      });
    });
  });

  beforeEach(() => {
    cy.visit('/');
  });

  it('should not contain any songs', () => {
    cy.dataCy('songs-page').dataCy('song-item').should('not.exist');
  });
});

export {};
