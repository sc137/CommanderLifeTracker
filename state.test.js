import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  state,
  restoreBackupState,
  saveState,
  loadState,
  getSavedPlayers,
  savePlayer,
  removePlayer,
  setDefaultPlayer,
  getDefaultPlayer,
  addPlayerToGame,
  removePlayerFromGame,
  ensurePlayerState,
  reorderPlayers,
  logGame,
  getGameLog,
  deleteGameLogEntry,
  serializeAppData,
  importAppData,
} from './state.js';
import { ensureGlobals, resetState } from './fixtures.js';

describe('State Management', () => {
  beforeEach(() => {
    ensureGlobals();
    global.localStorage.clear();
    resetState();
  });

  it('should save and load state', () => {
    state.players = ['Player 1', 'Player 2'];
    state.playerState = {
      'Player 1': { life: 40, poison: 0, dead: false },
      'Player 2': { life: 35, poison: 1, dead: false },
    };
    state.commanderDamage = { 'Player 1': { 'Player 2': 3 } };
    saveState();
    state.players = [];
    state.playerState = {};
    state.commanderDamage = {};
    loadState();
    assert.deepStrictEqual(state.players, ['Player 1', 'Player 2']);
    assert.deepStrictEqual(state.playerState, {
      'Player 1': { life: 40, poison: 0, dead: false },
      'Player 2': { life: 35, poison: 1, dead: false },
    });
    assert.deepStrictEqual(state.commanderDamage, { 'Player 1': { 'Player 2': 3 } });
  });

  it('should load legacy saved state without version metadata', () => {
    global.localStorage.setItem(
      'cmdrtrackr_current_game',
      JSON.stringify({
        players: ['Player 1'],
        state: { 'Player 1': { life: 32, poison: 2, dead: false } },
        gameEnded: false,
        winner: null,
      })
    );

    loadState();

    assert.deepStrictEqual(state.players, ['Player 1']);
    assert.deepStrictEqual(state.playerState, {
      'Player 1': { life: 32, poison: 2, dead: false },
    });
    assert.deepStrictEqual(state.commanderDamage, {});
  });

  it('should save and get players', () => {
    savePlayer('Player 1');
    savePlayer('Player 2');
    assert.deepStrictEqual(getSavedPlayers(), ['Player 1', 'Player 2']);
  });

  it('should remove a player', () => {
    savePlayer('Player 1');
    savePlayer('Player 2');
    removePlayer('Player 1');
    assert.deepStrictEqual(getSavedPlayers(), ['Player 2']);
  });

  it('should set and get the default player', () => {
    setDefaultPlayer('Player 1');
    assert.strictEqual(getDefaultPlayer(), 'Player 1');
  });

  it('should add a player to the game', () => {
    addPlayerToGame('Player 1');
    assert.deepStrictEqual(state.players, ['Player 1']);
  });

  it('should remove a player from the game', () => {
    addPlayerToGame('Player 1');
    addPlayerToGame('Player 2');
    removePlayerFromGame('Player 1');
    assert.deepStrictEqual(state.players, ['Player 2']);
  });

  it('should ensure player state', () => {
    ensurePlayerState('Player 1');
    assert.deepStrictEqual(state.playerState['Player 1'], { life: 40, poison: 0, dead: false });
  });

  it('should reorder players', () => {
    addPlayerToGame('Player 1');
    addPlayerToGame('Player 2');
    reorderPlayers('Player 1', 'Player 2');
    assert.deepStrictEqual(state.players, ['Player 2', 'Player 1']);
  });

  it('should swap players when moving later to earlier position', () => {
    addPlayerToGame('Player A');
    addPlayerToGame('Player B');
    addPlayerToGame('Player C');
    reorderPlayers('Player C', 'Player A');
    assert.deepStrictEqual(state.players, ['Player C', 'Player B', 'Player A']);
  });

  it('should log a game', () => {
    logGame('Player 1', ['Player 1', 'Player 2'], { 'Player 1': 40, 'Player 2': 30 });
    const log = getGameLog();
    assert.strictEqual(log.length, 1);
    assert.strictEqual(log[0].winner, 'Player 1');
  });

  it('should delete a game log entry', () => {
    logGame('Player 1', ['Player 1', 'Player 2'], { 'Player 1': 40, 'Player 2': 30 });
    const log = getGameLog();
    deleteGameLogEntry(log[0].id);
    assert.strictEqual(getGameLog().length, 0);
  });

  it('should restore the previous saved game snapshot', () => {
    state.players = ['Player 1'];
    state.playerState = { 'Player 1': { life: 40, poison: 0, dead: false } };
    saveState();

    state.players = ['Player 1', 'Player 2'];
    state.playerState = {
      'Player 1': { life: 17, poison: 0, dead: false },
      'Player 2': { life: 40, poison: 0, dead: false },
    };
    saveState();

    assert.strictEqual(restoreBackupState(), true);
    assert.deepStrictEqual(state.players, ['Player 1']);
    assert.deepStrictEqual(state.playerState, {
      'Player 1': { life: 40, poison: 0, dead: false },
    });
  });

  it('should round-trip exported app data through import', () => {
    savePlayer('Player 1');
    savePlayer('Player 2');
    setDefaultPlayer('Player 1');
    state.players = ['Player 1', 'Player 2'];
    state.playerState = {
      'Player 1': { life: 31, poison: 1, dead: false },
      'Player 2': { life: 24, poison: 0, dead: false },
    };
    state.commanderDamage = {
      'Player 2': { 'Player 1': 6 },
    };
    saveState();
    logGame('Player 1', ['Player 1', 'Player 2'], { 'Player 1': 31, 'Player 2': 24 });

    const exported = serializeAppData();

    global.localStorage.clear();
    resetState();

    assert.strictEqual(importAppData(exported), true);
    assert.deepStrictEqual(getSavedPlayers(), ['Player 1', 'Player 2']);
    assert.strictEqual(getDefaultPlayer(), 'Player 1');
    assert.deepStrictEqual(state.players, ['Player 1', 'Player 2']);
    assert.deepStrictEqual(state.playerState, {
      'Player 1': { life: 31, poison: 1, dead: false },
      'Player 2': { life: 24, poison: 0, dead: false },
    });
    assert.deepStrictEqual(state.commanderDamage, {
      'Player 2': { 'Player 1': 6 },
    });
    assert.strictEqual(getGameLog().length, 1);
  });

  it('should reject malformed app data imports without mutating state', () => {
    savePlayer('Keep');
    state.players = ['Keep'];
    state.playerState = { Keep: { life: 40, poison: 0, dead: false } };
    saveState();

    const beforeCurrentGame = global.localStorage.getItem('cmdrtrackr_current_game');
    const beforeSavedPlayers = getSavedPlayers();
    const beforePlayerState = JSON.stringify(state.playerState);

    const malformedPayloads = [
      null,
      'bad',
      {
        savedPlayers: 'not-array',
        currentGame: {},
        gameLog: [],
      },
      {
        savedPlayers: ['Keep', 'Keep'],
        defaultPlayer: 'Keep',
        currentGame: {
          players: ['Keep'],
          playerState: { Keep: { life: 40, poison: 0, dead: false } },
          gameEnded: false,
          winner: null,
          commanderDamage: {},
        },
        gameLog: [],
      },
      {
        savedPlayers: ['Keep'],
        defaultPlayer: 'Keep',
        currentGame: {
          players: ['Keep'],
          playerState: { Keep: { life: 40, poison: 0, dead: false } },
          gameEnded: false,
          winner: null,
          commanderDamage: {},
        },
        gameLog: {},
      },
    ];

    malformedPayloads.forEach((payload) => {
      assert.strictEqual(importAppData(payload), false);
    });

    assert.deepStrictEqual(getSavedPlayers(), beforeSavedPlayers);
    assert.strictEqual(global.localStorage.getItem('cmdrtrackr_current_game'), beforeCurrentGame);
    assert.strictEqual(JSON.stringify(state.playerState), beforePlayerState);
  });
});
