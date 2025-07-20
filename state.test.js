import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  state,
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
} from './state.js';

class LocalStorageMock {
  constructor() { this.store = {}; }
  clear() { this.store = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
  setItem(k,v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
}

global.localStorage = new LocalStorageMock();

describe('State Management', () => {
  beforeEach(() => {
    global.localStorage.clear();
    state.players = [];
    state.playerState = {};
    state.gameEnded = false;
    state.winner = null;
  });

  it('should save and load state', () => {
    state.players = ['Player 1'];
    state.playerState = { 'Player 1': { life: 40, poison: 0, dead: false } };
    saveState();
    state.players = [];
    state.playerState = {};
    loadState();
    assert.deepStrictEqual(state.players, ['Player 1']);
    assert.deepStrictEqual(state.playerState, { 'Player 1': { life: 40, poison: 0, dead: false } });
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
});
