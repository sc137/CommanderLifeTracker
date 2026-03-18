import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { state } from './state.js';
import { createEvent } from './dom-fixture.js';
import { ensureGlobals, resetState, setupAppDOM } from './fixtures.js';

describe('App Startup', () => {
  beforeEach(() => {
    ensureGlobals();
    const doc = setupAppDOM();
    global.document = doc;
    resetState();
    global.localStorage.clear();
  });

  it('should add the default player on startup when no game is in progress', async () => {
    global.localStorage.setItem('cmdrtrackr_default_player', 'Alice');

    await import(new URL(`./app.js?test=${Date.now()}`, import.meta.url));
    document.dispatchEvent(createEvent('DOMContentLoaded', { bubbles: false }));

    assert.deepStrictEqual(state.players, ['Alice']);
    assert.deepStrictEqual(state.playerState, {
      Alice: { life: 40, poison: 0, dead: false },
    });
    assert.strictEqual(document.getElementById('player-tiles').children.length, 1);
  });
});
