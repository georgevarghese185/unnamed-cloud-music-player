/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

describe('Landing', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should show library', () => {
    cy.dataCy('nav-page-title').contains('Library').should('exist');
  });
});

export {};
