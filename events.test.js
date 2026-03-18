import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { setTimeout as delay } from 'node:timers/promises';
import { createEvent } from './dom-fixture.js';
import {
  state,
  getDefaultPlayer,
  getGameLog,
  getSavedPlayers,
  getStartingLife,
  savePlayer,
} from './state.js';
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

  it('should undo the last gameplay action', () => {
    state.players = ['Alice'];
    state.playerState = {
      Alice: { life: 40, poison: 0, dead: false },
    };
    updateCurrentGamePlayersUI();

    document.querySelector('.life-btn[data-change="-1"]').click();
    document.getElementById('undo-btn').click();

    assert.strictEqual(state.playerState.Alice.life, 40);
    assert.strictEqual(
      document.querySelector('.player-tile[data-player="Alice"] .life-total').textContent,
      '40'
    );
    assert.strictEqual(document.getElementById('undo-btn').disabled, true);
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

  it('should save the starting life preset from settings and use it for a new game', async () => {
    savePlayer('Alice');
    global.localStorage.setItem('cmdrtrackr_default_player', 'Alice');

    const select = document.getElementById('settings-starting-life-select');
    select.value = '30';
    select.dispatchEvent(createEvent('change'));

    state.players = ['Alice'];
    state.playerState = {
      Alice: { life: 18, poison: 0, dead: false },
    };
    updateCurrentGamePlayersUI();

    document.getElementById('new-game-btn').click();
    document.getElementById('confirm-modal-ok').click();
    await delay(0);

    assert.strictEqual(getStartingLife(), 30);
    assert.deepStrictEqual(state.playerState, {
      Alice: { life: 30, poison: 0, dead: false },
    });
    assert.strictEqual(
      document.getElementById('settings-data-status').textContent,
      'Starting life set to 30.'
    );
  });

  it('should load the configured starting life when opening settings', () => {
    global.localStorage.setItem('cmdrtrackr_starting_life', '30');

    document.getElementById('settings-link').click();

    assert.strictEqual(document.getElementById('settings-modal').hidden, false);
    assert.strictEqual(document.getElementById('settings-starting-life-select').value, '30');
  });

  it('should export app data through the data transfer modal', () => {
    savePlayer('Alice');
    state.players = ['Alice'];
    state.playerState = {
      Alice: { life: 34, poison: 1, dead: false },
    };
    updateCurrentGamePlayersUI();

    document.getElementById('export-data-btn').click();

    const exported = JSON.parse(document.getElementById('data-transfer-textarea').value);
    assert.strictEqual(document.getElementById('data-transfer-modal').hidden, false);
    assert.deepStrictEqual(exported.savedPlayers, ['Alice']);
    assert.deepStrictEqual(exported.currentGame.players, ['Alice']);
    assert.strictEqual(document.getElementById('apply-import-btn').hidden, true);
  });

  it('should import app data from the data transfer modal', async () => {
    document.getElementById('import-data-btn').click();
    document.getElementById('data-transfer-textarea').value = JSON.stringify({
      version: 2,
      savedPlayers: ['Alice', 'Bob'],
      defaultPlayer: 'Alice',
      startingLife: 30,
      currentGame: {
        version: 2,
        players: ['Alice', 'Bob'],
        playerState: {
          Alice: { life: 28, poison: 1, dead: false },
          Bob: { life: 40, poison: 0, dead: false },
        },
        gameEnded: false,
        winner: null,
        commanderDamage: {
          Bob: { Alice: 5 },
        },
      },
      gameLog: [],
    });

    document.getElementById('apply-import-btn').click();
    document.getElementById('confirm-modal-ok').click();
    await delay(0);

    assert.deepStrictEqual(getSavedPlayers(), ['Alice', 'Bob']);
    assert.strictEqual(getDefaultPlayer(), 'Alice');
    assert.strictEqual(getStartingLife(), 30);
    assert.deepStrictEqual(state.players, ['Alice', 'Bob']);
    assert.strictEqual(state.playerState.Alice.life, 28);
    assert.deepStrictEqual(state.commanderDamage, {
      Bob: { Alice: 5 },
    });
    assert.strictEqual(document.getElementById('settings-data-status').textContent, 'Import complete.');
  });

  it('should filter game log entries by player or winner text', () => {
    global.localStorage.setItem(
      'cmdrtrackr_game_log',
      JSON.stringify([
        {
          id: 1,
          winner: 'Alice',
          players: ['Alice', 'Bob'],
          lifeTotals: { Alice: 22, Bob: 0 },
          endedAt: '2026-03-17T10:00:00.000Z',
        },
        {
          id: 2,
          winner: 'Carol',
          players: ['Carol', 'Dave'],
          lifeTotals: { Carol: 11, Dave: 0 },
          endedAt: '2026-03-17T11:00:00.000Z',
        },
      ])
    );

    document.getElementById('view-log-link').click();

    assert.strictEqual(document.querySelectorAll('.game-log-entry').length, 2);

    const filterInput = document.getElementById('game-log-filter-input');
    filterInput.value = 'dave';
    filterInput.dispatchEvent(createEvent('input'));

    const entries = document.querySelectorAll('.game-log-entry');
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].dataset.logId, '2');
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

  it('should undo commander damage and restore life totals', () => {
    changeCommanderDamage('Alice', 'Bob', 3);

    document.getElementById('undo-btn').click();

    assert.deepStrictEqual(state.commanderDamage, {});
    assert.strictEqual(state.playerState.Alice.life, 40);
    assert.strictEqual(
      document.querySelector('.player-tile[data-player="Alice"] .life-total').textContent,
      '40'
    );
  });

  it('should prompt to mark a player dead at 21 commander damage from one opponent', async () => {
    changeCommanderDamage('Alice', 'Bob', 20);

    document
      .querySelector('.player-tile[data-player="Alice"] .commander-damage-btn')
      .click();
    const commanderButtons = document
      .getElementById('commander-damage-list')
      .querySelectorAll('.commander-damage-btn');
    commanderButtons[1].click();
    document.getElementById('confirm-modal-ok').click();
    await delay(0);

    assert.strictEqual(state.commanderDamage.Alice.Bob, 21);
    assert.strictEqual(state.playerState.Alice.dead, true);
    assert.strictEqual(document.getElementById('commander-damage-modal').hidden, true);
  });

  it('should keep the player alive if commander lethal is declined', async () => {
    changeCommanderDamage('Alice', 'Bob', 20);

    document
      .querySelector('.player-tile[data-player="Alice"] .commander-damage-btn')
      .click();
    const commanderButtons = document
      .getElementById('commander-damage-list')
      .querySelectorAll('.commander-damage-btn');
    commanderButtons[1].click();
    document.getElementById('confirm-modal-cancel').click();
    await delay(0);

    assert.strictEqual(state.commanderDamage.Alice.Bob, 21);
    assert.strictEqual(state.playerState.Alice.dead, false);
    assert.strictEqual(document.getElementById('commander-damage-modal').hidden, false);
  });

  it('should gray out and disable dead opponents in the commander damage modal', () => {
    state.players = ['Alice', 'Bob', 'Carol'];
    state.playerState = {
      Alice: { life: 40, poison: 0, dead: false },
      Bob: { life: 40, poison: 0, dead: true },
      Carol: { life: 40, poison: 0, dead: false },
    };
    updateCurrentGamePlayersUI();

    document
      .querySelector('.player-tile[data-player="Alice"] .commander-damage-btn')
      .click();

    const rows = document
      .getElementById('commander-damage-list')
      .querySelectorAll('.commander-damage-row');
    let bobRow;
    let carolRow;
    for (const row of rows) {
      const name = row.querySelector('.commander-opponent-name').textContent;
      if (name === 'Bob') bobRow = row;
      if (name === 'Carol') carolRow = row;
    }

    assert.ok(bobRow.classList.contains('dead-player-row'));
    assert.strictEqual(
      bobRow.querySelectorAll('.commander-damage-btn')[0].disabled,
      true
    );
    assert.strictEqual(
      bobRow.querySelectorAll('.commander-damage-btn')[1].disabled,
      true
    );
    assert.strictEqual(carolRow.classList.contains('dead-player-row'), false);
    assert.strictEqual(
      carolRow.querySelectorAll('.commander-damage-btn')[0].disabled,
      false
    );
    assert.strictEqual(
      carolRow.querySelectorAll('.commander-damage-btn')[1].disabled,
      false
    );
  });
});

