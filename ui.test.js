import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { state } from './state.js';
import {
  initUI,
  createPlayerTile,
  updateCurrentGamePlayersUI,
  showModal,
  hideModal,
  showInputError,
  clearInputError,
  updateAddPlayerBtnVisibility,
  updateCommanderDamageIndicator,
} from './ui.js';
import { setTimeout as delay } from 'node:timers/promises';
import { ensureGlobals, resetState, setupAppDOM } from './fixtures.js';

describe('UI Management', () => {
  beforeEach(() => {
    ensureGlobals();
    const doc = setupAppDOM();
    global.document = doc;
    resetState();
    initUI();
  });

  it('should create a player tile', () => {
    state.playerState['Player 1'] = { life: 40, poison: 0, dead: false };
    const tile = createPlayerTile('Player 1');
    assert.ok(tile);
    assert.strictEqual(tile.dataset.player, 'Player 1');
    const life = tile.querySelector('.life-total');
    assert.strictEqual(life.textContent, '40');
  });

  it('should update the current game players UI', () => {
    state.players = ['Player 1'];
    state.playerState = { 'Player 1': { life: 40, poison: 0, dead: false } };
    updateCurrentGamePlayersUI();
    const tiles = document.getElementById('player-tiles');
    assert.strictEqual(tiles.children.length, 1);
    assert.strictEqual(tiles.children[0].dataset.player, 'Player 1');
  });

  it('should use a dedicated layout class for four players', () => {
    state.players = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
    state.playerState = {
      'Player 1': { life: 40, poison: 0, dead: false },
      'Player 2': { life: 40, poison: 0, dead: false },
      'Player 3': { life: 40, poison: 0, dead: false },
      'Player 4': { life: 40, poison: 0, dead: false },
    };

    updateCurrentGamePlayersUI();

    assert.strictEqual(
      document.getElementById('player-tiles').classList.contains('four-player-layout'),
      true
    );
  });

  it('should show and hide a modal', () => {
    showModal('add-player-modal');
    const modal = document.getElementById('add-player-modal');
    const overlay = document.getElementById('modal-overlay');
    assert.strictEqual(modal.hidden, false);
    assert.strictEqual(overlay.hidden, false);
    hideModal();
    assert.strictEqual(modal.hidden, true);
    assert.strictEqual(overlay.hidden, true);
  });

  it('new player modal should focus input after delay', async () => {
    showModal('new-player-modal');
    await delay(60);
    const input = document.getElementById('new-player-input');
    assert.strictEqual(document.activeElement, input);
  });

  it('new player modal should focus input immediately in standalone mode', () => {
    global.window.matchMedia = () => ({ matches: true });
    showModal('new-player-modal');
    const input = document.getElementById('new-player-input');
    assert.strictEqual(document.activeElement, input);
  });

  it('should show an input error', () => {
    showInputError('Test error');
    const err = document.getElementById('new-player-error');
    assert.ok(err);
    assert.strictEqual(err.textContent, 'Test error');
  });

  it('should clear an input error', () => {
    showInputError('Test error');
    clearInputError();
    assert.strictEqual(document.getElementById('new-player-error'), null);
  });

  it('commander damage indicator updates', () => {
    state.players = ['Alice'];
    state.playerState = { 'Alice': { life: 40, poison: 0, dead: false } };
    state.commanderDamage = { 'Alice': { Bob: 0 } };
    updateCurrentGamePlayersUI();
    const btn = document.querySelector('.commander-damage-btn');
    assert.strictEqual(btn.classList.contains('has-commander-damage'), false);
    state.commanderDamage['Alice'].Bob = 5;
    updateCommanderDamageIndicator('Alice');
    assert.strictEqual(btn.classList.contains('has-commander-damage'), true);
  });

  it('should update the add player button visibility', () => {
    state.gameEnded = true;
    updateAddPlayerBtnVisibility();
    const btn = document.getElementById('add-player-btn');
    assert.strictEqual(btn.style.display, 'none');
  });

  it('should display winner state after reload', () => {
    state.players = ['Alice', 'Bob'];
    state.playerState = {
      Alice: { life: 20, poison: 0, dead: false },
      Bob: { life: 15, poison: 0, dead: false },
    };
    state.gameEnded = true;
    state.winner = 'Alice';
    updateCurrentGamePlayersUI();
    const tiles = document.getElementById('player-tiles').children;
    let aliceTile, bobTile;
    for (const t of tiles) {
      if (t.dataset.player === 'Alice') aliceTile = t;
      if (t.dataset.player === 'Bob') bobTile = t;
    }
    assert.ok(aliceTile.classList.contains('winner-tile'));
    assert.ok(aliceTile.classList.contains('game-ended'));
    assert.ok(!bobTile.classList.contains('winner-tile'));
    assert.ok(bobTile.classList.contains('game-ended'));
    for (const btn of aliceTile.querySelectorAll('button')) {
      assert.strictEqual(btn.disabled, true);
    }
  });
});
