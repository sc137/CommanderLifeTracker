import { createDOM } from './dom-fixture.js';
import { state } from './state.js';

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

function ensureGlobals() {
  global.window = {
    matchMedia: () => ({ matches: false }),
    navigator: {},
    addEventListener() {},
  };
  global.localStorage = new LocalStorageMock();
}

function resetState() {
  state.players = [];
  state.playerState = {};
  state.gameEnded = false;
  state.winner = null;
  state.selectedPlayers = new Set();
  state.draggedPlayer = null;
  state.currentPoisonPlayer = null;
  state.commanderDamage = {};
  state.undoStack = [];
}

function appendElement(doc, tagName, id, parent = doc.body) {
  const el = doc.createElement(tagName);
  if (id) {
    el.id = id;
  }
  parent.appendChild(el);
  return el;
}

function appendModal(doc, id) {
  const modal = appendElement(doc, 'div', id);
  modal.classList.add('modal');
  modal.hidden = true;
  return modal;
}

function setupAppDOM() {
  ensureGlobals();
  const doc = createDOM();

  appendElement(doc, 'button', 'hamburger');

  const menuOverlay = appendElement(doc, 'div', 'menu-overlay');
  menuOverlay.hidden = true;
  const menuPanel = appendElement(doc, 'nav', null, menuOverlay);
  menuPanel.classList.add('menu-panel');
  appendElement(doc, 'a', 'view-log-link', menuPanel);
  appendElement(doc, 'a', 'settings-link', menuPanel);
  appendElement(doc, 'a', 'about-link', menuPanel);

  appendElement(doc, 'div', 'player-tiles');
  appendElement(doc, 'button', 'new-game-btn');
  appendElement(doc, 'button', 'add-player-btn');
  appendElement(doc, 'button', 'undo-btn');

  appendElement(doc, 'div', 'modal-overlay');

  const addPlayerModal = appendModal(doc, 'add-player-modal');
  appendElement(doc, 'div', 'saved-players-list', addPlayerModal);
  appendElement(doc, 'button', 'new-player-btn', addPlayerModal);
  appendElement(doc, 'button', 'add-player-done-btn', addPlayerModal);
  appendElement(doc, 'button', 'close-add-player-btn', addPlayerModal);

  const newPlayerModal = appendModal(doc, 'new-player-modal');
  appendElement(doc, 'input', 'new-player-input', newPlayerModal);
  appendElement(doc, 'button', 'save-new-player-btn', newPlayerModal);
  appendElement(doc, 'button', 'cancel-new-player-btn', newPlayerModal);

  const commanderDamageModal = appendModal(doc, 'commander-damage-modal');
  appendElement(doc, 'div', 'commander-damage-title', commanderDamageModal);
  appendElement(doc, 'div', 'commander-damage-list', commanderDamageModal);
  appendElement(doc, 'button', 'close-commander-damage-btn', commanderDamageModal);

  const poisonModal = appendModal(doc, 'poison-modal');
  appendElement(doc, 'div', 'poison-modal-title', poisonModal);
  appendElement(doc, 'div', 'poison-count-display', poisonModal);
  appendElement(doc, 'button', 'poison-minus-btn', poisonModal);
  appendElement(doc, 'button', 'poison-plus-btn', poisonModal);
  appendElement(doc, 'button', 'close-poison-modal-btn', poisonModal);

  const gameLogModal = appendModal(doc, 'game-log-modal');
  appendElement(doc, 'input', 'game-log-filter-input', gameLogModal);
  appendElement(doc, 'div', 'game-log-list', gameLogModal);
  appendElement(doc, 'button', 'close-game-log-btn', gameLogModal);

  const settingsModal = appendModal(doc, 'settings-modal');
  appendElement(doc, 'select', 'settings-starting-life-select', settingsModal);
  appendElement(doc, 'div', 'settings-players-list', settingsModal);
  appendElement(doc, 'button', 'settings-add-player-btn', settingsModal);
  appendElement(doc, 'button', 'export-data-btn', settingsModal);
  appendElement(doc, 'button', 'import-data-btn', settingsModal);
  appendElement(doc, 'button', 'restore-backup-btn', settingsModal);
  appendElement(doc, 'div', 'settings-data-status', settingsModal);
  appendElement(doc, 'button', 'close-settings-btn', settingsModal);

  const dataTransferModal = appendModal(doc, 'data-transfer-modal');
  appendElement(doc, 'div', 'data-transfer-title', dataTransferModal);
  appendElement(doc, 'div', 'data-transfer-help', dataTransferModal);
  appendElement(doc, 'textarea', 'data-transfer-textarea', dataTransferModal);
  appendElement(doc, 'div', 'data-transfer-status', dataTransferModal);
  appendElement(doc, 'button', 'apply-import-btn', dataTransferModal);
  appendElement(doc, 'button', 'close-data-transfer-btn', dataTransferModal);

  const aboutModal = appendModal(doc, 'about-modal');
  appendElement(doc, 'button', 'close-about-btn', aboutModal);

  const confirmModal = appendModal(doc, 'confirm-modal');
  appendElement(doc, 'div', 'confirm-modal-title', confirmModal);
  appendElement(doc, 'div', 'confirm-modal-message', confirmModal);
  appendElement(doc, 'button', 'confirm-modal-cancel', confirmModal);
  appendElement(doc, 'button', 'confirm-modal-ok', confirmModal);

  return doc;
}

export { LocalStorageMock, ensureGlobals, resetState, setupAppDOM };