describe('Poison Counters', () => {
  beforeEach(() => {
    setupEventTestDOM();
    state.players = ['Alice'];
    state.playerState = {
      Alice: { life: 40, poison: 9, dead: false },
    };
    updateCurrentGamePlayersUI();
  });

  it('should prompt to mark a player dead when poison reaches ten', async () => {
    document
      .querySelector('.player-tile[data-player="Alice"] .poison-btn')
      .click();
    document.getElementById('poison-plus-btn').click();
    document.getElementById('confirm-modal-ok').click();
    await delay(0);

    assert.strictEqual(state.playerState.Alice.poison, 10);
    assert.strictEqual(state.playerState.Alice.dead, true);
    assert.strictEqual(document.getElementById('poison-modal').hidden, true);
    assert.strictEqual(state.currentPoisonPlayer, null);
  });

  it('should keep the player alive if the poison death prompt is declined', async () => {
    document
      .querySelector('.player-tile[data-player="Alice"] .poison-btn')
      .click();
    document.getElementById('poison-plus-btn').click();
    document.getElementById('confirm-modal-cancel').click();
    await delay(0);

    assert.strictEqual(state.playerState.Alice.poison, 10);
    assert.strictEqual(state.playerState.Alice.dead, false);
    assert.strictEqual(document.getElementById('poison-modal').hidden, false);
    assert.strictEqual(state.currentPoisonPlayer, 'Alice');
  });
});
