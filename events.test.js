import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { setTimeout as delay } from 'node:timers/promises';
import { state, getDefaultPlayer, getGameLog, getSavedPlayers } from './state.js';
import { initUI, updateCurrentGamePlayersUI } from './ui.js';
import { initEventListeners, changeCommanderDamage } from './events.js';
import { ensureGlobals, resetState, setupAppDOM } from './fixtures.js';

function setupEventTestDOM() {
  ensureGlobals();
  const doc = setupAppDOM();
  global.document = doc;
  resetState();
  global.localStorage.clear();
  initUI();
  initEventListeners();
}

describe('Event Flows', () => {
  beforeEach(() => {
    setupEventTestDOM();
  });

  it('should save a new player and add them to the current game', () => {
    document.getElementById('new-player-input').value = 'Alice';

    document.getElementById('save-new-player-btn').click();

    assert.deepStrictEqual(getSavedPlayers(), ['Alice']);
    assert.strictEqual(getDefaultPlayer(), 'Alice');
    assert.deepStrictEqual(state.players, ['Alice']);
    assert.strictEqual(document.getElementById('player-tiles').children.length, 1);
  });

  it('should update life totals from the player tile controls', () => {
    state.players = ['Alice'];
    state.playerState = {
      Alice: { life: 40, poison: 0, dead: false },
    };
    updateCurrentGamePlayersUI();

    document.querySelector('.life-btn[data-change="-1"]').click();

    assert.strictEqual(state.playerState.Alice.life, 39);
    assert.strictEqual(
      document.querySelector('.player-tile[data-player="Alice"] .life-total').textContent,
      '39'
    );
  });

  it('should declare a winner from the player tile action', async () => {
    state.players = ['Alice', 'Bob'];
    state.playerState = {
      Alice: { life: 27, poison: 0, dead: false },
      Bob: { life: 14, poison: 0, dead: false },
    };
    updateCurrentGamePlayersUI();

    document
      .querySelector('.player-tile[data-player="Alice"] .declare-winner-btn')
      .click();
    document.getElementById('confirm-modal-ok').click();
    await delay(0);

    assert.strictEqual(state.gameEnded, true);
    assert.strictEqual(state.winner, 'Alice');
    assert.strictEqual(getGameLog().length, 1);
    assert.strictEqual(getGameLog()[0].winner, 'Alice');
    assert.strictEqual(document.getElementById('add-player-btn').style.display, 'none');
  });

  it('should start a new game and re-add the default player', async () => {
    global.localStorage.setItem('cmdrtrackr_default_player', 'Alice');
    state.players = ['Alice', 'Bob'];
    state.playerState = {
      Alice: { life: 21, poison: 1, dead: false },
      Bob: { life: 12, poison: 0, dead: true },
    };
    state.gameEnded = true;
    state.winner = 'Alice';
    state.commanderDamage = { Bob: { Alice: 6 } };
    updateCurrentGamePlayersUI();

    document.getElementById('new-game-btn').click();
    document.getElementById('confirm-modal-ok').click();
    await delay(0);

    assert.deepStrictEqual(state.players, ['Alice']);
    assert.deepStrictEqual(state.playerState, {
      Alice: { life: 40, poison: 0, dead: false },
    });
    assert.deepStrictEqual(state.commanderDamage, {});
    assert.strictEqual(state.gameEnded, false);
    assert.strictEqual(state.winner, null);
  });
});

describe('Commander Damage', () => {
  beforeEach(() => {
    setupEventTestDOM();
    state.players = ['Alice', 'Bob'];
    state.playerState = {
      Alice: { life: 40, poison: 0, dead: false },
      Bob: { life: 40, poison: 0, dead: false },
    };
    updateCurrentGamePlayersUI();
  });

  it('should reduce life when commander damage is assigned', () => {
    changeCommanderDamage('Alice', 'Bob', 3);

    assert.strictEqual(state.commanderDamage.Alice.Bob, 3);
    assert.strictEqual(state.playerState.Alice.life, 37);
    assert.strictEqual(
      document.querySelector('.player-tile[data-player="Alice"] .life-total').textContent,
      '37'
    );
  });

  it('should restore life when commander damage is removed', () => {
    changeCommanderDamage('Alice', 'Bob', 4);
    changeCommanderDamage('Alice', 'Bob', -2);

    assert.strictEqual(state.commanderDamage.Alice.Bob, 2);
    assert.strictEqual(state.playerState.Alice.life, 38);
  });
});
